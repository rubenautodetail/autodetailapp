import type { Locale } from "@/i18n-config";

/**
 * One place that decides how a service is named and what its address (slug) is,
 * so the service pages and the "Services" menu can never disagree.
 */
export type ServiceNameFields = { name: string; name_es: string | null };

export function slugify(input: string): string {
    return input
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

const LOWER_WORDS = new Set([
    "a", "al", "and", "con", "de", "del", "e", "el", "en", "for", "in", "la", "las", "los", "of", "on", "or", "para", "por", "the", "to", "un", "una", "with", "y",
]);
const KEEP_UPPER = new Set(["suv", "uv", "led", "ppf", "vip"]);

/**
 * Service names are stored in capitals in Supabase ("HEADLIGHT RESTORATION").
 * On screen they read better as "Headlight Restoration". Names that are not
 * entirely in capitals are left exactly as they are. The URL slug is not affected.
 */
export function toDisplayName(name: string): string {
    if (name !== name.toUpperCase() || name === name.toLowerCase()) return name;
    let first = true;
    return name.toLowerCase().replace(/[^\s/-]+/g, (word) => {
        const isFirst = first;
        first = false;
        if (KEEP_UPPER.has(word)) return word.toUpperCase();
        if (!isFirst && LOWER_WORDS.has(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
    });
}

/** Name to show for a service in the given language (falls back to English). */
export function serviceName(s: ServiceNameFields, locale: Locale): string {
    return toDisplayName(locale === "es" ? (s.name_es ?? s.name) : s.name);
}

/** URL slug of a service in the given language. */
export function serviceSlug(s: ServiceNameFields, locale: Locale): string {
    return slugify(serviceName(s, locale));
}

/** Address of a service's page. */
export function servicePath(s: ServiceNameFields, locale: Locale): string {
    return `/${locale}/services/${serviceSlug(s, locale)}`;
}
