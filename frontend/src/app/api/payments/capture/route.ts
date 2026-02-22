/**
 * POST /api/payments/capture
 * Captures a previously authorized Stripe payment.
 * Ported from Strapi backend — Strapi no longer required at runtime.
 */

import { NextRequest, NextResponse } from 'next/server';
import { capturePaymentIntent } from '@/lib/stripe/server';
import { createApiClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const { bookingId } = await req.json();

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        const supabase = createApiClient();

        // Look up booking to get payment intent ID
        const { data: booking, error } = await supabase
            .from('bookings')
            .select('payment_intent_id, payment_status')
            .or(`id.eq.${bookingId},document_id.eq.${bookingId}`)
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

        // Capture the funds via Stripe
        const paymentIntent = await capturePaymentIntent(booking.payment_intent_id);

        // Update booking in Supabase
        await supabase
            .from('bookings')
            .update({ payment_status: 'paid' })
            .or(`id.eq.${bookingId},document_id.eq.${bookingId}`);

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
