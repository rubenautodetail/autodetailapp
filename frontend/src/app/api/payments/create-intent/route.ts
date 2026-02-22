/**
 * POST /api/payments/create-intent
 * Creates a Stripe payment intent for a booking.
 * Ported from Strapi backend — Strapi no longer required at runtime.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe/server';
import { createApiClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const { bookingId, amount, currency = 'usd' } = await req.json();

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        let customerId = 'guest';

        // Look up the booking in Supabase to get customer email
        if (bookingId && bookingId !== 'temp_booking' && bookingId !== 'temp_booking_id') {
            try {
                const supabase = createApiClient();
                const { data: booking } = await supabase
                    .from('bookings')
                    .select('customer_email, document_id')
                    .or(`id.eq.${bookingId},document_id.eq.${bookingId}`)
                    .single();

                if (booking?.customer_email) {
                    customerId = booking.customer_email;
                }
            } catch {
                // Non-fatal: continue as guest
            }
        }

        // Create Stripe payment intent
        const paymentIntent = await createPaymentIntent({
            amount,
            bookingId: bookingId || 'test_booking',
            customerId,
            currency,
        });

        // Update booking in Supabase with payment intent ID
        if (bookingId && bookingId !== 'temp_booking' && bookingId !== 'temp_booking_id') {
            try {
                const supabase = createApiClient();
                await supabase
                    .from('bookings')
                    .update({
                        payment_intent_id: paymentIntent.paymentIntentId,
                        payment_status: 'authorized',
                    })
                    .or(`id.eq.${bookingId},document_id.eq.${bookingId}`);
            } catch (err) {
                console.error('Failed to update booking with payment intent:', err);
                // Non-fatal: payment intent was still created
            }
        }

        return NextResponse.json({
            success: true,
            clientSecret: paymentIntent.clientSecret,
            paymentIntentId: paymentIntent.paymentIntentId,
            amount: paymentIntent.amount,
            platformFee: paymentIntent.platformFee,
            contractorAmount: paymentIntent.contractorAmount,
        });
    } catch (error) {
        console.error('Create payment intent error:', error);
        return NextResponse.json(
            { error: `Failed to create payment intent: ${(error as Error).message}` },
            { status: 500 }
        );
    }
}
