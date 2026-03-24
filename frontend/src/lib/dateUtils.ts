/**
 * Safe date utilities — never return Unix epoch (Dec 31 1969) for null/invalid values.
 *
 * Rules:
 * - Always pass DB date strings through these helpers instead of calling new Date() directly.
 * - For plain YYYY-MM-DD date columns, use fmtDate() — appends T12:00:00Z to avoid TZ shift.
 * - For full ISO timestamps (created_at, updated_at), use fmtDateTime().
 * - Both return "—" for null, undefined, or invalid dates.
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
    return d.toLocaleDateString(locale, options);
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
    return d.toLocaleString(locale);
}

/**
 * Returns hours between a date string and now. Negative = in the past.
 */
export function hoursFromNow(value: string | null | undefined): number {
    const d = safeDate(value ?? null);
    if (!d) return -Infinity;
    return (d.getTime() - Date.now()) / (1000 * 60 * 60);
}
