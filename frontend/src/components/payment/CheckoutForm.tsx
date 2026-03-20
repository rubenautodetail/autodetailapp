/**
 * Checkout Form Component
 * Handles payment collection using Stripe Elements
 */

'use client';

import { useState } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';

export interface CustomerDetails {
    name: string;
    email: string;
    phone: string;
}

interface CheckoutFormProps {
    amount: number;
    onSuccess: () => void;
    onError: (error: string) => void;
    onBeforeSubmit?: (details: CustomerDetails) => Promise<boolean>;
}

export default function CheckoutForm({ amount, onSuccess, onError, onBeforeSubmit }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
        name: '',
        email: '',
        phone: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            if (onBeforeSubmit) {
                const shouldProceed = await onBeforeSubmit(customerDetails);
                if (!shouldProceed) {
                    setIsProcessing(false);
                    return;
                }
            }

            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/${document.documentElement.lang || 'en'}/booking/confirmation`,
                    payment_method_data: {
                        billing_details: {
                            name: customerDetails.name,
                            email: customerDetails.email,
                            phone: customerDetails.phone,
                        },
                    },
                },
            });

            if (error) {
                setErrorMessage(error.message || 'An error occurred');
                onError(error.message || 'Payment failed');
            } else {
                onSuccess();
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            setErrorMessage(message);
            onError(message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Contact Information
                </h3>

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        required
                        value={customerDetails.name}
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Doe"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        required
                        value={customerDetails.email}
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="john@example.com"
                    />
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        required
                        value={customerDetails.phone}
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="(555) 123-4567"
                    />
                </div>
            </div>

            {/* Payment Element */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Payment Information
                </h3>
                <PaymentElement />
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <svg
                            className="w-5 h-5 text-red-600 mt-0.5 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <div>
                            <h4 className="text-sm font-semibold text-red-900 mb-1">
                                Payment Error
                            </h4>
                            <p className="text-sm text-red-700">{errorMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className={`
          w-full py-4 px-6 rounded-lg font-semibold text-white text-lg
          transition-all duration-200
          ${!stripe || isProcessing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 active:scale-98'
                    }
        `}
            >
                {isProcessing ? (
                    <span className="flex items-center justify-center">
                        <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Processing...
                    </span>
                ) : (
                    `Hold $${(amount / 100).toFixed(2)}`
                )}
            </button>

            {/* Security Notice */}
            <div className="flex items-center justify-center text-sm text-gray-500">
                <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                </svg>
                Secured by Stripe
            </div>
        </form>
    );
}
