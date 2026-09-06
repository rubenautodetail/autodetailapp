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
            en: 'A professional detailer comes to your home or office — no driving, no waiting rooms.',
            es: 'Un detallador profesional llega a tu casa u oficina — sin manejar, sin salas de espera.',
        },
        priceFrom: 79,
        durationMin: 120,
        includes: [
            { en: 'Hand wash & foam bath', es: 'Lavado a mano y baño de espuma' },
            { en: 'Wheel & tire deep clean', es: 'Limpieza profunda de rines y llantas' },
            { en: 'Interior vacuum & wipe-down', es: 'Aspirado y limpieza interior' },
            { en: 'Streak-free glass, in & out', es: 'Vidrios sin marcas, dentro y fuera' },
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
            en: 'Deep-clean every surface inside your car — seats, carpets, vents, and dash restored.',
            es: 'Limpieza profunda de cada superficie interior — asientos, alfombras, rejillas y tablero.',
        },
        priceFrom: 149,
        durationMin: 150,
        includes: [
            { en: 'Full interior vacuum', es: 'Aspirado interior completo' },
            { en: 'Steam-clean seats & carpets', es: 'Limpieza a vapor de asientos y alfombras' },
            { en: 'Leather clean & condition', es: 'Limpieza y acondicionado de cuero' },
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
            en: 'Restore a deep, glossy shine with a paint-safe wash, decontamination, and wax.',
            es: 'Recupera un brillo profundo con lavado seguro, descontaminación y cera.',
        },
        priceFrom: 129,
        durationMin: 120,
        includes: [
            { en: 'pH-neutral hand wash', es: 'Lavado a mano con pH neutro' },
            { en: 'Clay-bar decontamination', es: 'Descontaminación con clay bar' },
            { en: 'Iron & tar removal', es: 'Eliminación de hierro y alquitrán' },
            { en: 'Machine-applied sealant', es: 'Sellador aplicado a máquina' },
            { en: 'Trim & plastic restoration', es: 'Restauración de molduras y plásticos' },
            { en: 'Wheel face & barrel clean', es: 'Limpieza de cara y barril de rines' },
        ],
        headKeyword: { en: 'exterior car detailing', es: 'lavado de autos a domicilio' },
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
        priceFrom: 599,
        durationMin: 360,
        includes: [
            { en: 'Full exterior decontamination', es: 'Descontaminación exterior completa' },
            { en: 'Single-stage paint correction', es: 'Corrección de pintura de una etapa' },
            { en: 'Professional ceramic application', es: 'Aplicación cerámica profesional' },
            { en: 'Hydrophobic, self-cleaning finish', es: 'Acabado hidrofóbico autolimpiante' },
            { en: 'UV & oxidation protection', es: 'Protección contra UV y oxidación' },
            { en: 'Multi-year durability warranty', es: 'Garantía de durabilidad de varios años' },
        ],
        headKeyword: { en: 'ceramic coating miami', es: 'recubrimiento cerámico miami' },
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
