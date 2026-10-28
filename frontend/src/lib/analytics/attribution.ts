/**
 * Remembers where a visitor came from (UTM tags / Google Ads click id) for 30 days,
 * so a booking made days later still knows its source. The latest tagged visit wins.
 * Every function is safe to call when browser storage is blocked.
 */

const STORAGE_KEY = 'lux_attribution';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export interface Attribution {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    gclid?: string;
    landing_page?: string;
}

const FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'] as const;

function clean(value: string | null, max: number): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim().slice(0, max);
    return trimmed || undefined;
}

/** Call on every page view: saves the source only when the URL carries one. */
export function captureAttribution(): void {
    try {
        const params = new URLSearchParams(window.location.search);
        const found: Attribution = {};
        for (const field of FIELDS) {
            const value = clean(params.get(field), 200);
            if (value) found[field] = value;
        }
        if (Object.keys(found).length === 0) return;

        found.landing_page = clean(window.location.pathname, 300);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), data: found }));
    } catch {
        // storage blocked or unavailable: attribution is optional, never break the page
    }
}

/** Returns the saved source (or undefined if none / older than 30 days). */
export function readAttribution(): Attribution | undefined {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return undefined;
        const parsed = JSON.parse(raw) as { savedAt?: number; data?: Attribution };
        if (!parsed?.data || typeof parsed.savedAt !== 'number') return undefined;
        if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
            window.localStorage.removeItem(STORAGE_KEY);
            return undefined;
        }
        const out: Attribution = {};
        for (const field of [...FIELDS, 'landing_page'] as const) {
            const value = parsed.data[field];
            if (typeof value === 'string' && value) out[field] = value.slice(0, field === 'landing_page' ? 300 : 200);
        }
        return Object.keys(out).length ? out : undefined;
    } catch {
        return undefined;
    }
}
