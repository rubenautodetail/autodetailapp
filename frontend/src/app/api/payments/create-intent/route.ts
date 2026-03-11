/**
 * POST /api/payments/create-intent
 * Creates a Stripe PaymentIntent for a booking.
 *
 * - Uses idempotency keys (scoped to bookingId) to prevent duplicate charges on retry.
 * - Passes transfer_data + application_fee_amount when a contractor with a connected
 *   Stripe account is already assigned, so funds route automatically on capture.
 * - If no contractor is assigned yet, transfer_data is omitted; the admin must
 *   handle payouts manually or re-create the intent once a contractor is assigned.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
    if (rateLimit(req, { maxRequests: 5, windowMs: 60_000, keyPrefix: 'payment-intent' })) {
        return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
    }

    try {
        const { bookingId, amount, currency = 'usd' } = await req.json();

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        let customerId = 'guest';
        let contractorStripeAccountId: string | undefined;

        // Look up the booking to get customer email and (if assigned) contractor Stripe account.
        if (bookingId && bookingId !== 'temp_booking' && bookingId !== 'temp_booking_id') {
            try {
                const supabase = createServiceClient();
                const { data: booking } = await supabase
                    .from('bookings')
                    .select('customer_email, document_id, contractor_id')
                    .or(`id.eq.${bookingId},document_id.eq.${bookingId}`)
                    .single();

                if (booking?.customer_email) {
                    customerId = booking.customer_email;
                }

                // If a contractor is already assigned, fetch their Stripe account for Connect routing.
                if (booking?.contractor_id) {
                    const { data: contractor } = await supabase
                        .from('profiles')
                        .select('stripe_account_id')
                        .eq('id', booking.contractor_id)
                        .single();

                    if (contractor?.stripe_account_id) {
                        contractorStripeAccountId = contractor.stripe_account_id;
                    }
                }
            } catch {
                // Non-fatal: continue without Connect routing
            }
        }

        // Create Stripe PaymentIntent (idempotent — safe to retry).
        const paymentIntent = await createPaymentIntent({
            amount,
            bookingId: bookingId || 'test_booking',
            customerId,
            currency,
            contractorStripeAccountId,
        });

        // Persist payment intent ID on the booking.
        if (bookingId && bookingId !== 'temp_booking' && bookingId !== 'temp_booking_id') {
            try {
                const supabase = createServiceClient();
                await supabase
                    .from('bookings')
                    .update({
                        payment_intent_id: paymentIntent.paymentIntentId,
                        payment_status: 'authorized',
                    })
                    .or(`id.eq.${bookingId},document_id.eq.${bookingId}`);
            } catch (err) {
                console.error('Failed to update booking with payment intent:', err);
                // Non-fatal: PaymentIntent was created; the booking record is out of sync but recoverable via webhook.
            }
        }

        return NextResponse.json({
            success: true,
            clientSecret: paymentIntent.clientSecret,
            paymentIntentId: paymentIntent.paymentIntentId,
            amount: paymentIntent.amount,
        });
    } catch (error) {
        console.error('Create payment intent error:', error);
        return NextResponse.json(
            { error: `Failed to create payment intent: ${(error as Error).message}` },
            { status: 500 }
        );
    }
}
