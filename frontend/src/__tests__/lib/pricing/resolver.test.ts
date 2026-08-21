import { resolveBookingPrice } from '@/lib/pricing';

type Row = Record<string, unknown>;

class FakeQuery implements PromiseLike<{ data: Row[]; error: null }> {
  private filters: Array<(row: Row) => boolean> = [];

  constructor(private readonly rows: Row[]) {}

  select() { return this; }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  in(column: string, values: readonly unknown[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  private data() {
    return this.rows.filter((row) => this.filters.every((filter) => filter(row)));
  }

  async maybeSingle() {
    return { data: this.data()[0] ?? null, error: null };
  }

  then<TResult1 = { data: Row[]; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: Row[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve({ data: this.data(), error: null }).then(onfulfilled, onrejected);
  }
}

describe('resolveBookingPrice', () => {
  it('uses exact overrides, base fallback, and applies unchanged add-ons per vehicle', async () => {
    const tables: Record<string, Row[]> = {
      services: [{
        id: 7,
        document_id: 'service-doc',
        name: 'Complete Detail',
        base_price: '100.00',
        duration_minutes: 90,
        updated_at: '2026-08-01T00:00:00Z',
        is_active: true,
      }],
      service_body_style_prices: [{
        service_id: 7,
        body_style: 'large_suv',
        price_cents: 14500,
        currency: 'usd',
        updated_at: '2026-08-02T00:00:00Z',
      }],
      add_ons: [{
        id: 3,
        document_id: null,
        name: 'Pet Hair',
        price: '20.00',
        duration_minutes: 15,
        created_at: '2026-08-01T00:00:00Z',
        updated_at: '2026-08-03T00:00:00Z',
        is_active: true,
      }],
    };
    const queriedTables: string[] = [];
    const client = {
      from(table: string) {
        queriedTables.push(table);
        return new FakeQuery(tables[table] ?? []);
      },
    } as unknown as NonNullable<Parameters<typeof resolveBookingPrice>[1]>;

    const quote = await resolveBookingPrice({
      serviceId: 7,
      addOnIds: [3],
      vehicles: [{ bodyStyle: 'large_suv' }, { bodyStyle: 'sedan' }, { bodyStyle: 'truck' }],
    }, client);

    expect(quote.vehicles).toEqual([
      expect.objectContaining({ bodyStyle: 'large_suv', priceSource: 'override', totalCents: 16500 }),
      expect.objectContaining({ bodyStyle: 'sedan', priceSource: 'base', totalCents: 12000 }),
      expect.objectContaining({ bodyStyle: 'pickup', priceSource: 'base', totalCents: 12000 }),
    ]);
    expect(quote.totalCents).toBe(40500);
    expect(quote.pricingRevision).toMatch(/^v3_[a-f0-9]{64}$/);
    expect(queriedTables).toEqual(['services', 'service_body_style_prices', 'add_ons']);
  });

  it('prices each vehicle with its own service and falls back to the default', async () => {
    const tables: Record<string, Row[]> = {
      services: [
        {
          id: 7, document_id: 'express-doc', name: 'Express Detail', base_price: '75.00',
          duration_minutes: 80, updated_at: '2026-08-01T00:00:00Z', is_active: true,
        },
        {
          id: 9, document_id: 'interior-doc', name: 'Interior Detail', base_price: '160.00',
          duration_minutes: 180, updated_at: '2026-08-01T00:00:00Z', is_active: true,
        },
      ],
      service_body_style_prices: [
        // Pickup override exists for Express only; Interior has none.
        { service_id: 7, body_style: 'pickup', price_cents: 10000, currency: 'usd', updated_at: '2026-08-02T00:00:00Z' },
      ],
      add_ons: [{
        id: 3, document_id: null, name: 'Pet Hair', price: '20.00', duration_minutes: 15,
        created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-03T00:00:00Z', is_active: true,
      }],
    };
    const client = {
      from(table: string) { return new FakeQuery(tables[table] ?? []); },
    } as unknown as NonNullable<Parameters<typeof resolveBookingPrice>[1]>;

    const quote = await resolveBookingPrice({
      serviceId: 7,
      addOnIds: [3],
      vehicles: [
        { bodyStyle: 'pickup' },                    // default service (Express, override 100)
        { bodyStyle: 'sedan', serviceId: 9 },       // Interior, base 160
      ],
    }, client);

    expect(quote.vehicles[0]).toMatchObject({
      serviceId: 7, serviceName: 'Express Detail', priceSource: 'override',
      servicePriceCents: 10000, addOnsPriceCents: 2000, totalCents: 12000,
    });
    expect(quote.vehicles[1]).toMatchObject({
      serviceId: 9, serviceName: 'Interior Detail', priceSource: 'base',
      servicePriceCents: 16000, addOnsPriceCents: 2000, totalCents: 18000,
    });
    // Group totals sum both lines; duration respects each service.
    expect(quote.totalCents).toBe(30000);
    expect(quote.totalDurationMinutes).toBe(80 + 15 + 180 + 15);
    // The default service stays the summary service; the revision hash is v2.
    expect(quote.service.id).toBe(7);
    expect(quote.pricingRevision).toMatch(/^v3_[a-f0-9]{64}$/);
  });

  it('resolves a non-canonical per-vehicle key instead of silently using the default', async () => {
    const tables: Record<string, Row[]> = {
      services: [
        {
          id: 7, document_id: null, name: 'Express Detail', base_price: '75.00',
          duration_minutes: 80, updated_at: '2026-08-01T00:00:00Z', is_active: true,
        },
        {
          id: 9, document_id: null, name: 'Interior Detail', base_price: '160.00',
          duration_minutes: 180, updated_at: '2026-08-01T00:00:00Z', is_active: true,
        },
      ],
      service_body_style_prices: [],
      add_ons: [],
    };
    const client = {
      from(table: string) { return new FakeQuery(tables[table] ?? []); },
    } as unknown as NonNullable<Parameters<typeof resolveBookingPrice>[1]>;

    // '9' with whitespace: trimmed key still resolves to Interior Detail.
    const quote = await resolveBookingPrice({
      serviceId: 7,
      vehicles: [{ bodyStyle: 'sedan', serviceId: ' 9 ' }],
    }, client);
    expect(quote.vehicles[0]).toMatchObject({ serviceId: 9, serviceName: 'Interior Detail' });
  });

  it('rejects a per-vehicle service that does not exist', async () => {
    const tables: Record<string, Row[]> = {
      services: [{
        id: 7, document_id: null, name: 'Express Detail', base_price: '75.00',
        duration_minutes: 80, updated_at: '2026-08-01T00:00:00Z', is_active: true,
      }],
      service_body_style_prices: [],
      add_ons: [],
    };
    const client = {
      from(table: string) { return new FakeQuery(tables[table] ?? []); },
    } as unknown as NonNullable<Parameters<typeof resolveBookingPrice>[1]>;

    await expect(resolveBookingPrice({
      serviceId: 7,
      vehicles: [{ bodyStyle: 'sedan', serviceId: 999 }],
    }, client)).rejects.toThrow('Service not found or inactive');
  });

  it('prices each vehicle with its own add-ons, falling back to the booking-wide list', async () => {
    const tables: Record<string, Row[]> = {
      services: [{
        id: 7, document_id: null, name: 'Complete Detail', base_price: '100.00',
        duration_minutes: 90, updated_at: '2026-08-01T00:00:00Z', is_active: true,
      }],
      service_body_style_prices: [],
      add_ons: [
        { id: 3, document_id: null, name: 'Pet Hair', price: '20.00', duration_minutes: 15,
          created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-03T00:00:00Z', is_active: true },
        { id: 5, document_id: 'wax-doc', name: 'Wax', price: '30.00', duration_minutes: 10,
          created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-03T00:00:00Z', is_active: true },
      ],
    };
    const client = {
      from(table: string) { return new FakeQuery(tables[table] ?? []); },
    } as unknown as NonNullable<Parameters<typeof resolveBookingPrice>[1]>;

    const quote = await resolveBookingPrice({
      serviceId: 7,
      addOnIds: [3],
      vehicles: [
        { bodyStyle: 'sedan' },                        // inherits the booking-wide [3]
        { bodyStyle: 'sedan', addOnIds: [] },          // explicitly none
        { bodyStyle: 'sedan', addOnIds: ['wax-doc'] }, // its own, by document id
      ],
    }, client);

    expect(quote.vehicles.map((line) => [line.addOns.map((a) => a.id), line.addOnsPriceCents, line.totalCents])).toEqual([
      [[3], 2000, 12000],
      [[], 0, 10000],
      [[5], 3000, 13000],
    ]);
    expect(quote.addOns.map((addOn) => addOn.id)).toEqual([3, 5]);
    expect(quote.totalCents).toBe(35000);
    expect(quote.totalDurationMinutes).toBe(90 + 15 + 90 + 90 + 10);
  });

  it('hashes which vehicle carries which add-on into the pricing revision', async () => {
    const tables: Record<string, Row[]> = {
      services: [{
        id: 7, document_id: null, name: 'Complete Detail', base_price: '100.00',
        duration_minutes: 90, updated_at: '2026-08-01T00:00:00Z', is_active: true,
      }],
      service_body_style_prices: [],
      add_ons: [{ id: 3, document_id: null, name: 'Pet Hair', price: '20.00', duration_minutes: 15,
        created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-03T00:00:00Z', is_active: true }],
    };
    const client = {
      from(table: string) { return new FakeQuery(tables[table] ?? []); },
    } as unknown as NonNullable<Parameters<typeof resolveBookingPrice>[1]>;

    const onFirst = await resolveBookingPrice({
      serviceId: 7,
      vehicles: [{ bodyStyle: 'sedan', addOnIds: [3] }, { bodyStyle: 'suv', addOnIds: [] }],
    }, client);
    const onSecond = await resolveBookingPrice({
      serviceId: 7,
      vehicles: [{ bodyStyle: 'sedan', addOnIds: [] }, { bodyStyle: 'suv', addOnIds: [3] }],
    }, client);

    expect(onFirst.totalCents).toBe(onSecond.totalCents);
    expect(onFirst.pricingRevision).not.toBe(onSecond.pricingRevision);
  });

  it('rejects a per-vehicle add-on that does not exist', async () => {
    const tables: Record<string, Row[]> = {
      services: [{
        id: 7, document_id: null, name: 'Complete Detail', base_price: '100.00',
        duration_minutes: 90, updated_at: '2026-08-01T00:00:00Z', is_active: true,
      }],
      service_body_style_prices: [],
      add_ons: [],
    };
    const client = {
      from(table: string) { return new FakeQuery(tables[table] ?? []); },
    } as unknown as NonNullable<Parameters<typeof resolveBookingPrice>[1]>;

    await expect(resolveBookingPrice({
      serviceId: 7,
      vehicles: [{ bodyStyle: 'sedan', addOnIds: [999] }],
    }, client)).rejects.toThrow('One or more add-ons are invalid or inactive');
  });
});
