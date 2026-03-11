import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';

export async function POST(req: NextRequest) {
    try {
        const { paymentIntentId, bookingId, email } = await req.json();

        if (!paymentIntentId) {
            return NextResponse.json({ error: 'paymentIntentId is required' }, { status: 400 });
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
