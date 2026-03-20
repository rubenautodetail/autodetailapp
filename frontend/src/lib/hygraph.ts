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

export interface ContractorBanner {
    message: string;
    isActive: boolean;
}

export interface HeroContent {
    heading: string;
    subheading: string;
    ctaText: string;
    badgeText?: string | null;
    heroImageUrl?: string | null;
}

export interface ContractorHeroContent {
    heading: string;
    subheading: string;
    heroImageUrl?: string | null;
}

export interface Testimonial {
    authorName: string;
    location: string;
    rating: number;
    text: string;
    vehicleType: string;
}

export interface GalleryImage {
    caption: string;
    imageUrl: string;
    section: string;
    sortOrder: number;
}

export interface PromotionalBanner {
    message: string;
    isActive: boolean;
}

export interface LandingContent {
    hero: HeroContent | null;
    testimonials: Testimonial[];
    galleryImages: GalleryImage[];
    promotionalBanner: PromotionalBanner | null;
}

export interface ContractorLandingContent {
    hero: ContractorHeroContent | null;
    galleryImages: GalleryImage[];
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches the main (customer) landing page content from HyGraph.
 * Includes hero section (with optional hero image), testimonials, and gallery images.
 */
export async function getLandingContent(locale: 'en' | 'es'): Promise<LandingContent> {
    const data = await gql<{
        landingHeroes: HeroContent[];
        testimonials: Testimonial[];
        galleryImages: GalleryImage[];
        promotionalBanners: PromotionalBanner[];
    }>(`
        query LandingContent($locale: Locale!) {
            landingHeroes(first: 1, locales: [$locale, en]) {
                heading
                subheading
                ctaText
                badgeText
                heroImageUrl
            }
            testimonials(first: 6, orderBy: createdAt_DESC) {
                authorName
                location
                rating
                text
                vehicleType
            }
            galleryImages(
                where: { section_in: ["home-hero", "home-services", "how-it-works"] }
                orderBy: sortOrder_ASC
                first: 20
            ) {
                caption
                imageUrl
                section
                sortOrder
            }
            promotionalBanners(first: 1, where: { isActive: true }, locales: [$locale, en]) {
                message
                isActive
            }
        }
    `, { locale });

    return {
        hero: data?.landingHeroes?.[0] ?? null,
        testimonials: data?.testimonials ?? [],
        galleryImages: data?.galleryImages ?? [],
        promotionalBanner: data?.promotionalBanners?.[0] ?? null,
    };
}

/**
 * Fetches the contractor recruitment landing page content from HyGraph.
 * Includes contractor hero section and contractor-specific gallery images.
 */
export async function getContractorLandingContent(locale: 'en' | 'es'): Promise<ContractorLandingContent> {
    const data = await gql<{
        contractorLandingHeroes: ContractorHeroContent[];
        galleryImages: GalleryImage[];
    }>(`
        query ContractorLandingContent($locale: Locale!) {
            contractorLandingHeroes(first: 1, locales: [$locale, en]) {
                heading
                subheading
                heroImageUrl
            }
            galleryImages(
                where: { section_in: ["contractor-hero", "contractor-gallery"] }
                orderBy: sortOrder_ASC
                first: 10
            ) {
                caption
                imageUrl
                section
                sortOrder
            }
        }
    `, { locale });

    return {
        hero: data?.contractorLandingHeroes?.[0] ?? null,
        galleryImages: data?.galleryImages ?? [],
    };
}

/**
 * Fetches the contractor notice banner from HyGraph.
 * HyGraph model: ContractorBanner
 *   Fields: message (String, localized), isActive (Boolean)
 *
 * Returns null if inactive or the model doesn't exist yet.
 */
export async function getContractorBanner(locale: 'en' | 'es'): Promise<ContractorBanner | null> {
    const data = await gql<{
        contractorBanners: ContractorBanner[];
    }>(`
        query ContractorBanner($locale: Locale!) {
            contractorBanners(first: 1, where: { isActive: true }, locales: [$locale, en]) {
                message
                isActive
            }
        }
    `, { locale });

    return data?.contractorBanners?.[0] ?? null;
}
