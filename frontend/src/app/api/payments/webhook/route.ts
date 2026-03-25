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

/** Minimal shape of a booking row as returned by Supabase .select().single() */
interface BookingRow {
    id: string;
    service_name?: string | null;
    zip_code?: string | null;
    status?: string | null;
    payment_status?: string | null;
    [key: string]: unknown;
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

                    // Broadcast to ALL approved+available contractors — first to accept wins.
                    // NOTE: Service-area ZIP filtering is dormant — re-enable for geo-routing when needed.
                    const { data: contractors } = await supabase
                        .from('profiles')
                        .select('id, email')
                        .eq('role', 'contractor')
                        .eq('approval_status', 'approved')
                        .eq('is_available', true);

                    if (contractors && contractors.length > 0) {
                        await Promise.all(
                            contractors.map((c: { id: string; email: string }) =>
                                notify({
                                    type: 'contractor.job_assigned',
                                    booking: bookingWithService,
                                    contractorEmail: c.email,
                                })
                            )
                        );

                        const notificationRows = contractors.map((c: { id: string; email: string }) => ({
                            user_id: c.id,
                            type: 'info' as const,
                            title: 'New Job Available',
                            message: `New detailing job in ${zipCode}. Tap to view and accept.`,
                            booking_id: updatedBooking.id,
                            is_read: false,
                            link: `/contractor/jobs/${updatedBooking.id}`,
                        }));

                        const { error: notifError } = await supabase.from('notifications').insert(notificationRows);
                        if (notifError) console.error('webhook: contractor notification insert failed:', notifError);
                    } else {
                        console.warn(`webhook: no available contractors for booking ${bookingId}`);
                    }
                }
            }
            break;
        }

        case 'payment_intent.succeeded': {
            // Payment was captured (via approve or auto-approve cron). Mark as paid.
            const pi = event.data.object as Stripe.PaymentIntent;
            const bookingId = pi.metadata?.bookingId;
            const safeId2 = bookingId ? String(bookingId).replace(/[^a-zA-Z0-9\-_]/g, '') : '';
            if (safeId2 && safeId2 !== 'test_booking' && safeId2 === bookingId) {
                // .eq('payment_status', 'authorized') ensures idempotency: only capture once
                await supabase
                    .from('bookings')
                    .update({ payment_status: 'paid', status: 'confirmed' })
                    .eq('id', safeId2)
                    .eq('payment_status', 'authorized');

                console.log(`Payment succeeded for booking ${bookingId}`);
                // Receipt email is sent by the approve route (booking.approved notification)
                // to avoid duplicates if amount_capturable_updated already fired booking.confirmed.
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
