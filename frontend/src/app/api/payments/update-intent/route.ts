import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    // Require authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
        const { paymentIntentId, bookingId, email } = body;

        if (!paymentIntentId) {
            return NextResponse.json({ error: 'paymentIntentId is required' }, { status: 400 });
        }

        // Verify the caller owns the booking associated with this PaymentIntent
        const adminSupabase = createServiceClient();
        const { data: booking } = await adminSupabase
            .from('bookings')
            .select('user_id')
            .eq('payment_intent_id', paymentIntentId)
            .maybeSingle();

        if (booking && booking.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updateData: Record<string, unknown> = {};

        if (bookingId) {
            updateData.metadata = { bookingId };
        }

        if (email) {
            updateData.receipt_email = email;
        }

        await stripe.paymentIntents.update(paymentIntentId, updateData);

        return NextResponse.json({ success: true, paymentIntentId });
    } catch (err) {
        console.error('Update payment intent error:', err);
        return NextResponse.json(
            { error: { message: 'Failed to update payment intent' } },
            { status: 500 }
        );
    }
}
