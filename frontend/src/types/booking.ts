/**
 * TypeScript types for the booking system
 */

export interface Service {
    id: number;
    name: string;
    slug: string;
    description: string;
    basePrice: number;
    durationMinutes: number;
    checklist?: string[];
    image?: {
        url: string;
        alternativeText?: string;
    };
    addOns?: AddOn[];
    sortOrder: number;
}

export interface AddOn {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    durationMinutes: number;
    checklist?: string[];
    sortOrder: number;
}

export interface Booking {
    id?: number;
    service: Service | number;
    addOns?: AddOn[] | number[];
    date: string;
    timeWindow: 'morning' | 'afternoon' | 'evening';
    address: string;
    city: string;
    state: string;
    zipCode: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    vehicleType?: string;
    vehicleColor?: string;
    specialInstructions?: string;
    status: 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'payment_failed';
    totalAmount?: number;
    paymentIntentId?: string;
    paidAt?: string;
}

export interface BookingFormData {
    serviceId: number;
    addOnIds: number[];
    date: string;
    timeWindow: 'morning' | 'afternoon' | 'evening';
    address: string;
    city: string;
    state: string;
    zipCode: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    vehicleType?: string;
    vehicleColor?: string;
    specialInstructions?: string;
}

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
