import type { Locale } from '@/i18n-config';

type SchemaObject = Record<string, unknown>;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dtailwash.com';

// Miami-Dade neighborhoods matching SERVICE_ZIP_CODES coverage.
const AREAS_SERVED = [
    'Miami',
    'Miami Beach',
    'Hialeah',
    'Coral Gables',
    'Doral',
    'Kendall',
    'Homestead',
] as const;

export function getOrganizationSchema(siteName: string): SchemaObject {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${APP_URL}/#organization`,
        name: siteName,
        url: APP_URL,
        logo: {
            '@type': 'ImageObject',
            url: `${APP_URL}/icon.png`,
        },
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            areaServed: 'US',
            availableLanguage: ['English', 'Spanish'],
        },
    };
}

export function getWebsiteSchema(siteName: string): SchemaObject {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${APP_URL}/#website`,
        name: siteName,
        url: APP_URL,
        publisher: { '@id': `${APP_URL}/#organization` },
        inLanguage: ['en', 'es'],
    };
}

// Service-area business — no public storefront, so no street address is
// published. Google's structured data guidance for mobile/service-area
// businesses is to omit `address` and rely on `areaServed` instead.
export function getLocalBusinessSchema(
    siteName: string,
    description: string,
    locale: Locale
): SchemaObject {
    return {
        '@context': 'https://schema.org',
        '@type': 'AutoWash',
        '@id': `${APP_URL}/#localbusiness`,
        name: siteName,
        description,
        url: `${APP_URL}/${locale}`,
        priceRange: '$$',
        currenciesAccepted: 'USD',
        paymentAccepted: 'Credit Card',
        image: `${APP_URL}/opengraph-image`,
        areaServed: AREAS_SERVED.map((name) => ({ '@type': 'City', name })),
        knowsLanguage: ['en', 'es'],
    };
}

export interface ServiceInput {
    name: string;
    description: string;
}

export function getServiceCatalogSchema(services: ServiceInput[], locale: Locale): SchemaObject {
    return {
        '@context': 'https://schema.org',
        '@type': 'OfferCatalog',
        name: 'Mobile Detailing Services',
        url: `${APP_URL}/${locale}`,
        itemListElement: services.map((service) => ({
            '@type': 'Offer',
            itemOffered: {
                '@type': 'Service',
                name: service.name,
                description: service.description,
                provider: { '@id': `${APP_URL}/#localbusiness` },
                areaServed: AREAS_SERVED.map((name) => ({ '@type': 'City', name })),
            },
        })),
    };
}

// ─── Programmatic landing-page structured data ───────────────────────────────

/** LocalBusiness scoped to a specific served city — for [service]/[city] pages. */
export function getCityServiceBusinessSchema(
    siteName: string,
    serviceName: string,
    description: string,
    cityName: string,
    url: string,
    priceFrom: number
): SchemaObject {
    return {
        '@context': 'https://schema.org',
        '@type': 'AutoDetailing',
        name: `${siteName} — ${serviceName} ${cityName}`,
        description,
        url,
        image: `${APP_URL}/opengraph-image`,
        priceRange: '$$',
        currenciesAccepted: 'USD',
        paymentAccepted: 'Credit Card',
        telephone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || undefined,
        areaServed: { '@type': 'City', name: `${cityName}, FL` },
        knowsLanguage: ['en', 'es'],
        provider: { '@id': `${APP_URL}/#organization` },
        offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            price: priceFrom,
            priceSpecification: {
                '@type': 'PriceSpecification',
                minPrice: priceFrom,
                priceCurrency: 'USD',
            },
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.97',
            reviewCount: '2400',
        },
    };
}

/** FAQPage — powers Google FAQ rich results and answer-engine citations. */
export function getFaqSchema(faqs: { q: string; a: string }[]): SchemaObject {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
    };
}

export interface BreadcrumbItem {
    name: string;
    path: string;
}

export function getBreadcrumbSchema(items: BreadcrumbItem[], locale: Locale): SchemaObject {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${APP_URL}/${locale}${item.path}`,
        })),
    };
}
