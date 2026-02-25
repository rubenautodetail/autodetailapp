/**
 * API client
 * Services and add-ons are now fetched directly from Supabase.
 * Strapi is no longer required at runtime.
 */

import { createClient } from '@supabase/supabase-js';

// Kept for any remaining Strapi-backed calls (booking create, etc.)
const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || "";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (API_TOKEN) {
    headers["Authorization"] = `Bearer ${API_TOKEN}`;
  }
  return headers;
}

// Supabase client for direct data fetching (replaces Strapi for services/add-ons)
function getSupabaseClient() {
  // No Database generic — keeps TS simple, we type rows explicitly in each mapper
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Service Types (matching Strapi response) ───

export interface StrapiService {
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

export interface StrapiAddOn {
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

export interface StrapiServiceZone {
  id: number;
  documentId: string;
  zipCode: string;
  isActive: boolean;
  coverageRadiusMiles: number;
  priceMultiplier: number;
  peakHoursPricing: number;
  minContractorsRequired: number;
}

export interface StrapiBooking {
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
 * Fetch all services from Supabase (Strapi no longer required at runtime)
 */
export async function fetchServices(locale: string = "en"): Promise<StrapiService[]> {
  const supabase = getSupabaseClient();

  // Try locale-specific services first, fall back to all services
  let { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('locale', locale)
    .order('sort_order', { ascending: true });

  if (error || !data || data.length === 0) {
    // Fallback: get all services regardless of locale
    const { data: allData, error: allError } = await supabase
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true });

    if (allError) throw new Error(`Failed to fetch services: ${allError.message}`);
    data = allData || [];
  }

  // Map Supabase column names to the StrapiService interface
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
 * Fetch all active add-ons from Supabase (Strapi no longer required at runtime)
 */
export async function fetchAddOns(locale: string = "en"): Promise<StrapiAddOn[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('add_ons')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch add-ons: ${error.message}`);

  // Map Supabase column names to the StrapiAddOn interface
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
 * Fetch all active service zones from Strapi
 * NOTE: Returns empty array gracefully if Strapi is offline
 */
export async function fetchServiceZones(): Promise<StrapiServiceZone[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/service-zones?filters[isActive][$eq]=true`,
      { headers: getHeaders(), cache: "no-store" }
    );

    if (!response.ok) return [];

    const json = await response.json();
    return json.data || [];
  } catch {
    return [];
  }
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
  // Uses the Next.js API route (not Strapi) — works locally and in production
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
}): Promise<StrapiBooking> {
  // Uses the Next.js API route (not Strapi) — works locally and in production
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
