import type { Service } from '@/contexts/BookingContext';
import type { VehicleBodyStyle } from '@/types/vehicle';

export interface ServicePricePreviewVehicle {
    vehicleId?: string;
    bodyStyle: VehicleBodyStyle;
}

export interface ServicePricePreview {
    servicePrice: number;
    priceSource: 'override' | 'base' | 'mixed';
    vehicleCount: number;
}

interface PricePreviewResponse {
    vehicles: {
        priceSource: 'override' | 'base';
        servicePrice: number;
    }[];
}

export function getServicePricePreviewKey(service: Pick<Service, 'id' | 'catalogId'>): string {
    return String(service.catalogId ?? service.id);
}

function getStableCatalogId(service: Pick<Service, 'id' | 'catalogId'>): string | number | undefined {
    return service.catalogId ?? (typeof service.id === 'number' ? service.id : undefined);
}

/**
 * True when the pricing endpoint can be asked about this service at all. Services
 * without a stable catalog id are never requested, so callers must not count them
 * as failed lookups.
 */
export function canPreviewServicePrice(service: Pick<Service, 'id' | 'catalogId'>): boolean {
    return getStableCatalogId(service) !== undefined;
}

function summarizePreview(payload: PricePreviewResponse): ServicePricePreview | null {
    if (payload.vehicles.length === 0) return null;

    const overrideCount = payload.vehicles.filter((vehicle) => vehicle.priceSource === 'override').length;
    const priceSource = overrideCount === payload.vehicles.length
        ? 'override'
        : overrideCount === 0
            ? 'base'
            : 'mixed';

    return {
        servicePrice: payload.vehicles.reduce((sum, vehicle) => sum + vehicle.servicePrice, 0),
        priceSource,
        vehicleCount: payload.vehicles.length,
    };
}

export async function fetchServicePricePreviews(
    services: Service[],
    vehicles: ServicePricePreviewVehicle[],
    signal?: AbortSignal,
): Promise<Record<string, ServicePricePreview>> {
    const entries = await Promise.all(services.map(async (service) => {
        const serviceId = getStableCatalogId(service);
        if (serviceId === undefined) return null;

        try {
            const response = await fetch('/api/booking/calculate-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId,
                    serviceName: service.name,
                    vehicles,
                }),
                signal,
            });

            if (!response.ok) return null;
            const preview = summarizePreview(await response.json() as PricePreviewResponse);
            return preview ? [getServicePricePreviewKey(service), preview] as const : null;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') throw error;
            return null;
        }
    }));

    return Object.fromEntries(entries.filter((entry): entry is readonly [string, ServicePricePreview] => entry !== null));
}
