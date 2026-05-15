/**
 * POST /api/payments/webhook
 * Handles Stripe webhook events. Signature is verified with STRIPE_WEBHOOK_SECRET
 * before any business logic runs — unsigned requests are rejected with 400.
 *
 * Events handled:
 *   payment_intent.amount_capturable_updated — card authorized; assign contractor
 *   payment_intent.succeeded                 — payment captured; mark paid
 *   payment_intent.payment_failed            — charge failed; cancel booking
 *   charge.dispute.created                   — chargeback opened; flag booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/stripe/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendChargebackAlertEmail } from '@/lib/email';
import Stripe from 'stripe';

// Required for raw body access in Next.js Route Handlers
export const runtime = 'nodejs';

/** Shape of a booking row matching columns used in this webhook handler */
interface BookingRow {
    id: string;
    user_id: string | null;
    contractor_id: string | null;
    service_name: string | null;
    zip_code: string | null;
    status: string | null;
    payment_status: string | null;
    payment_intent_id: string | null;
    confirmation_code: string | null;
    total_amount: number | null;
    scheduled_date: string | null;
    scheduled_time: string | null;
    locale: string | null;
}

export async function POST(req: NextRequest) {
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let rawBody: string;
    try {
        rawBody = await req.text();
    } catch {
        return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        // verifyWebhookSignature calls stripe.webhooks.constructEvent — throws on bad signature.
        event = verifyWebhookSignature(rawBody, signature);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json(
            { error: `Webhook error: ${(err as Error).message}` },
            { status: 400 }
        );
    }

    const supabase = createServiceClient();

    // Idempotency: skip events we've already processed (handles Stripe retries)
    const { data: existing } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('stripe_event_id', event.id)
        .maybeSingle();

    if (existing) {
        return NextResponse.json({ received: true, skipped: true });
    }

    // Record this event before processing to prevent race condition on concurrent retries.
    // A UNIQUE constraint on stripe_event_id guarantees exactly-once delivery at the DB level.
    const { error: insertError } = await supabase
        .from('webhook_events')
        .insert({ stripe_event_id: event.id, type: event.type });

    if (insertError) {
        // code 23505 = Postgres UNIQUE_VIOLATION — duplicate event, already processed
        if ((insertError as { code?: string }).code === '23505') {
            return NextResponse.json({ received: true, skipped: true });
        }
        // Any other insert failure is a hard error — do not process to avoid duplicate side-effects
        console.error('webhook: failed to record event for idempotency:', insertError);
        return NextResponse.json({ error: 'Failed to record webhook event' }, { status: 500 });
    }

    console.log(`Webhook received: ${event.type}`);

    switch (event.type) {
        case 'payment_intent.amount_capturable_updated': {
            // Card was authorized — funds are held. Confirm the booking and auto-assign a contractor.
            const pi = event.data.object as Stripe.PaymentIntent;
            const bookingId = pi.metadata?.bookingId;
            const safeId = bookingId ? String(bookingId).replace(/[^a-zA-Z0-9\-_]/g, '') : '';
            if (safeId && safeId !== 'test_booking' && safeId === bookingId) {
                const { data: updatedBooking } = await supabase
                    .from('bookings')
                    // pending_payment → pending_assignment (card authorized; now visible to contractors)
                    // .eq('payment_status', 'unpaid') ensures idempotency: duplicate events are no-ops
                    .update({ payment_status: 'authorized', status: 'pending_assignment' })
                    .eq('id', safeId)
                    .eq('payment_status', 'unpaid')
                    .select()
                    .single();

                if (updatedBooking) {
                    const booking = updatedBooking as BookingRow;
                    const serviceName = booking.service_name ?? 'Detailing Service';
                    const zipCode = booking.zip_code ?? '';
                    const bookingWithService = { ...updatedBooking, service_name: serviceName };

                    const { notify } = await import('@/lib/notifications');

                    // Send booking confirmation email to customer now that payment is authorized
                    await notify({ type: 'booking.confirmed', booking: bookingWithService }).catch(
                        (err) => console.error('webhook: customer confirmation email failed:', err)
                    );

                    // Broadcast to eligible contractors — first to accept wins.
                    // Skill-filtering: NULL verified_service_type_ids = not yet reviewed (include),
                    // empty array = cleared (skip), otherwise match booking service.
                    const bookingServiceIdWh: number | null =
                        updatedBooking.service_id ? Number(updatedBooking.service_id) : null;
                    const { data: contractors } = await supabase
                        .from('profiles')
                        .select('id, email, verified_service_type_ids')
                        .eq('role', 'contractor')
                        .eq('approval_status', 'approved')
                        .eq('is_available', true);

                    const eligibleWh = (contractors ?? []).filter((c: { id: string; email: string; verified_service_type_ids: number[] | null }) => {
                        const v = c.verified_service_type_ids;
                        if (v === null || v === undefined) return true;
                        if (v.length === 0) return false;
                        if (bookingServiceIdWh && !v.includes(bookingServiceIdWh)) return false;
                        return true;
                    });

                    if (eligibleWh.length > 0) {
                        await Promise.all(
                            eligibleWh.map((c: { id: string; email: string; verified_service_type_ids: number[] | null }) =>
                                notify({
                                    type: 'contractor.job_assigned',
                                    booking: bookingWithService,
                                    contractorEmail: c.email,
                                })
                            )
                        );

                        const bookingLocale = updatedBooking.locale || 'en';
                        const notificationRows = eligibleWh.map((c: { id: string; email: string; verified_service_type_ids: number[] | null }) => ({
                            user_id: c.id,
                            type: 'info' as const,
                            title: 'New Job Available',
                            message: `New detailing job in ${zipCode}. Tap to view and accept.`,
                            booking_id: updatedBooking.id,
                            is_read: false,
                            link: `/${bookingLocale}/contractor/jobs/${updatedBooking.id}`,
                        }));

                        const { error: notifError } = await supabase.from('notifications').insert(notificationRows);
                        if (notifError) console.error('webhook: contractor notification insert failed:', notifError);
                    } else {
                        console.warn(`webhook: no eligible contractors (after skill filter) for booking ${bookingId}`);
                    }
                }
            }
            break;
        }

        case 'payment_intent.succeeded': {
            // Payment was captured. Two cases:
            // 1. Manual capture flow (cards): booking was 'authorized', admin captured → mark paid.
            // 2. Auto-capture payment methods (Cash App Pay etc.): Stripe skips
            //    'amount_capturable_updated' and fires 'succeeded' directly while booking is
            //    still 'unpaid'. Must handle both paths.
            const pi = event.data.object as Stripe.PaymentIntent;
            const bookingId = pi.metadata?.bookingId;
            const safeId2 = bookingId ? String(bookingId).replace(/[^a-zA-Z0-9\-_]/g, '') : '';
            if (!safeId2 || safeId2 === 'test_booking' || safeId2 !== bookingId) break;

            // Fetch current state BEFORE updating so we can detect which path this is
            const { data: preUpdateBooking } = await supabase
                .from('bookings')
                .select('payment_status, service_name, zip_code, status')
                .eq('id', safeId2)
                .single();

            const wasAutoCapture = preUpdateBooking?.payment_status === 'unpaid';

            const { data: updatedBooking2 } = await supabase
                .from('bookings')
                .update({ payment_status: 'paid', status: 'confirmed' })
                .eq('id', safeId2)
                .in('payment_status', ['authorized', 'unpaid']) // covers both paths
                .select()
                .single();

            console.log(`Payment succeeded for booking ${bookingId} (auto-capture: ${wasAutoCapture})`);

            // For auto-capture methods (Cash App etc.) the 'amount_capturable_updated' event
            // never fired — contractor assignment + confirmation email were never sent. Do it now.
            if (updatedBooking2 && wasAutoCapture) {
                const booking2 = updatedBooking2 as BookingRow;
                const serviceName2 = booking2.service_name ?? 'Detailing Service';
                const zipCode2 = booking2.zip_code ?? '';
                const bookingWithService2 = { ...updatedBooking2, service_name: serviceName2 };
                const { notify: notify2 } = await import('@/lib/notifications');

                await notify2({ type: 'booking.confirmed', booking: bookingWithService2 }).catch(
                    (err) => console.error('webhook: customer confirmation email (auto-capture) failed:', err)
                );

                const bookingServiceIdAc: number | null =
                    (updatedBooking2 as BookingRow & { service_id?: number }).service_id
                        ? Number((updatedBooking2 as BookingRow & { service_id?: number }).service_id)
                        : null;
                const { data: contractors2 } = await supabase
                    .from('profiles')
                    .select('id, email, verified_service_type_ids')
                    .eq('role', 'contractor')
                    .eq('approval_status', 'approved')
                    .eq('is_available', true);

                const eligibleAc = (contractors2 ?? []).filter((c: { id: string; email: string; verified_service_type_ids: number[] | null }) => {
                    const v = c.verified_service_type_ids;
                    if (v === null || v === undefined) return true;
                    if (v.length === 0) return false;
                    if (bookingServiceIdAc && !v.includes(bookingServiceIdAc)) return false;
                    return true;
                });

                if (eligibleAc.length > 0) {
                    await Promise.all(
                        eligibleAc.map((c: { id: string; email: string; verified_service_type_ids: number[] | null }) =>
                            notify2({
                                type: 'contractor.job_assigned',
                                booking: bookingWithService2,
                                contractorEmail: c.email,
                            })
                        )
                    );

                    const bookingLocale2 = updatedBooking2.locale || 'en';
                    const notificationRows2 = eligibleAc.map((c: { id: string; email: string; verified_service_type_ids: number[] | null }) => ({
                        user_id: c.id,
                        type: 'info' as const,
                        title: 'New Job Available',
                        message: `New detailing job in ${zipCode2}. Tap to view and accept.`,
                        booking_id: updatedBooking2.id,
                        is_read: false,
                        link: `/${bookingLocale2}/contractor/jobs/${updatedBooking2.id}`,
                    }));

                    const { error: notifErr2 } = await supabase.from('notifications').insert(notificationRows2);
                    if (notifErr2) console.error('webhook: contractor notification insert (auto-capture) failed:', notifErr2);
                } else {
                    console.warn(`webhook (auto-capture): no eligible contractors (after skill filter) for booking ${bookingId}`);
                }
            }
            break;
        }

        case 'payment_intent.payment_failed': {
            // Authorization or capture failed — cancel the booking.
            const pi = event.data.object as Stripe.PaymentIntent;
            const bookingId = pi.metadata?.bookingId;
            const safeId3 = bookingId ? String(bookingId).replace(/[^a-zA-Z0-9\-_]/g, '') : '';
            const failureMessage = pi.last_payment_error?.message ?? 'Unknown error';
            if (safeId3 && safeId3 !== 'test_booking' && safeId3 === bookingId) {
                const { data: updatedBooking } = await supabase
                    .from('bookings')
                    .update({ payment_status: 'failed', status: 'cancelled' })
                    .eq('id', safeId3)
                    .select()
                    .single();

                console.warn(`Payment failed for booking ${bookingId}: ${failureMessage}`);

                if (updatedBooking) {
                    const serviceName = (updatedBooking as BookingRow).service_name ?? 'Detailing Service';
                    const { notify } = await import('@/lib/notifications');
                    await notify({
                        type: 'booking.failed',
                        booking: { ...updatedBooking, service_name: serviceName }
                    });
                }
            }
            break;
        }

        case 'charge.dispute.created': {
            // A chargeback was opened. Flag the booking so the admin can respond.
            const dispute = event.data.object as Stripe.Dispute;
            const paymentIntentId = dispute.payment_intent as string | undefined;
            if (paymentIntentId) {
                const { data: booking } = await supabase
                    .from('bookings')
                    .select('id, status')
                    .eq('payment_intent_id', paymentIntentId)
                    .single();

                if (booking) {
                    await supabase
                        .from('bookings')
                        .update({ payment_status: 'disputed' })
                        .eq('id', booking.id)
                        .neq('payment_status', 'disputed'); // idempotency

                    console.warn(
                        `Chargeback opened for booking ${booking.id} (PI: ${paymentIntentId}). ` +
                        `Dispute ID: ${dispute.id}, amount: ${dispute.amount}, reason: ${dispute.reason}`
                    );

                    // Alert admin immediately — disputes have a response deadline
                    sendChargebackAlertEmail({
                        bookingId: booking.id,
                        disputeId: dispute.id,
                        paymentIntentId: paymentIntentId,
                        amount: dispute.amount,
                        reason: dispute.reason ?? 'unknown',
                    }).catch((err) => console.error('Failed to send chargeback alert email:', err));
                } else {
                    console.warn(`Dispute ${dispute.id} references unknown PaymentIntent ${paymentIntentId}`);
                }
            }
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
