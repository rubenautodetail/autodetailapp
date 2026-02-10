/**
 * Stripe client utility
 * Loads and exports the Stripe instance
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

/**
 * Get Stripe instance (singleton)
 */
export const getStripe = () => {
    if (!stripePromise) {
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

        if (!publishableKey) {
            throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
        }

        stripePromise = loadStripe(publishableKey);
    }

    return stripePromise;
};
