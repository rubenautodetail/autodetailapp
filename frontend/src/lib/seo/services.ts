import type { Locale } from '@/i18n-config';

/**
 * Programmatic SEO — Service catalog.
 *
 * Each service drives a family of [service]/[city] landing pages. Copy is
 * bilingual and keyword-mapped to the research in `marketing/seo-research/`.
 * Slugs differ per locale so URLs read natively in each language:
 *   EN  /en/mobile-car-detailing/brickell
 *   ES  /es/detallado-de-autos-a-domicilio/brickell
 *
 * Prices are "starting from" anchors — edit to match Supabase `services`.
 */

export interface LocalizedText {
    en: string;
    es: string;
}

export interface DetailService {
    /** stable internal id (never in a URL) */
    id: string;
    /** locale-specific URL slug */
    slug: LocalizedText;
    /** schema.org Service type refinement */
    schemaType: string;
    name: LocalizedText;
    /** one-line value prop, used in hero subhead + meta */
    tagline: LocalizedText;
    /** starting price in USD */
    priceFrom: number;
    /** typical duration in minutes */
    durationMin: number;
    /** what's included — rendered as a checklist */
    includes: LocalizedText[];
    /** primary head keyword this service targets (per research) */
    headKeyword: LocalizedText;
    /** sitemap priority weight */
    priority: number;
    /** icon glyph used in cards (matches home-page style) */
    icon: string;
    /** path to local image asset */
    imageUrl: string;
    imageUrls?: string[];
}

export const SERVICES: DetailService[] = [
    {
        id: 'mobile-car-detailing',
        slug: { en: 'mobile-car-detailing', es: 'detallado-de-autos-a-domicilio' },
        schemaType: 'AutoWash',
        name: { en: 'Mobile Car Detailing', es: 'Detallado de Autos a Domicilio' },
        tagline: {
            en: 'Our team comes straight to your door — home or office — no driving, no waiting rooms. Inspect the work, then approve the charge.',
            es: 'Nuestro equipo llega directo hasta tu puerta — casa u oficina — sin manejar, sin salas de espera. Revisa el trabajo y luego aprueba el cobro.',
        },
        priceFrom: 70,
        durationMin: 120,
        includes: [
            { en: 'Hand wash to prevent paint damage', es: 'Lavado a mano para no arañar la pintura' },
            { en: 'Wheel & tire deep clean', es: 'Limpieza profunda de rines y llantas' },
            { en: 'Interior vacuum & wipe-down', es: 'Aspirado y limpieza interior' },
            { en: 'Windows cleaning in & out', es: 'Limpieza de vidrios por dentro y fuera' },
            { en: 'Spray wax protection', es: 'Protección con cera en spray' },
            { en: 'Tire shine & trim dressing', es: 'Abrillantado de llantas y molduras' },
        ],
        headKeyword: { en: 'mobile car detailing', es: 'detallado de autos a domicilio' },
        priority: 1.0,
        icon: '🚐',
        imageUrl: '/images/services/mobile-car-detailing.png',
    },
    {
        id: 'interior-detailing',
        slug: { en: 'interior-car-detailing', es: 'detallado-interior-de-autos' },
        schemaType: 'AutoWash',
        name: { en: 'Interior Car Detailing', es: 'Detallado Interior de Autos' },
        tagline: {
            en: 'Our team deep-cleans every surface inside your car — seats, carpets, vents, and dash restored. Inspect the work, then approve the charge.',
            es: 'Nuestro equipo limpia a fondo cada superficie interior — asientos, alfombras, rejillas y tablero restaurados. Revisa el trabajo y luego aprueba el cobro.',
        },
        priceFrom: 200,
        durationMin: 180,
        includes: [
            { en: 'Full interior vacuum', es: 'Aspirado interior completo' },
            { en: 'Steam-clean seats & carpets', es: 'Limpieza a vapor de asientos y alfombras' },
            { en: 'Seat cleaning & conditioning', es: 'Limpieza y acondicionado de asientos' },
            { en: 'Dashboard & console detail', es: 'Detallado de tablero y consola' },
            { en: 'Air vent & crevice cleaning', es: 'Limpieza de rejillas y hendiduras' },
            { en: 'Odor & pet-hair removal', es: 'Eliminación de olores y pelo de mascota' },
        ],
        headKeyword: { en: 'interior car detailing', es: 'limpieza de interiores de autos' },
        priority: 0.9,
        icon: '🪑',
        imageUrl: '/images/services/interior-car-detailing.png',
    },
    {
        id: 'exterior-detailing',
        slug: { en: 'exterior-car-detailing', es: 'detallado-exterior-de-autos' },
        schemaType: 'AutoWash',
        name: { en: 'Exterior Car Detailing', es: 'Detallado Exterior de Autos' },
        tagline: {
            en: 'A thorough exterior restoration that goes beyond a standard car wash — foam pre-wash, a safe two-bucket hand wash, clay bar decontamination, and a wax sealant for a deep, glossy shine that lasts. Approve the work before we charge your card.',
            es: 'Una restauración exterior completa que va más allá de un lavado estándar — espuma antes del lavado, lavado a mano con el método de dos cubetas, descontaminación con clay bar, y cera selladora para un brillo profundo y duradero. Aprueba el trabajo antes de que cobremos tu tarjeta.',
        },
        priceFrom: 200,
        durationMin: 180,
        includes: [
            { en: 'Water spot removal', es: 'Eliminación de manchas de agua' },
            { en: 'Clay-bar decontamination', es: 'Descontaminación con clay bar' },
            { en: 'Rust removal if needed', es: 'Eliminación de óxido si es necesario' },
            { en: 'Wax sealant applied', es: 'Aplicación de sellador líquido' },
            { en: 'Trim & plastic restoration', es: 'Restauración de molduras y plásticos' },
            { en: 'Interior & exterior wheel cleaning', es: 'Lavado de rines exterior e interior' },
        ],
        headKeyword: { en: 'exterior car detailing', es: 'detallado exterior de autos' },
        priority: 0.9,
        icon: '✨',
        imageUrl: '/images/services/exterior-detailing-01.jpg',
        imageUrls: [
            '/images/services/exterior-detailing-01.jpg',
            '/images/services/exterior-detailing-02.jpg',
            '/images/services/exterior-detailing-03.jpg',
            '/images/services/exterior-detailing-04.jpg',
            '/images/services/exterior-detailing-05.jpg',
        ],
    },
    {
        id: 'ceramic-coating',
        slug: { en: 'ceramic-coating', es: 'recubrimiento-ceramico' },
        schemaType: 'AutoWash',
        name: { en: 'Ceramic Coating', es: 'Recubrimiento Cerámico' },
        tagline: {
            en: 'Years of protection and a mirror finish — hydrophobic, UV-resistant, gloss-locked.',
            es: 'Años de protección y acabado espejo — hidrofóbico, resistente a UV, brillo sellado.',
        },
        priceFrom: 999,
        durationMin: 1440,
        includes: [
            { en: 'Full wash & paint decontamination', es: 'Lavado y descontaminación de pintura completos' },
            { en: 'Full paint correction', es: 'Corrección de pintura completa' },
            { en: 'Professional ceramic application', es: 'Aplicación cerámica profesional' },
            { en: 'Hydrophobic, self-cleaning finish', es: 'Acabado hidrofóbico autolimpiante' },
            { en: 'Final quality inspection', es: 'Revisión final de calidad' },
            { en: 'Aftercare & maintenance guidance', es: 'Guía de cuidado y mantenimiento posterior' },
        ],
        headKeyword: { en: 'ceramic coating', es: 'recubrimiento cerámico' },
        priority: 0.8,
        icon: '🛡️',
        imageUrl: '/images/services/ceramic-coating.png',
    },
];

export function getServiceBySlug(slug: string, locale: Locale): DetailService | undefined {
    return SERVICES.find((s) => s.slug[locale] === slug);
}

export function t(text: LocalizedText, locale: Locale): string {
    return text[locale];
}
