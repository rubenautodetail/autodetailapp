/**
 * API client
 * Services and add-ons are fetched directly from Supabase.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase client for direct data fetching
function getSupabaseClient() {
  // No Database generic — keeps TS simple, we type rows explicitly in each mapper
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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

/**
 * Fetch all services from Supabase (catalog no longer required at runtime)
 */
export async function fetchServices(locale: string = "en"): Promise<CatalogService[]> {
  const supabase = getSupabaseClient();

  // Try locale-specific services first, fall back to all services
  const { data: initialData, error } = await supabase
    .from('services')
    .select('*')
    .eq('locale', locale)
    .order('sort_order', { ascending: true });
  let data = initialData;

  if (error || !data || data.length === 0) {
    // Fallback: get all services regardless of locale
    const { data: allData, error: allError } = await supabase
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true });

    if (allError) throw new Error(`Failed to fetch services: ${allError.message}`);
    data = allData || [];
  }

  // Map Supabase column names to the CatalogService interface
  return (data || []).map((row) => ({
    id: row.id,
    documentId: row.document_id || String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    basePrice: Number(row.base_price),
    durationMinutes: row.duration_minutes || 60,
    checklist: Array.isArray(row.checklist) ? (row.checklist as string[]) : null,
    sortOrder: row.sort_order || 0,
    locale: row.locale || locale,
  }));
}

/**
 * Fetch all active add-ons from Supabase (catalog no longer required at runtime)
 */
export async function fetchAddOns(locale: string = "en"): Promise<CatalogAddOn[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('add_ons')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch add-ons: ${error.message}`);

  // Map Supabase column names to the CatalogAddOn interface
  return (data || []).map((row) => ({
    id: row.id,
    documentId: row.document_id || String(row.id),
    // Use Spanish name if locale is 'es' and it exists
    name: (locale === 'es' && row.name_es) ? row.name_es : row.name,
    slug: null,
    description: (locale === 'es' && row.description_es) ? row.description_es : (row.description || ''),
    price: Number(row.price),
    durationMinutes: row.duration_minutes || 30,
    checklist: null,
    sortOrder: row.sort_order || 0,
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
