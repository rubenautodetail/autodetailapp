'use client';

/**
 * Payment Form Component
 * Handles credit card input and payment processing
 */

import { useState } from 'react';
import {
    useStripe,
    useElements,
    CardElement,
    Elements,
} from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe/client';
import { updatePaymentIntent } from '@/lib/stripe/api';
import styles from './PaymentForm.module.css';

interface PaymentFormProps {
    clientSecret: string;
    bookingId: number;
    amount: number;
    onSuccess: (confirmationCode: string) => void;
    onError: (error: string) => void;
}

function PaymentFormInner({
    clientSecret,
    bookingId,
    amount,
    onSuccess,
    onError,
}: PaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [cardComplete, setCardComplete] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);

        try {
            const cardElement = elements.getElement(CardElement);

            if (!cardElement) {
                throw new Error('Card element not found');
            }

            // Confirm the payment
            const { error, paymentIntent } = await stripe.confirmCardPayment(
                clientSecret,
                {
                    payment_method: {
                        card: cardElement,
                        billing_details: {
                            // TODO: Collect billing details from form
                            name: 'Customer Name',
                        },
                    },
                }
            );

            if (error) {
                throw new Error(error.message);
            }

            if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Payment succeeded - notify parent
                onSuccess(paymentIntent.id);
            }
        } catch (err: any) {
            console.error('Payment error:', err);
            onError(err.message || 'Payment failed. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.cardContainer}>
                <label className={styles.label}>Card Information</label>
                <div className={styles.cardElement}>
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#1a1a1a',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    '::placeholder': {
                                        color: '#999',
                                    },
                                },
                                invalid: {
                                    color: '#e74c3c',
                                },
                            },
                        }}
                        onChange={(e) => setCardComplete(e.complete)}
                    />
                </div>
            </div>

            <div className={styles.summary}>
                <div className={styles.summaryRow}>
                    <span>Total Amount:</span>
                    <span className={styles.amount}>${amount.toFixed(2)}</span>
                </div>
            </div>

            <button
                type="submit"
                disabled={!stripe || processing || !cardComplete}
                className={styles.submitButton}
            >
                {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
            </button>

            <p className={styles.secureNote}>
                🔒 Your payment is secure and encrypted
            </p>
        </form>
    );
}

/**
 * Payment Form with Stripe Elements wrapper
 */
export default function PaymentForm(props: PaymentFormProps) {
    const stripePromise = getStripe();

    return (
        <Elements stripe={stripePromise}>
            <PaymentFormInner {...props} />
        </Elements>
    );
}
