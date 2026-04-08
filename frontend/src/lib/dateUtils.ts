/**
 * Safe date utilities — never return Unix epoch (Dec 31 1969) for null/invalid values.
 * All display output is in America/New_York (Eastern) time.
 *
 * Rules:
 * - Always pass DB date strings through these helpers instead of calling new Date() directly.
 * - For plain YYYY-MM-DD date columns, use fmtDate() — appends T12:00:00Z to avoid TZ shift.
 * - For full ISO timestamps (created_at, updated_at), use fmtDateTime().
 * - Both return "—" for null, undefined, or invalid dates.
 * - NEVER call toLocaleString/toLocaleDateString without timeZone: "America/New_York".
 */

const FALLBACK = "—";

function safeDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d;
}

/**
 * Format a YYYY-MM-DD date string (no time component).
 * Appends T12:00:00Z so local-timezone rendering never flips to the previous day.
 */
export function fmtDate(
    value: string | null | undefined,
    locale: string = "en-US",
    options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
): string {
    if (!value) return FALLBACK;
    // If already has a time component, parse as-is
    const iso = value.length === 10 ? value + "T12:00:00Z" : value;
    const d = safeDate(iso);
    if (!d) return FALLBACK;
    return d.toLocaleDateString(locale, { timeZone: "America/New_York", ...options });
}

/**
 * Format a full ISO timestamp (created_at, updated_at, paid_at, etc.).
 */
export function fmtDateTime(
    value: string | null | undefined,
    locale: string = "en-US"
): string {
    const d = safeDate(value ?? null);
    if (!d) return FALLBACK;
    return d.toLocaleString(locale, { timeZone: "America/New_York" });
}

/**
 * Format a time_window value for display with locale support.
 * Handles legacy ("morning"/"afternoon"/"evening") and new HH:MM ("09:00") formats.
 */
export function formatTimeWindow(tw: string | null | undefined, locale: string = "en"): string {
    if (!tw) return FALLBACK;
    const isEs = locale === "es";
    const legacyMap: Record<string, { en: string; es: string }> = {
        morning:   { en: "Morning",   es: "Mañana" },
        afternoon: { en: "Afternoon", es: "Tarde" },
        evening:   { en: "Evening",   es: "Noche" },
    };
    const key = tw.toLowerCase().trim();
    if (legacyMap[key]) return isEs ? legacyMap[key].es : legacyMap[key].en;
    // HH:MM format — convert to localized 12h string
    const match = key.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
        const h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const d = new Date(2000, 0, 1, h, m);
        return d.toLocaleTimeString(isEs ? "es-US" : "en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
    }
    // Already a display string (e.g. "9:00 AM") — return as-is
    return tw;
}

/**
 * Returns hours between a date string and now. Negative = in the past.
 */
export function hoursFromNow(value: string | null | undefined): number {
    const d = safeDate(value ?? null);
    if (!d) return -Infinity;
    return (d.getTime() - Date.now()) / (1000 * 60 * 60);
}

/**
 * Returns a Date object representing "now" in America/New_York.
 * Useful for business-logic comparisons like "is this today?" or "this week/month".
 */
export function easternNow(): Date {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
}

/**
 * Returns today's date as YYYY-MM-DD in Eastern time.
 */
export function easternToday(): string {
    const d = easternNow();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
