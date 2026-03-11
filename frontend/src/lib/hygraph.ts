/**
 * HyGraph CMS client for landing page + client-facing content.
 * Booking / payment logic lives in Supabase — never in HyGraph.
 *
 * Gracefully returns null if content models don't exist yet in HyGraph.
 * Page components always fall back to dictionary content.
 */

const ENDPOINT = process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT ?? process.env.HYGRAPH_ENDPOINT ?? '';
const TOKEN = process.env.HYGRAPH_TOKEN ?? '';

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T | null> {
    if (!ENDPOINT || !TOKEN) return null;

    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${TOKEN}`,
            },
            body: JSON.stringify({ query, variables }),
            next: { revalidate: 3600 },
        });

        if (!res.ok) return null;

        const json = await res.json();
        if (json.errors?.length) return null;
        return json.data as T;
    } catch {
        return null;
    }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeroContent {
    heading: string;
    subheading: string;
    ctaText: string;
    badgeText?: string | null;
}

export interface Testimonial {
    authorName: string;
    location: string;
    rating: number;
    text: string;
    vehicleType: string;
}

export interface LandingContent {
    hero: HeroContent | null;
    testimonials: Testimonial[];
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches landing page content from HyGraph.
 * Returns null fields when models haven't been created yet.
 *
 * HyGraph models to create (see HYGRAPH_SETUP.md):
 *   - LandingHero  (single, localized): heading, subheading, ctaText, badgeText
 *   - Testimonial  (list):              authorName, location, rating, text, vehicleType
 */
export async function getLandingContent(locale: 'en' | 'es'): Promise<LandingContent> {
    const data = await gql<{
        landingHeroes: HeroContent[];
        testimonials: Testimonial[];
    }>(`
        query LandingContent($locale: Locale!) {
            landingHeroes(first: 1, locales: [$locale, en]) {
                heading
                subheading
                ctaText
                badgeText
            }
            testimonials(first: 6, orderBy: createdAt_DESC) {
                authorName
                location
                rating
                text
                vehicleType
            }
        }
    `, { locale });

    return {
        hero: data?.landingHeroes?.[0] ?? null,
        testimonials: data?.testimonials ?? [],
    };
}
