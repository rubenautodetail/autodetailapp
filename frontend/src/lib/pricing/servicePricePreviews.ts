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

/**
 * The one home of the stable-reference rule for services and add-ons: the
 * numeric catalog id when we have it, then a numeric own id, then the Hygraph
 * document id (which the pricing resolver also matches). Returning undefined
 * means the item cannot be priced by reference at all.
 */
export function getStableCatalogRef(item: {
    id: string | number;
    catalogId?: number;
    documentId?: string | null;
}): string | number | undefined {
    return item.catalogId
        ?? (typeof item.id === 'number' ? item.id : undefined)
        ?? (item.documentId || undefined);
}

function getStableCatalogId(service: { id: string | number; catalogId?: number; documentId?: string | null }): string | number | undefined {
    return getStableCatalogRef(service);
}

/**
 * True when the pricing endpoint can be asked about this service at all. Services
 * without a stable catalog id are never requested, so callers must not count them
 * as failed lookups.
 */
export function canPreviewServicePrice(service: { id: string | number; catalogId?: number; documentId?: string | null }): boolean {
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
