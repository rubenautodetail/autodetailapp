/**
 * POST /api/payments/webhook
 * Handles Stripe webhook events (payment succeeded, failed, etc.)
 * Ported from Strapi backend — Strapi no longer required at runtime.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/stripe/server';
import { createApiClient } from '@/lib/supabase/server';

// Required for raw body access in Next.js Route Handlers
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let rawBody: string;
    try {
        rawBody = await req.text();
    } catch {
        return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
    }

    let event;
    try {
        event = verifyWebhookSignature(rawBody, signature);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json(
            { error: `Webhook error: ${(err as Error).message}` },
            { status: 400 }
        );
    }

    console.log(`Webhook received: ${event.type}`);

    const supabase = createApiClient();

    switch (event.type) {
        case 'payment_intent.amount_capturable_updated': {
            // Funds authorized and ready to capture
            const pi = event.data.object as { metadata?: { bookingId?: string } };
            const bookingId = pi.metadata?.bookingId;
            if (bookingId && bookingId !== 'test_booking') {
                await supabase
                    .from('bookings')
                    .update({ payment_status: 'authorized', status: 'confirmed' })
                    .or(`id.eq.${bookingId},document_id.eq.${bookingId}`);
            }
            break;
        }

        case 'payment_intent.succeeded': {
            const pi = event.data.object as { metadata?: { bookingId?: string } };
            const bookingId = pi.metadata?.bookingId;
            if (bookingId && bookingId !== 'test_booking') {
                await supabase
                    .from('bookings')
                    .update({ payment_status: 'paid', status: 'confirmed' })
                    .or(`id.eq.${bookingId},document_id.eq.${bookingId}`);

                console.log(`✅ Payment succeeded for booking ${bookingId}`);
                // TODO: Contractor auto-assignment (migrate from Strapi in follow-up)
            }
            break;
        }

        case 'payment_intent.payment_failed': {
            const pi = event.data.object as { metadata?: { bookingId?: string } };
            const bookingId = pi.metadata?.bookingId;
            if (bookingId && bookingId !== 'test_booking') {
                await supabase
                    .from('bookings')
                    .update({ payment_status: 'failed', status: 'cancelled' })
                    .or(`id.eq.${bookingId},document_id.eq.${bookingId}`);

                console.warn(`❌ Payment failed for booking ${bookingId}`);
            }
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
