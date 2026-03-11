/**
 * Contractor API client
 * All contractor data comes from Supabase via /api/contractors/* routes.
 */

// Base URL — relative on client (browser), absolute on server (SSR/RSC)
function getBase(): string {
    if (typeof window !== 'undefined') return '';
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function buildHeaders(token?: string): HeadersInit {
    const activeToken =
        token ||
        (typeof window !== 'undefined' ? localStorage.getItem('supabase_access_token') : '') ||
        '';
    return {
        'Content-Type': 'application/json',
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    };
}

/**
 * Fetch dashboard data (Active jobs, earnings summary, today's schedule)
 */
export async function fetchDashboard(token?: string): Promise<any> {
    const response = await fetch(`${getBase()}/api/contractors/dashboard`, {
        headers: buildHeaders(token),
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch dashboard: ${response.status}`);
    }

    return response.json();
}

/**
 * Fetch detailed job info by booking ID
 */
export async function fetchJobDetails(bookingId: string, token?: string): Promise<any> {
    const response = await fetch(`${getBase()}/api/contractors/jobs/${bookingId}`, {
        headers: buildHeaders(token),
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch job details: ${response.status}`);
    }

    return response.json();
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
    const response = await fetch(`${getBase()}/api/contractors/onboard`, {
        method: 'POST',
        headers: buildHeaders(token),
    });

    if (!response.ok) {
        throw new Error(`Failed to initiate onboarding: ${response.status}`);
    }

    return response.json();
}

/**
 * Fetch current onboarding status
 */
export async function fetchOnboardingStatus(token?: string): Promise<OnboardingStatus> {
    const response = await fetch(`${getBase()}/api/contractors/onboarding-status`, {
        headers: buildHeaders(token),
        cache: 'no-store',
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
    const response = await fetch(`${getBase()}/api/contractors/accept-job`, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({ bookingId }),
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
    const response = await fetch(`${getBase()}/api/contractors/reject-job`, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({ bookingId }),
    });

    if (!response.ok) {
        throw new Error(`Failed to reject job: ${response.status}`);
    }

    return response.json();
}

/**
 * Complete a job (with photos)
 */
export async function completeJob(
    bookingId: string,
    data: { checklist: string; beforePhotos: File[]; afterPhotos: File[] },
    token?: string
): Promise<{ success: boolean }> {
    const activeToken =
        token ||
        (typeof window !== 'undefined' ? localStorage.getItem('supabase_access_token') : '') ||
        '';

    const formData = new FormData();
    formData.append('bookingId', bookingId);
    formData.append('checklist', data.checklist);

    data.beforePhotos.forEach((photo, index) => {
        formData.append(`before_photo_${index}`, photo);
    });

    data.afterPhotos.forEach((photo, index) => {
        formData.append(`after_photo_${index}`, photo);
    });

    const response = await fetch(`${getBase()}/api/contractors/complete-job`, {
        method: 'POST',
        headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to complete job: ${response.status}`);
    }

    return response.json();
}
