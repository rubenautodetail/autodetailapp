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
import { capturePaymentIntent } from '@/lib/stripe/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/verifyAdmin';

export async function POST(req: NextRequest) {
    // Guard: require admin auth (cookie session, Bearer JWT, or ADMIN_SECRET).
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const { bookingId } = body;

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
            .select('payment_intent_id, payment_status, contractor_id, total_amount, service_fee, service_name')
            .eq('id', safeBookingId)
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
            // Capture the funds via Stripe. All captured funds go to the platform
            // account; contractor payouts (70%) are handled manually by admin.
            paymentIntent = await capturePaymentIntent(booking.payment_intent_id);
        } catch (stripeError) {
            // Capture failed — revert booking to cancelled so it can be re-queued.
            console.error('Stripe capture failed, reverting booking:', stripeError);
            await supabase
                .from('bookings')
                .update({ payment_status: 'failed', status: 'cancelled' })
                .eq('id', safeBookingId);

            return NextResponse.json(
                { error: 'Payment capture failed. Please contact support.' },
                { status: 502 }
            );
        }

        // Capture succeeded — mark booking as paid.
        await supabase
            .from('bookings')
            .update({ payment_status: 'paid' })
            .eq('id', safeBookingId);

        // Notify contractor that the job payment has been captured.
        // Contractor payout = 70% of total (paid manually by admin via Zelle/ACH/check).
        if (booking.contractor_id) {
            const totalAmount = Number(booking.total_amount ?? 0);
            const contractorPayout = (totalAmount * 0.70).toFixed(2);
            const serviceName = booking.service_name ?? 'Detailing Service';

            const { error: notifError } = await supabase
                .from('notifications')
                .insert({
                    user_id: booking.contractor_id,
                    type: 'success' as const,
                    title: 'Payment Received',
                    message: `Your payment of $${contractorPayout} for the ${serviceName} job has been processed.`,
                    booking_id: bookingId,
                    is_read: false,
                    link: `/en/contractor/jobs/${safeBookingId}`,
                });

            if (notifError) {
                console.error('Failed to insert contractor payment notification:', notifError);
            }
        }

        return NextResponse.json({
            success: true,
            status: paymentIntent.status,
        });
    } catch (error) {
        console.error('Capture payment error:', error);
        return NextResponse.json(
            { error: `Failed to capture payment: ${(error as Error).message}` },
            { status: 500 }
        );
    }
}
