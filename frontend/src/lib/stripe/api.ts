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
    paymentIntentId: string;
    amount: number;
    platformFee: number;
    contractorAmount: number;
}

/**
 * Calculate booking price via backend
 */
export async function calculatePrice(
    serviceId: number,
    addOnIds: number[] = [],
    zipCode?: string
): Promise<PriceCalculation> {
    const response = await fetch(`${API_URL}/api/booking/calculate-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, addOnIds, zipCode }),
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
    bookingId: string,
    amount: number,
    contractorId?: string
): Promise<PaymentIntentResponse> {
    const response = await fetch(`${API_URL}/api/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bookingId,
            amount,
            contractorId,
            currency: 'usd',
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create payment intent');
    }

    return response.json();
}

/**
 * Update payment intent with booking details
 */
export async function updatePaymentIntent(
    paymentIntentId: string,
    bookingId: string,
    email?: string
): Promise<{ success: boolean; paymentIntentId: string }> {
    const response = await fetch(`${API_URL}/api/payments/update-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId, bookingId, email }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update payment intent');
    }

    return response.json();
}

/**
 * Calculate platform fees for an amount
 */
export async function calculateFees(
    amount: number
): Promise<{ platformFee: number; contractorAmount: number; totalAmount: number }> {
    const response = await fetch(`${API_URL}/api/payments/calculate-fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to calculate fees');
    }

    return response.json();
}
