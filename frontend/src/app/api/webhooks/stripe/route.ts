/**
 * POST /api/webhooks/stripe
 *
 * Receives Stripe webhook events and keeps booking payment state in sync.
 * Must be registered in the Stripe dashboard pointing to:
 *   https://<your-domain>/api/webhooks/stripe
 *
 * Required events to enable in Stripe dashboard:
 *   - payment_intent.amount_capturable_updated  (card authorized)
 *   - payment_intent.succeeded                  (payment captured)
 *   - payment_intent.payment_failed             (card declined)
 *   - payment_intent.canceled                   (payment voided)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/stripe/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Stripe requires the raw body for signature verification — disable body parsing
export async function POST(req: NextRequest) {
    const sig = req.headers.get('stripe-signature');
    if (!sig) {
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
        event = verifyWebhookSignature(rawBody, sig);
    } catch (err) {
        console.error('Stripe webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Idempotency — skip already-processed events
    const { data: existing } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('stripe_event_id', event.id)
        .maybeSingle();

    if (existing) {
        return NextResponse.json({ received: true, skipped: true });
    }

    // Record event before processing to prevent double-processing on retry
    const { error: insertError } = await supabase.from('webhook_events').insert({ stripe_event_id: event.id, type: event.type });

    if (insertError) {
        // code 23505 = Postgres UNIQUE_VIOLATION — duplicate event, already processed
        if ((insertError as { code?: string }).code === '23505') {
            return NextResponse.json({ received: true, skipped: true });
        }
        console.error('webhook: failed to record event for idempotency:', insertError);
        return NextResponse.json({ error: 'Failed to record webhook event' }, { status: 500 });
    }

    const paymentIntent = event.data.object as { id: string; metadata?: { bookingId?: string } };
    const bookingId = paymentIntent.metadata?.bookingId;

    try {
        switch (event.type) {
            case 'payment_intent.amount_capturable_updated': {
                // Card authorized — move booking from pending_payment → pending_assignment
                if (!bookingId) break;
                await supabase
                    .from('bookings')
                    .update({
                        status: 'pending_assignment',
                        payment_status: 'authorized',
                        payment_intent_id: paymentIntent.id,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', bookingId)
                    .eq('status', 'pending_payment'); // Only update if still pending
                break;
            }

            case 'payment_intent.succeeded': {
                // Payment captured — mark paid
                if (!bookingId) break;
                await supabase
                    .from('bookings')
                    .update({
                        payment_status: 'paid',
                        captured_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', bookingId);
                break;
            }

            case 'payment_intent.payment_failed': {
                // Card declined — mark failed
                if (!bookingId) break;
                const failureMessage = (paymentIntent as any).last_payment_error?.message ?? 'Payment failed';
                await supabase
                    .from('bookings')
                    .update({
                        status: 'cancelled',
                        payment_status: 'failed',
                        payment_error: failureMessage,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', bookingId)
                    .eq('status', 'pending_payment');
                break;
            }

            case 'payment_intent.canceled': {
                // PaymentIntent voided (e.g., 7-day window expired)
                if (!bookingId) break;
                await supabase
                    .from('bookings')
                    .update({
                        status: 'cancelled',
                        payment_status: 'failed',
                        payment_error: 'Payment authorization expired',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', bookingId)
                    .in('status', ['pending_payment', 'pending_assignment']);
                break;
            }

            default:
                // Unhandled event type — not an error
                break;
        }
    } catch (err) {
        console.error(`Webhook handler error for ${event.type}:`, err);
        // Return 200 anyway — Stripe retries on non-2xx which can cause loops
    }

    return NextResponse.json({ received: true });
}
