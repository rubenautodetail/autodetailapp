/**
 * Stripe Provider Component
 * Wraps the application with Stripe Elements context
 */

'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { ReactNode } from 'react';

// Load Stripe outside of component to avoid recreating on every render
let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = () => {
    if (!stripePromise) {
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

        if (!publishableKey) {
            console.error('Stripe publishable key is not set');
            return null;
        }

        stripePromise = loadStripe(publishableKey);
    }
    return stripePromise;
};

interface StripeProviderProps {
    children: ReactNode;
    clientSecret?: string;
}

export default function StripeProvider({ children, clientSecret }: StripeProviderProps) {
    const stripe = getStripe();

    const options = clientSecret
        ? {
            clientSecret,
            appearance: {
                theme: 'night' as const,
                variables: {
                    colorPrimary: '#D4AF37',
                    colorBackground: '#1a1a1a',
                    colorText: '#ffffff',
                    colorDanger: '#ef4444',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    borderRadius: '12px',
                },
            },
        }
        : undefined;

    return (
        <Elements stripe={stripe} options={options}>
            {children}
        </Elements>
    );
}
