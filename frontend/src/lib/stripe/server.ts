/**
 * Server-side Stripe SDK — for Next.js API routes only.
 * Never import this in client components.
 */
import Stripe from 'stripe';

const PLATFORM_FEE_PERCENTAGE = parseInt(process.env.PLATFORM_FEE_PERCENTAGE || '15');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
});

/**
 * Create a payment intent for a booking (funds are held, not captured immediately)
 */
export async function createPaymentIntent({
    amount,
    bookingId,
    customerId = 'guest',
    currency = 'usd',
}: {
    amount: number;
    bookingId: string;
    customerId?: string;
    currency?: string;
}) {
    const platformFee = Math.round(amount * (PLATFORM_FEE_PERCENTAGE / 100));

    const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        capture_method: 'manual', // Hold funds, capture after service completion
        automatic_payment_methods: { enabled: true },
        metadata: {
            bookingId,
            customerId,
            platformFee: platformFee.toString(),
        },
    });

    return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        platformFee,
        contractorAmount: amount - platformFee,
    };
}

/**
 * Capture previously authorized payment funds
 */
export async function capturePaymentIntent(paymentIntentId: string) {
    return stripe.paymentIntents.capture(paymentIntentId);
}

/**
 * Verify a Stripe webhook signature and return the parsed event
 */
export function verifyWebhookSignature(payload: string | Buffer, signature: string) {
    return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
    );
}

export { stripe };
