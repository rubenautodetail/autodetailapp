/**
 * Strapi API Client
 * Typed fetcher utilities for Strapi v5 backend
 * NOTE: Booking endpoints now use Next.js API routes, not Strapi.
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

// Base URL for Next.js API routes (relative on client, absolute on server)
function getNextApiBase(): string {
    if (typeof window !== 'undefined') return ''; // browser — relative URL
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

// Debug log to verify environment variable is loaded
if (typeof window !== 'undefined') {
    console.log('[API] Using Strapi URL:', STRAPI_URL);
}

interface StrapiResponse<T> {
    data: T;
    meta?: {
        pagination?: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        };
    };
}

interface StrapiError {
    status: number;
    name: string;
    message: string;
}

// ZIP Validation Types
export interface ZipValidationResponse {
    available: boolean;
    zipCode: string;
    message: string;
    zone?: {
        coverageRadiusMiles: number;
        priceMultiplier: number;
    };
    services?: Array<{
        id: string;
        name: string;
        description: string;
        basePrice: number;
        durationMinutes: number;
    }>;
    addOns?: Array<{
        id: string;
        name: string;
        description: string;
        price: number;
        durationMinutes: number;
    }>;
    contractors?: number;
    nextAvailableDate?: string;
}

// Price Calculation Types
export interface PriceCalculation {
    service: {
        id: string;
        name: string;
        basePrice: number;
        adjustedPrice: number;
    };
    addOns: Array<{
        id: string;
        name: string;
        price: number;
    }>;
    zone: {
        zipCode: string;
        multiplier: number;
    };
    breakdown: {
        basePrice: number;
        addOnsTotal: number;
        subtotal: number;
        serviceFee: number;
        total: number;
    };
    totalDuration: number;
}

// Availability Types
export interface AvailabilityResponse {
    available: boolean;
    zipCode?: string;
    month?: string;
    serviceDuration?: number;
    contractorCount?: number;
    message?: string;
    availableDates: Array<{
        date: string;
        slots: Array<{
            window: 'morning' | 'afternoon' | 'evening';
            label: string;
            contractorsAvailable: number;
        }>;
    }>;
    nextAvailable: {
        date: string;
        window: string;
        label: string;
    } | null;
}

// Slot Hold Types
export interface SlotHoldResponse {
    success: boolean;
    message?: string;
    holdToken?: string;
    expiresAt?: string;
    contractor?: {
        id: string;
        name: string;
    };
    slot?: {
        date: string;
        timeWindow: string;
        duration: number;
    };
}

class ApiClient {
    private baseUrl: string;
    private token?: string;

    constructor(baseUrl: string, token?: string) {
        this.baseUrl = baseUrl;
        this.token = token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<StrapiResponse<T>> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error: StrapiError = await response.json();
            throw new Error(error.message || `API Error: ${response.status}`);
        }

        return response.json();
    }

    // GET request
    async get<T>(endpoint: string, params?: Record<string, string>): Promise<StrapiResponse<T>> {
        const searchParams = params ? `?${new URLSearchParams(params)}` : '';
        return this.request<T>(`${endpoint}${searchParams}`, { method: 'GET' });
    }

    // POST request
    async post<T>(endpoint: string, data: unknown): Promise<StrapiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify({ data }),
        });
    }

    // POST request without data wrapper (for custom endpoints)
    async postRaw<T>(endpoint: string, body: unknown): Promise<T> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `API Error: ${response.status}`);
        }

        return response.json();
    }

    // PUT request
    async put<T>(endpoint: string, data: unknown): Promise<StrapiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify({ data }),
        });
    }

    // DELETE request
    async delete<T>(endpoint: string): Promise<StrapiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    // ZIP Validation — calls Next.js API route, not Strapi
    async validateZip(zipCode: string): Promise<ZipValidationResponse> {
        const base = getNextApiBase();
        const response = await fetch(`${base}/api/booking/validate-zip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zipCode }),
        });
        if (!response.ok) throw new Error(`validate-zip failed: ${response.status}`);
        return response.json();
    }

    // Price Calculation — calls Next.js API route, not Strapi
    async calculatePrice(serviceId: string, addOnIds: string[], zipCode: string): Promise<PriceCalculation> {
        const base = getNextApiBase();
        const response = await fetch(`${base}/api/booking/calculate-price`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serviceId, addOnIds, zipCode }),
        });
        if (!response.ok) throw new Error(`calculate-price failed: ${response.status}`);
        return response.json();
    }

    // Availability Check — calls Next.js API route, not Strapi
    async getAvailability(zipCode: string, serviceId: string | undefined, month: string): Promise<AvailabilityResponse> {
        const base = getNextApiBase();
        const response = await fetch(`${base}/api/booking/availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zipCode, serviceId, month }),
        });
        if (!response.ok) throw new Error(`availability failed: ${response.status}`);
        return response.json();
    }

    // Slot Hold — calls Next.js API route, not Strapi
    async holdSlot(zipCode: string, date: string, timeWindow: string, duration: number): Promise<SlotHoldResponse> {
        const base = getNextApiBase();
        const response = await fetch(`${base}/api/booking/hold-slot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zipCode, date, timeWindow, duration }),
        });
        if (!response.ok) throw new Error(`hold-slot failed: ${response.status}`);
        return response.json();
    }
}

// Export singleton instance
export const strapiClient = new ApiClient(STRAPI_URL, STRAPI_TOKEN);

// Export types for use in components
export type { StrapiResponse, StrapiError };

