/**
 * Contractor API client
 * Handles all contractor-specific backend calls
 */

const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

async function getHeaders(token?: string): Promise<HeadersInit> {
    const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('supabase_access_token') : '');

    return {
        "Content-Type": "application/json",
        ...(activeToken ? { "Authorization": `Bearer ${activeToken}` } : {}),
    };
}

/**
 * Fetch dashboard data
 */
export async function fetchDashboard(token?: string): Promise<any> {
    const headers = await getHeaders(token);
    const response = await fetch(`${API_URL}/api/contractors/dashboard`, {
        headers,
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch dashboard: ${response.status}`);
    }

    return response.json();
}

/**
 * Fetch detailed job info
 */
export async function fetchJobDetails(bookingId: string, token?: string): Promise<any> {
    const headers = await getHeaders(token);
    const response = await fetch(`${API_URL}/api/bookings/${bookingId}?populate=*`, {
        headers,
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch job details: ${response.status}`);
    }

    const { data } = await response.json();
    return data;
}

export interface OnboardingStatus {
    success: boolean;
    onboardingComplete: boolean;
    detailsSubmitted: boolean;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    needsAccount?: boolean;
    requirements?: any;
}

/**
 * Initiate Stripe Connect onboarding
 */
export async function initiateOnboarding(token?: string): Promise<{ success: boolean; url: string }> {
    const headers = await getHeaders(token);
    const response = await fetch(`${API_URL}/api/contractors/onboard`, {
        method: "POST",
        headers,
    });

    if (!response.ok) {
        throw new Error(`Failed to initiate onboarding: ${response.status}`);
    }

    return response.json();
}

/**
 * Fetch current onboarding status from backend
 */
export async function fetchOnboardingStatus(token?: string): Promise<OnboardingStatus> {
    const headers = await getHeaders(token);
    const response = await fetch(`${API_URL}/api/contractors/onboarding-status`, {
        headers,
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch onboarding status: ${response.status}`);
    }

    return response.json();
}

/**
 * Accept a job
 */
export async function acceptJob(bookingId: string, token?: string): Promise<{ success: boolean }> {
    const headers = await getHeaders(token);
    const response = await fetch(`${API_URL}/api/contractors/accept-job/${bookingId}`, {
        method: "POST",
        headers,
    });

    if (!response.ok) {
        throw new Error(`Failed to accept job: ${response.status}`);
    }

    return response.json();
}

/**
 * Reject a job
 */
export async function rejectJob(bookingId: string, token?: string): Promise<{ success: boolean }> {
    const headers = await getHeaders(token);
    const response = await fetch(`${API_URL}/api/contractors/reject-job/${bookingId}`, {
        method: "POST",
        headers,
    });

    if (!response.ok) {
        throw new Error(`Failed to reject job: ${response.status}`);
    }

    return response.json();
}

/**
 * Complete a job
 */
export async function completeJob(
    bookingId: string,
    data: { checklist: string; beforePhotos: File[]; afterPhotos: File[] },
    token?: string
): Promise<{ success: boolean }> {
    const headers = await getHeaders(token);
    const formData = new FormData();
    formData.append('checklist', data.checklist);

    data.beforePhotos.forEach((photo, index) => {
        formData.append(`before_photo_${index}`, photo);
    });

    data.afterPhotos.forEach((photo, index) => {
        formData.append(`after_photo_${index}`, photo);
    });

    // Note: When using FormData, fetch sets the Content-Type automatically with boundary
    // We need to remove Content-Type from headers if it was set to application/json
    const mutableHeaders = { ...headers } as any;
    delete mutableHeaders["Content-Type"];

    const response = await fetch(`${API_URL}/api/contractors/complete-job/${bookingId}`, {
        method: "POST",
        headers: mutableHeaders,
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to complete job: ${response.status}`);
    }

    return response.json();
}
