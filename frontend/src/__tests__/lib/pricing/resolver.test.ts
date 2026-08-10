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
    expect(quote.pricingRevision).toMatch(/^v1_[a-f0-9]{64}$/);
    expect(queriedTables).toEqual(['services', 'service_body_style_prices', 'add_ons']);
  });
});
