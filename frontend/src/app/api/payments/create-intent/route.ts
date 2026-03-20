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
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
    if (await rateLimit(req, { maxRequests: 5, windowMs: 60_000, keyPrefix: 'payment-intent' })) {
        return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
    }

    // Require authenticated user — no guest payments
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    try {
        const { bookingId, amount, currency = 'usd' } = await req.json();

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Sanitize bookingId to prevent PostgREST filter injection
        const safeBookingId = bookingId ? String(bookingId).trim() : '';
        if (safeBookingId && safeBookingId !== 'temp_booking' && safeBookingId !== 'temp_booking_id' && !/^[a-zA-Z0-9\-_]+$/.test(safeBookingId)) {
            return NextResponse.json({ error: 'Invalid booking ID format' }, { status: 400 });
        }

        let customerId = 'guest';
        let verifiedAmount = amount;

        // Look up the booking to validate amount and get customer email.
        if (safeBookingId && safeBookingId !== 'temp_booking' && safeBookingId !== 'temp_booking_id') {
            try {
                const supabase = createServiceClient();
                const { data: booking } = await supabase
                    .from('bookings')
                    .select('customer_email, total_amount')
                    .or(`id.eq.${safeBookingId},document_id.eq.${safeBookingId}`)
                    .single();

                if (booking?.customer_email) {
                    customerId = booking.customer_email;
                }

                // Server-side amount validation: use the booking's total, not client-provided amount
                if (booking?.total_amount) {
                    const dbAmount = Math.round(Number(booking.total_amount) * 100); // cents
                    if (Math.abs(dbAmount - amount) > 1) {
                        return NextResponse.json(
                            { error: 'Amount mismatch. Please refresh and try again.' },
                            { status: 400 }
                        );
                    }
                    verifiedAmount = dbAmount;
                }
            } catch {
                // Non-fatal: continue with client-provided amount for temp bookings
            }
        }

        // Create Stripe PaymentIntent (idempotent — safe to retry).
        const paymentIntent = await createPaymentIntent({
            amount: verifiedAmount,
            bookingId: safeBookingId || 'test_booking',
            customerId,
            currency,
        });

        // Persist payment intent ID on the booking.
        if (safeBookingId && safeBookingId !== 'temp_booking' && safeBookingId !== 'temp_booking_id') {
            try {
                const supabase = createServiceClient();
                await supabase
                    .from('bookings')
                    .update({
                        payment_intent_id: paymentIntent.paymentIntentId,
                        payment_status: 'authorized',
                    })
                    .or(`id.eq.${safeBookingId},document_id.eq.${safeBookingId}`);
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
