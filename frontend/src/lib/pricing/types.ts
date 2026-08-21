export const BODY_STYLES = [
  'sedan',
  'coupe',
  'suv',
  'large_suv',
  'pickup',
  'minivan',
  'van',
  'other',
] as const;

export type BodyStyle = (typeof BODY_STYLES)[number];
export type LegacyBodyStyle = BodyStyle | 'truck';

export interface PricingVehicleInput {
  bodyStyle: LegacyBodyStyle;
  vehicleId?: string;
  /** Per-vehicle service. Falls back to the booking's default service when omitted. */
  serviceId?: string | number;
}

export interface ResolveBookingPriceInput {
  serviceId?: string | number;
  serviceName?: string;
  addOnIds?: Array<string | number>;
  addOnNames?: string[];
  vehicles: PricingVehicleInput[];
  currency?: 'usd';
}

export interface ResolvedAddOn {
  id: number;
  documentId: string | null;
  name: string;
  priceCents: number;
  durationMinutes: number;
}

export interface VehiclePriceLine {
  index: number;
  vehicleId?: string;
  bodyStyle: BodyStyle;
  serviceId: number;
  serviceName: string;
  serviceDurationMinutes: number;
  priceSource: 'override' | 'base';
  servicePriceCents: number;
  addOnsPriceCents: number;
  totalCents: number;
}

export interface ResolvedBookingPrice {
  service: {
    id: number;
    documentId: string | null;
    name: string;
    basePriceCents: number;
    durationMinutes: number;
  };
  addOns: ResolvedAddOn[];
  vehicles: VehiclePriceLine[];
  subtotalCents: number;
  serviceFeeCents: 0;
  totalCents: number;
  totalDurationMinutes: number;
  currency: 'usd';
  pricingRevision: string;
}

export class PricingInputError extends Error {
  constructor(message: string, public readonly code: 'SERVICE_NOT_FOUND' | 'INVALID_ADD_ON' | 'INVALID_PRICE') {
    super(message);
    this.name = 'PricingInputError';
  }
}
