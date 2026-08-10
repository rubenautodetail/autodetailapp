import { createHash } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { decimalToCents } from './money';
import {
  type BodyStyle,
  type LegacyBodyStyle,
  PricingInputError,
  type ResolveBookingPriceInput,
  type ResolvedAddOn,
  type ResolvedBookingPrice,
} from './types';

type PricingClient = ReturnType<typeof createServiceClient>;

interface ServiceRow {
  id: number;
  document_id: string | null;
  name: string;
  base_price: string | number;
  duration_minutes: number | null;
  updated_at: string;
}

interface OverrideRow {
  service_id: number;
  body_style: BodyStyle;
  price_cents: number;
  currency: string;
  updated_at: string;
}

interface AddOnRow {
  id: number;
  document_id: string | null;
  name: string;
  price: string | number;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

function normalizeBodyStyle(style: LegacyBodyStyle): BodyStyle {
  return style === 'truck' ? 'pickup' : style;
}

async function findService(
  client: PricingClient,
  serviceId?: string | number,
  serviceName?: string,
): Promise<ServiceRow | null> {
  if (serviceId !== undefined && String(serviceId).trim() !== '') {
    const id = String(serviceId).trim();
    const query = client
      .from('services')
      .select('id, document_id, name, base_price, duration_minutes, updated_at')
      .eq('is_active', true);
    const result = /^\d+$/.test(id)
      ? await query.eq('id', Number(id)).maybeSingle()
      : await query.eq('document_id', id).maybeSingle();
    if (result.error) throw result.error;
    return result.data as ServiceRow | null;
  }

  if (!serviceName) return null;
  const { data, error } = await client
    .from('services')
    .select('id, document_id, name, base_price, duration_minutes, updated_at')
    .eq('name', serviceName)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data as ServiceRow | null;
}

async function loadAddOns(
  client: PricingClient,
  addOnIds: Array<string | number>,
  addOnNames: string[],
): Promise<AddOnRow[]> {
  const ids = [...new Set(addOnIds.map(String).map((id) => id.trim()).filter(Boolean))];
  const names = [...new Set(addOnNames.map((name) => name.trim()).filter(Boolean))];

  if (ids.length > 0) {
    const numericIds = ids.filter((id) => /^\d+$/.test(id)).map(Number);
    const documentIds = ids.filter((id) => !/^\d+$/.test(id));
    const queries: Array<{
      expectedCount: number;
      query: PromiseLike<{ data: unknown; error: { message: string } | null }>;
    }> = [];
    if (numericIds.length > 0) {
      queries.push({
        expectedCount: numericIds.length,
        query: client.from('add_ons')
          .select('id, document_id, name, price, duration_minutes, created_at, updated_at')
          .in('id', numericIds).eq('is_active', true),
      });
    }
    if (documentIds.length > 0) {
      queries.push({
        expectedCount: documentIds.length,
        query: client.from('add_ons')
          .select('id, document_id, name, price, duration_minutes, created_at, updated_at')
          .in('document_id', documentIds).eq('is_active', true),
      });
    }
    const results = await Promise.all(queries.map(({ query }) => query));
    for (const [index, result] of results.entries()) {
      if (result.error) throw result.error;
      if (((result.data ?? []) as AddOnRow[]).length !== queries[index].expectedCount) {
        throw new PricingInputError('One or more add-ons are invalid or inactive', 'INVALID_ADD_ON');
      }
    }
    const uniqueRows = new Map<number, AddOnRow>();
    for (const result of results) {
      for (const row of (result.data ?? []) as AddOnRow[]) uniqueRows.set(row.id, row);
    }
    return [...uniqueRows.values()];
  }

  if (names.length === 0) return [];
  const { data, error } = await client.from('add_ons')
    .select('id, document_id, name, price, duration_minutes, created_at, updated_at')
    .in('name', names).eq('is_active', true);
  if (error) throw error;
  const rows = (data ?? []) as AddOnRow[];
  if (rows.length !== names.length) {
    throw new PricingInputError('One or more add-ons are invalid or inactive', 'INVALID_ADD_ON');
  }
  return rows;
}

export async function resolveBookingPrice(
  input: ResolveBookingPriceInput,
  client: PricingClient = createServiceClient(),
): Promise<ResolvedBookingPrice> {
  if (input.vehicles.length === 0) {
    throw new PricingInputError('At least one vehicle is required', 'INVALID_PRICE');
  }

  const service = await findService(client, input.serviceId, input.serviceName?.trim());
  if (!service) {
    throw new PricingInputError('Service not found or inactive', 'SERVICE_NOT_FOUND');
  }

  const styles = input.vehicles.map((vehicle) => normalizeBodyStyle(vehicle.bodyStyle));
  const uniqueStyles = [...new Set(styles)];
  const [overrideResult, addOns] = await Promise.all([
    client.from('service_body_style_prices')
      .select('service_id, body_style, price_cents, currency, updated_at')
      .eq('service_id', service.id)
      .in('body_style', uniqueStyles),
    loadAddOns(client, input.addOnIds ?? [], input.addOnNames ?? []),
  ]);
  if (overrideResult.error) throw overrideResult.error;

  const overrides = (overrideResult.data ?? []) as OverrideRow[];
  if (overrides.some((override) => override.currency !== (input.currency ?? 'usd'))) {
    throw new PricingInputError('A configured service price has an invalid currency', 'INVALID_PRICE');
  }
  if (overrides.some((override) => !Number.isSafeInteger(override.price_cents) || override.price_cents <= 0)) {
    throw new PricingInputError('A configured service price is invalid', 'INVALID_PRICE');
  }

  const basePriceCents = decimalToCents(service.base_price);
  const resolvedAddOns: ResolvedAddOn[] = addOns
    .map((addOn) => ({
      id: addOn.id,
      documentId: addOn.document_id,
      name: addOn.name,
      priceCents: decimalToCents(addOn.price),
      durationMinutes: addOn.duration_minutes ?? 0,
    }))
    .sort((a, b) => a.id - b.id);
  const addOnsPriceCents = resolvedAddOns.reduce((sum, addOn) => sum + addOn.priceCents, 0);
  const overrideByStyle = new Map(overrides.map((override) => [override.body_style, override]));

  const vehicles = styles.map((bodyStyle, index) => {
    const override = overrideByStyle.get(bodyStyle);
    const servicePriceCents = override?.price_cents ?? basePriceCents;
    return {
      index,
      ...(input.vehicles[index].vehicleId ? { vehicleId: input.vehicles[index].vehicleId } : {}),
      bodyStyle,
      priceSource: override ? 'override' as const : 'base' as const,
      servicePriceCents,
      addOnsPriceCents,
      totalCents: servicePriceCents + addOnsPriceCents,
    };
  });

  const revisionPayload = {
    version: 1,
    currency: input.currency ?? 'usd',
    service: [service.id, basePriceCents, service.updated_at],
    overrides: overrides
      .map((row) => [row.body_style, row.price_cents, row.currency, row.updated_at])
      .sort(([a], [b]) => String(a).localeCompare(String(b))),
    addOns: addOns
      .map((row) => [row.id, decimalToCents(row.price), row.updated_at ?? row.created_at])
      .sort(([a], [b]) => Number(a) - Number(b)),
  };
  const pricingRevision = `v1_${createHash('sha256')
    .update(JSON.stringify(revisionPayload))
    .digest('hex')}`;

  return {
    service: {
      id: service.id,
      documentId: service.document_id,
      name: service.name,
      basePriceCents,
      durationMinutes: service.duration_minutes ?? 60,
    },
    addOns: resolvedAddOns,
    vehicles,
    subtotalCents: vehicles.reduce((sum, vehicle) => sum + vehicle.totalCents, 0),
    serviceFeeCents: 0,
    totalCents: vehicles.reduce((sum, vehicle) => sum + vehicle.totalCents, 0),
    totalDurationMinutes: vehicles.length * (
      (service.duration_minutes ?? 60) +
      resolvedAddOns.reduce((sum, addOn) => sum + addOn.durationMinutes, 0)
    ),
    currency: input.currency ?? 'usd',
    pricingRevision,
  };
}

export { centsToDollars, decimalToCents, formatCents } from './money';
export * from './types';
