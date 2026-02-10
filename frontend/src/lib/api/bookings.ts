/**
 * API client for services and bookings
 * Falls back to mock data when Strapi is unavailable
 */

import { Service, AddOn, Booking, BookingFormData } from '@/types/booking';

const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// Mock data fallback when Strapi is unavailable
const MOCK_SERVICES: Service[] = [
    {
        id: 1,
        name: 'Interior Detail',
        slug: 'interior-detail',
        description: 'Deep clean of interior surfaces, seats, carpets, and dashboard',
        basePrice: 100,
        durationMinutes: 90,
        sortOrder: 1,
    },
    {
        id: 2,
        name: 'Exterior Detail',
        slug: 'exterior-detail',
        description: 'Complete exterior wash, wax, tire shine, and window cleaning',
        basePrice: 120,
        durationMinutes: 120,
        sortOrder: 2,
    },
    {
        id: 3,
        name: 'Full Detail',
        slug: 'full-detail',
        description: 'Complete interior and exterior detailing package - best value!',
        basePrice: 200,
        durationMinutes: 180,
        sortOrder: 3,
    },
];

/**
 * Fetch all services
 */
export async function getServices(locale: string = 'en'): Promise<Service[]> {
    try {
        const response = await fetch(
            `${API_URL}/api/services?locale=${locale}&populate=*&sort=sortOrder:asc`,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch services');
        }

        const data = await response.json();
        return data.data.map((item: any) => ({
            id: item.id,
            ...item.attributes,
        }));
    } catch (error) {
        console.warn('[API] Strapi unavailable, using mock services');
        return MOCK_SERVICES;
    }
}

/**
 * Fetch a single service by slug
 */
export async function getServiceBySlug(
    slug: string,
    locale: string = 'en'
): Promise<Service | null> {
    try {
        const response = await fetch(
            `${API_URL}/api/services?filters[slug][$eq]=${slug}&locale=${locale}&populate=*`,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch service');
        }

        const data = await response.json();
        if (data.data.length === 0) {
            return null;
        }

        const item = data.data[0];
        return {
            id: item.id,
            ...item.attributes,
        };
    } catch (error) {
        console.error('Error fetching service:', error);
        return null;
    }
}

/**
 * Fetch all add-ons
 */
export async function getAddOns(locale: string = 'en'): Promise<AddOn[]> {
    try {
        const response = await fetch(
            `${API_URL}/api/add-ons?locale=${locale}&sort=sortOrder:asc`,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch add-ons');
        }

        const data = await response.json();
        return data.data.map((item: any) => ({
            id: item.id,
            ...item.attributes,
        }));
    } catch (error) {
        console.error('Error fetching add-ons:', error);
        return [];
    }
}

/**
 * Create a new booking
 */
export async function createBooking(
    bookingData: BookingFormData
): Promise<Booking> {
    try {
        const response = await fetch(`${API_URL}/api/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    service: bookingData.serviceId,
                    addOns: bookingData.addOnIds,
                    date: bookingData.date,
                    timeWindow: bookingData.timeWindow,
                    address: bookingData.address,
                    city: bookingData.city,
                    state: bookingData.state,
                    zipCode: bookingData.zipCode,
                    customerName: bookingData.customerName,
                    customerEmail: bookingData.customerEmail,
                    customerPhone: bookingData.customerPhone,
                    vehicleType: bookingData.vehicleType,
                    vehicleColor: bookingData.vehicleColor,
                    specialInstructions: bookingData.specialInstructions,
                    status: 'pending',
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to create booking');
        }

        const data = await response.json();
        return {
            id: data.data.id,
            ...data.data.attributes,
        };
    } catch (error: any) {
        console.error('Error creating booking:', error);
        throw error;
    }
}

/**
 * Get booking by ID
 */
export async function getBooking(id: number): Promise<Booking | null> {
    try {
        const response = await fetch(`${API_URL}/api/bookings/${id}?populate=*`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch booking');
        }

        const data = await response.json();
        return {
            id: data.data.id,
            ...data.data.attributes,
        };
    } catch (error) {
        console.error('Error fetching booking:', error);
        return null;
    }
}
