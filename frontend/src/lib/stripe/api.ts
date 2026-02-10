/**
 * Payment API client
 * Handles communication with backend payment endpoints
 */

const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export interface PriceCalculation {
    service: {
        id: number;
        name: string;
        basePrice: number;
    };
    addOns: Array<{
        id: number;
        name: string;
        price: number;
    }>;
    subtotal: number;
    serviceFee: number;
    total: number;
    currency: string;
}

export interface PaymentIntentResponse {
    clientSecret: string;
    amount: number;
    amountInCents: number;
    platformFee: number;
    contractorAmount: number;
}

/**
 * Calculate booking price
 */
export async function calculatePrice(
    serviceId: number,
    addOnIds: number[] = [],
    zipCode?: string
): Promise<PriceCalculation> {
    const response = await fetch(`${API_URL}/api/bookings/calculate-price`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            serviceId,
            addOnIds,
            zipCode,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to calculate price');
    }

    return response.json();
}

/**
 * Create payment intent for a booking
 */
export async function createPaymentIntent(
    bookingId: number
): Promise<PaymentIntentResponse> {
    const response = await fetch(
        `${API_URL}/api/bookings/${bookingId}/create-payment-intent`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create payment intent');
    }

    return response.json();
}

/**
 * Confirm payment was successful
 */
export async function confirmPayment(
    bookingId: number,
    paymentIntentId: string
): Promise<{ success: boolean; booking: any }> {
    const response = await fetch(
        `${API_URL}/api/bookings/${bookingId}/confirm-payment`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentIntentId,
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to confirm payment');
    }

    return response.json();
}
