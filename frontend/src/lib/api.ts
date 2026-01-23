/**
 * Strapi API Client
 * Typed fetcher utilities for Strapi v5 backend
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

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

    // ZIP Validation
    async validateZip(zipCode: string): Promise<ZipValidationResponse> {
        return this.postRaw<ZipValidationResponse>('/booking/validate-zip', { zipCode });
    }

    // Price Calculation
    async calculatePrice(serviceId: string, addOnIds: string[], zipCode: string): Promise<PriceCalculation> {
        return this.postRaw<PriceCalculation>('/booking/calculate-price', { serviceId, addOnIds, zipCode });
    }

    // Availability Check
    async getAvailability(zipCode: string, serviceId: string | undefined, month: string): Promise<AvailabilityResponse> {
        return this.postRaw<AvailabilityResponse>('/booking/availability', { zipCode, serviceId, month });
    }

    // Slot Hold
    async holdSlot(zipCode: string, date: string, timeWindow: string, duration: number): Promise<SlotHoldResponse> {
        return this.postRaw<SlotHoldResponse>('/booking/hold-slot', { zipCode, date, timeWindow, duration });
    }
}

// Export singleton instance
export const strapiClient = new ApiClient(STRAPI_URL, STRAPI_TOKEN);

// Export types for use in components
export type { StrapiResponse, StrapiError };

