/**
 * Strapi API client
 * Centralized client for all Strapi API calls with auth token
 */

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
 * Fetch all services from Strapi
 */
export async function fetchServices(locale: string = "en"): Promise<StrapiService[]> {
  const response = await fetch(
    `${API_URL}/api/services?locale=${locale}&sort=sortOrder:asc`,
    { headers: getHeaders(), cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch services: ${response.status}`);
  }

  const json = await response.json();
  return json.data;
}

/**
 * Fetch all add-ons from Strapi
 */
export async function fetchAddOns(locale: string = "en"): Promise<StrapiAddOn[]> {
  const response = await fetch(
    `${API_URL}/api/add-ons?locale=${locale}&sort=sortOrder:asc`,
    { headers: getHeaders(), cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch add-ons: ${response.status}`);
  }

  const json = await response.json();
  return json.data;
}

/**
 * Fetch all active service zones from Strapi
 */
export async function fetchServiceZones(): Promise<StrapiServiceZone[]> {
  const response = await fetch(
    `${API_URL}/api/service-zones?filters[isActive][$eq]=true`,
    { headers: getHeaders(), cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch service zones: ${response.status}`);
  }

  const json = await response.json();
  return json.data;
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
  const response = await fetch(`${API_URL}/api/booking/validate-zip`, {
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
  const response = await fetch(`${API_URL}/api/booking/create`, {
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
