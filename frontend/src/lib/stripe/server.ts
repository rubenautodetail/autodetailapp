/**
 * Server-side Stripe SDK — for Next.js API routes only.
 * Never import this in client components.
 *
 * Manual capture flow:
 *   1. createPaymentIntent — authorizes funds on card (holds for up to 7 days)
 *   2. capturePaymentIntent — captures held funds after service is completed
 *
 * IMPORTANT: Stripe auto-voids uncaptured PaymentIntents after 7 days.
 * The 24-hour auto-approve cron at /api/cron/auto-approve covers the normal
 * case. For safety, bookings created > 6 days ago should be escalated/notified
 * before the 7-day void window expires.
 */
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    // Pinned API version — update intentionally after reviewing Stripe changelog.
    apiVersion: '2026-01-28.clover',
});

/**
 * Create a payment intent for a booking (funds are held, not captured immediately).
 *
 * Idempotency: pass bookingId so that retrying the same request returns the
 * same PaymentIntent instead of creating a duplicate charge.
 *
 * No platform fee — full amount goes to contractor on capture.
 */
export async function createPaymentIntent({
    amount,
    bookingId,
    customerId = 'guest',
    currency = 'usd',
    contractorStripeAccountId,
}: {
    amount: number;
    bookingId: string;
    customerId?: string;
    currency?: string;
    /** profiles.stripe_account_id — routes funds directly to contractor on capture */
    contractorStripeAccountId?: string;
}) {
    const createParams: Stripe.PaymentIntentCreateParams = {
        amount,
        currency,
        capture_method: 'manual', // Hold funds; capture after service completion (7-day window)
        automatic_payment_methods: { enabled: true },
        metadata: { bookingId, customerId },
    };

    // Route full amount to contractor via Stripe Connect — no platform fee deducted.
    if (contractorStripeAccountId) {
        createParams.transfer_data = { destination: contractorStripeAccountId };
    }

    // Idempotency key: scoped to bookingId so retries don't double-charge.
    const paymentIntent = await stripe.paymentIntents.create(createParams, {
        idempotencyKey: `create-pi-${bookingId}`,
    });

    return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
    };
}

/**
 * Capture previously authorized payment funds.
 *
 * If the PaymentIntent was created with transfer_data, Stripe automatically
 * transfers (amount - application_fee_amount) to the contractor's account.
 *
 * Throws a Stripe error if the PaymentIntent has been voided (> 7 days old)
 * or is in an uncapturable state — callers must handle this and revert
 * booking status to 'failed' / 'cancelled'.
 */
export async function capturePaymentIntent(paymentIntentId: string) {
    return stripe.paymentIntents.capture(paymentIntentId);
}

/**
 * Verify a Stripe webhook signature and return the parsed event.
 * Uses the raw request body (string/Buffer) — do NOT parse JSON before calling.
 */
export function verifyWebhookSignature(payload: string | Buffer, signature: string) {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
    }
    return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
    );
}

export { stripe };
