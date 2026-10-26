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

/**
 * Names shown to customers, chosen from what people actually search on Google
 * (keyword research, October 2026). The key is the page address of the service.
 * Supabase keeps the original names, so page addresses, prices and bookings do not change.
 * Services not listed here keep the name stored in Supabase.
 */
const CUSTOMER_NAMES: Record<Locale, Record<string, string>> = {
    en: {
        "exterior-detail": "Exterior Hand Wash & Wax",
        "paint-enhancement": "1-Step Paint Correction",
    },
    es: {
        "detallado-express": "Lavado Express",
        "detallado-interior": "Limpieza Interior",
        "detallado-exterior": "Lavado Exterior y Encerado",
        "detallado-completo": "Lavado Completo",
        "pulido": "Pulido de Pintura",
        "restauracion-de-faros": "Pulido de Faros",
    },
};

/** Name exactly as stored in Supabase, in the given language (falls back to English). */
function storedName(s: ServiceNameFields, locale: Locale): string {
    return toDisplayName(locale === "es" ? (s.name_es ?? s.name) : s.name);
}

/** Customer-facing name for a name that already comes in the customer's language (e.g. the booking catalog). */
export function customerName(name: string, locale: Locale): string {
    const display = toDisplayName(name);
    return CUSTOMER_NAMES[locale][slugify(display)] ?? display;
}

/** Name to show for a service in the given language. */
export function serviceName(s: ServiceNameFields, locale: Locale): string {
    return customerName(storedName(s, locale), locale);
}

/** URL slug of a service in the given language. Always built from the stored name, so a new name on screen never moves a page. */
export function serviceSlug(s: ServiceNameFields, locale: Locale): string {
    return slugify(storedName(s, locale));
}

/** Address of a service's page. */
export function servicePath(s: ServiceNameFields, locale: Locale): string {
    return `/${locale}/services/${serviceSlug(s, locale)}`;
}
