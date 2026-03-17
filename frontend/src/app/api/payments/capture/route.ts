/**
 * POST /api/payments/capture
 * Admin-only route. Captures a previously authorized Stripe PaymentIntent.
 *
 * Protected by ADMIN_API_SECRET header to prevent unauthorized captures.
 *
 * Failure handling: if Stripe capture throws (e.g. card declined on capture,
 * or the 7-day hold window expired and the intent was voided), the booking
 * status is reverted to 'cancelled' and payment_status to 'failed' so the
 * customer can be notified and re-booked.
 */

import { NextRequest, NextResponse } from 'next/server';
import { capturePaymentIntent, transferToContractor } from '@/lib/stripe/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    // Guard: require ADMIN_API_SECRET header so only internal admin UI can trigger this.
    const adminSecret = process.env.ADMIN_API_SECRET;
    if (adminSecret) {
        const provided = req.headers.get('x-admin-secret');
        if (!provided || provided !== adminSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const { bookingId } = await req.json();

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        const safeBookingId = String(bookingId).trim();
        if (!/^[a-zA-Z0-9\-_]+$/.test(safeBookingId)) {
            return NextResponse.json({ error: 'Invalid booking ID format' }, { status: 400 });
        }

        const supabase = createServiceClient();

        // Look up booking to get payment intent ID, status, and contractor info.
        const { data: booking, error } = await supabase
            .from('bookings')
            .select('payment_intent_id, payment_status, contractor_id, total_amount, service_fee, service_name, confirmation_code')
            .or(`id.eq.${safeBookingId},document_id.eq.${safeBookingId}`)
            .single();

        if (error || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        if (!booking.payment_intent_id) {
            return NextResponse.json({ error: 'No payment intent found for this booking' }, { status: 400 });
        }

        if (booking.payment_status !== 'authorized') {
            return NextResponse.json(
                { error: `Cannot capture: payment status is ${booking.payment_status}` },
                { status: 400 }
            );
        }

        let paymentIntent;
        try {
            // Capture the funds via Stripe.
            // If the PaymentIntent was created with transfer_data, Stripe routes
            // (amount - application_fee_amount) to the contractor automatically.
            paymentIntent = await capturePaymentIntent(booking.payment_intent_id);
        } catch (stripeError) {
            // Capture failed — revert booking to cancelled so it can be re-queued.
            console.error('Stripe capture failed, reverting booking:', stripeError);
            await supabase
                .from('bookings')
                .update({ payment_status: 'failed', status: 'cancelled' })
                .or(`id.eq.${safeBookingId},document_id.eq.${safeBookingId}`);

            return NextResponse.json(
                { error: 'Payment capture failed. Please contact support.' },
                { status: 502 }
            );
        }

        // Capture succeeded — mark booking as paid.
        await supabase
            .from('bookings')
            .update({ payment_status: 'paid' })
            .or(`id.eq.${safeBookingId},document_id.eq.${safeBookingId}`);

        // ── Stripe Connect transfer ───────────────────────────────────────────
        // Transfer contractor payout to their Express account (if onboarded).
        let transferId: string | null = null;
        let contractorPayoutCents = 0;

        if (booking.contractor_id) {
            const { data: contractorProfile } = await supabase
                .from('profiles')
                .select('stripe_account_id, onboarding_complete')
                .eq('id', booking.contractor_id)
                .single();

            const stripeAccountId = (contractorProfile as Record<string, unknown> | null)?.stripe_account_id as string | null;
            const onboardingComplete = (contractorProfile as Record<string, unknown> | null)?.onboarding_complete as boolean | null;

            if (stripeAccountId && onboardingComplete) {
                try {
                    const totalAmountCents = Math.round(Number(booking.total_amount ?? 0) * 100);
                    const result = await transferToContractor({
                        totalAmountCents,
                        connectedAccountId: stripeAccountId,
                        bookingId: safeBookingId,
                    });
                    transferId = result.transferId;
                    contractorPayoutCents = result.contractorPayoutCents;

                    // Persist transfer ID for audit trail
                    await supabase
                        .from('bookings')
                        .update({ stripe_transfer_id: transferId } as Record<string, unknown>)
                        .or(`id.eq.${safeBookingId},document_id.eq.${safeBookingId}`);
                } catch (transferErr) {
                    // Non-fatal: capture succeeded; flag for manual payout resolution
                    console.error('Stripe transfer failed (capture succeeded):', transferErr);
                    // TODO: alert admin that manual payout is needed for this booking
                }
            }
        }

        // ── Contractor notification ───────────────────────────────────────────
        if (booking.contractor_id) {
            const totalAmount = Number(booking.total_amount ?? 0);
            const payoutAmount = contractorPayoutCents > 0
                ? (contractorPayoutCents / 100).toFixed(2)
                : (() => {
                    const fee = Number(booking.service_fee ?? 0);
                    return (totalAmount - fee).toFixed(2);
                })();
            const serviceName = booking.service_name ?? 'Detailing Service';
            const transferred = contractorPayoutCents > 0;

            const { error: notifError } = await supabase
                .from('notifications')
                .insert({
                    user_id: booking.contractor_id,
                    type: 'success' as const,
                    title: 'Payment Received',
                    message: transferred
                        ? `$${payoutAmount} for the ${serviceName} job has been transferred to your Stripe account.`
                        : `Your payment of $${payoutAmount} for the ${serviceName} job has been processed.`,
                    booking_id: bookingId,
                    is_read: false,
                    link: `/contractor/jobs/${safeBookingId}`,
                });

            if (notifError) {
                console.error('Failed to insert contractor payment notification:', notifError);
            }
        }

        return NextResponse.json({
            success: true,
            status: paymentIntent.status,
            transferId,
        });
    } catch (error) {
        console.error('Capture payment error:', error);
        return NextResponse.json(
            { error: `Failed to capture payment: ${(error as Error).message}` },
            { status: 500 }
        );
    }
}
