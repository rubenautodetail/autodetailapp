/**
 * API client
 * Services and add-ons are fetched directly from Supabase.
 */

// Base URL for internal API calls (absolute on server, relative on client)
function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

// ─── Service Types (matching catalog response) ───

export interface CatalogService {
  id: number;
  documentId: string;
  name: string;
  slug: string | null;
  description: string;
  basePrice: number;
  durationMinutes: number;
  checklist: string[] | null;
  sortOrder: number;
  locale: string;
}

export interface CatalogAddOn {
  id: number;
  documentId: string;
  name: string;
  slug: string | null;
  description: string;
  price: number;
  durationMinutes: number;
  checklist: string[] | null;
  sortOrder: number;
  locale: string;
}

export interface CatalogServiceZone {
  id: number;
  documentId: string;
  zipCode: string;
  isActive: boolean;
  coverageRadiusMiles: number;
  priceMultiplier: number;
  peakHoursPricing: number;
  minContractorsRequired: number;
}

export interface CatalogBooking {
  id: number;
  documentId: string;
  confirmationCode: string;
  status: string;
  date: string;
  timeWindow: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  subtotal: number;
  serviceFee: number;
  total: number;
}

// ─── API Functions ───

// Shared fetcher — calls the internal API route which uses service-role key (no RLS issues)
async function fetchCatalogData(): Promise<{ services: Record<string, unknown>[]; addOns: Record<string, unknown>[] }> {
  const res = await fetch(`${getBaseUrl()}/api/services/available`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch catalog: ${res.status}`);
  return res.json();
}

/**
 * Fetch all active services via the internal API (service-role key, bypasses RLS).
 */
export async function fetchServices(locale: string = "en"): Promise<CatalogService[]> {
  const { services } = await fetchCatalogData();
  return (services || []).map((row) => ({
    id: row.id as number,
    documentId: String(row.id),
    name: (locale === 'es' && row.name_es) ? row.name_es as string : row.name as string,
    slug: null,
    description: (locale === 'es' && row.description_es) ? row.description_es as string : (row.description as string || ''),
    basePrice: Number(row.base_price),
    durationMinutes: (row.duration_minutes as number) || 60,
    checklist: null,
    sortOrder: (row.sort_order as number) || 0,
    locale,
  }));
}

/**
 * Fetch all active add-ons via the internal API (service-role key, bypasses RLS).
 */
export async function fetchAddOns(locale: string = "en"): Promise<CatalogAddOn[]> {
  const { addOns } = await fetchCatalogData();
  return (addOns || []).map((row) => ({
    id: row.id as number,
    documentId: String(row.id),
    name: (locale === 'es' && row.name_es) ? row.name_es as string : row.name as string,
    slug: null,
    description: (locale === 'es' && row.description_es) ? row.description_es as string : (row.description as string || ''),
    price: Number(row.price),
    durationMinutes: (row.duration_minutes as number) || 30,
    checklist: null,
    sortOrder: (row.sort_order as number) || 0,
    locale,
  }));
}

/**
 * Validate a ZIP code using the public custom booking endpoint.
 * Uses POST /api/booking/validate-zip (auth: false) instead of
 * the service-zones API which requires admin permissions.
 */
export async function validateZip(zipCode: string): Promise<{
  available: boolean;
  priceMultiplier: number;
}> {
  // Uses the Next.js API route (not catalog) — works locally and in production
  const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  const response = await fetch(`${baseUrl}/api/booking/validate-zip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ zipCode }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to validate ZIP: ${response.status}`);
  }

  const json = await response.json();
  return {
    available: json.available === true,
    priceMultiplier: json.zone?.priceMultiplier ?? 1,
  };
}

/**
 * Create a booking via the public custom endpoint.
 * Uses POST /api/booking/create (auth: false) which generates
 * confirmation codes server-side.
 */
export async function createBooking(data: {
  service: number;
  addOns: number[];
  date: string;
  timeWindow: "morning" | "afternoon" | "evening";
  address: string;
  city: string;
  state: string;
  zipCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialInstructions?: string;
  subtotal: number;
  serviceFee: number;
  total: number;
}): Promise<CatalogBooking> {
  // Uses the Next.js API route (not catalog) — works locally and in production
  const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  const response = await fetch(`${baseUrl}/api/booking/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.error?.message || `Failed to create booking: ${response.status}`
    );
  }

  const json = await response.json();
  return json.data;
}
