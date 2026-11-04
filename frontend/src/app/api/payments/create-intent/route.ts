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
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const { bookingId, amount, currency = 'usd' } = body;

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

        // A real, persisted booking is required: the amount always comes from the database.
        if (!safeBookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        const supabase = createServiceClient();
        const { data: booking } = await supabase
            .from('bookings')
            .select('customer_email, user_id, total_amount, status')
            .eq('id', safeBookingId)
            .single();

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Ownership: only the customer who owns this booking can create a payment for it.
        const isOwner =
            (!!booking.customer_email && booking.customer_email.toLowerCase() === (user.email ?? '').toLowerCase()) ||
            (!!booking.user_id && booking.user_id === user.id);
        if (!isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Only bookings still waiting for payment can get a new payment intent
        // (prevents overwriting the payment of an already paid booking).
        if (booking.status !== 'pending_payment') {
            return NextResponse.json({ error: 'This booking is not awaiting payment.' }, { status: 400 });
        }

        const customerId = booking.customer_email || user.email || 'guest';

        // Server-side amount: use the booking's total, never trust the client amount.
        const dbAmount = Math.round(Number(booking.total_amount) * 100); // cents
        if (!dbAmount || dbAmount <= 0) {
            return NextResponse.json({ error: 'Invalid booking amount' }, { status: 400 });
        }
        if (Math.abs(dbAmount - amount) > 1) {
            return NextResponse.json(
                { error: 'Amount mismatch. Please refresh and try again.' },
                { status: 400 }
            );
        }
        const verifiedAmount = dbAmount;

        // Create Stripe PaymentIntent (idempotent — safe to retry).
        const paymentIntent = await createPaymentIntent({
            amount: verifiedAmount,
            bookingId: safeBookingId,
            customerId,
            currency,
        });

        // Persist payment intent ID on the booking.
        // payment_status is NOT set here — the webhook sets 'authorized' once Stripe confirms the charge.
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ payment_intent_id: paymentIntent.paymentIntentId })
            .eq('id', safeBookingId);
        if (updateError) {
            // Non-fatal: the PaymentIntent exists; the webhook can reconcile the booking.
            console.error('Failed to update booking with payment intent:', updateError);
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
