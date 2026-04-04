/**
 * POST /api/payments/create-intent
 * Creates a Stripe PaymentIntent for a booking.
 *
 * - Uses idempotency keys (scoped to bookingId) to prevent duplicate charges on retry.
 * - All funds go to the platform account. Contractor payouts (70%) are handled
 *   manually by admin via Zelle/ACH/check — no Stripe Connect transfers.
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

        if (typeof amount !== 'number' || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Sanitize bookingId to prevent PostgREST filter injection
        const safeBookingId = bookingId ? String(bookingId).trim() : '';
        if (safeBookingId && !/^[a-zA-Z0-9\-_]+$/.test(safeBookingId)) {
            return NextResponse.json({ error: 'Invalid booking ID format' }, { status: 400 });
        }

        // Reject temp booking IDs — only real persisted bookings may create payment intents
        if (safeBookingId.startsWith('temp_booking')) {
            return NextResponse.json({ error: 'Cannot create payment intent for temporary booking. Please create the booking first.' }, { status: 400 });
        }

        let customerId = 'guest';
        let verifiedAmount = amount;

        // Look up the booking to validate amount and get customer email.
        if (safeBookingId) {
            try {
                const supabase = createServiceClient();
                const { data: booking } = await supabase
                    .from('bookings')
                    .select('customer_email, total_amount')
                    .eq('id', safeBookingId)
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
        if (safeBookingId) {
            try {
                const supabase = createServiceClient();
                await supabase
                    .from('bookings')
                    .update({
                        payment_intent_id: paymentIntent.paymentIntentId,
                        // Do NOT set payment_status here — the intent is created but not yet
                        // authorized by the bank. The webhook sets payment_status='authorized'
                        // after stripe confirms the charge.
                    })
                    .eq('id', safeBookingId);
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
