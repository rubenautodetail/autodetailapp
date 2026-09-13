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
        headKeyword: { en: 'Mobile Car Detailing', es: 'Detallado De Autos A Domicilio' },
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
        headKeyword: { en: 'Interior Car Detailing', es: 'Limpieza De Interiores De Autos' },
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
        headKeyword: { en: 'Exterior Car Detailing', es: 'Detallado Exterior De Autos' },
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
        headKeyword: { en: 'Ceramic Coating', es: 'Recubrimiento Cerámico' },
        priority: 0.8,
        icon: '🛡️',
        imageUrl: '/images/services/ceramic-coating.png',
    },
    {
        id: 'express-detail',
        slug: { en: 'express-detailing', es: 'detallado-express' },
        schemaType: 'AutoWash',
        name: { en: 'Express Detail', es: 'Detallado Express' },
        tagline: {
            en: 'A quick refresh for your daily driver — vacuum, wipe-down, and a hand wash in under 90 minutes. Inspect the work, then approve the charge.',
            es: 'Un refresco rápido para tu auto del día a día — aspirado, limpieza y lavado a mano en menos de 90 minutos. Revisa el trabajo y luego aprueba el cobro.',
        },
        priceFrom: 70,
        durationMin: 80,
        includes: [
            { en: 'Interior vacuum & wipe-down', es: 'Aspirado y limpieza interior' },
            { en: 'Dashboard, console, doors & panels cleaned', es: 'Limpieza de tablero, consola, puertas y paneles' },
            { en: 'Cup holders, glass & interior surfaces cleaned', es: 'Limpieza de portavasos, vidrios y superficies interiores' },
            { en: 'Hand wash & door jambs cleaned', es: 'Lavado a mano y limpieza de marcos de puertas' },
            { en: 'Wheels, tires, gas cap & bug removal', es: 'Limpieza de rines, llantas, tapa de gasolina y eliminación de insectos' },
        ],
        headKeyword: { en: 'Express Detail', es: 'Detallado Express' },
        priority: 0.9,
        icon: '⚡',
        imageUrl: '/images/services/express-detail-01.jpg',
        imageUrls: [
            '/images/services/express-detail-01.jpg',
            '/images/services/express-detail-02.jpg',
            '/images/services/express-detail-03.jpg',
            '/images/services/express-detail-04.jpg',
            '/images/services/express-detail-05.jpg',
            '/images/services/express-detail-06.jpg',
        ],
    },
    {
        id: 'headlight-restoration',
        slug: { en: 'headlight-restoration', es: 'restauracion-de-luces' },
        schemaType: 'AutoWash',
        name: { en: 'Headlight Restoration', es: 'Restauración de Luces' },
        tagline: {
            en: 'Restore cloudy, yellowed headlights to like-new clarity — better visibility, better looks, in under 2 hours. Inspect the work, then approve the charge.',
            es: 'Restaura tus faros opacos y amarillentos a una claridad como nueva — mejor visibilidad, mejor apariencia, en menos de 2 horas. Revisa el trabajo y luego aprueba el cobro.',
        },
        priceFrom: 120,
        durationMin: 120,
        includes: [
            { en: 'Deep cleaning to remove dirt, debris & contaminants', es: 'Limpieza profunda para eliminar suciedad, residuos y contaminantes' },
            { en: 'Multi-stage sanding to remove oxidation & yellowing', es: 'Lijado en múltiples etapas para eliminar oxidación y amarillamiento' },
            { en: 'Protective polymer coating for lasting clarity', es: 'Recubrimiento de polímero protector para claridad duradera' },
            { en: 'UV protection against future oxidation & sun damage', es: 'Protección UV contra oxidación futura y daño solar' },
        ],
        headKeyword: { en: 'Headlight Restoration', es: 'Restauración De Luces' },
        priority: 0.8,
        icon: '💡',
        imageUrl: '/images/services/headlight-restoration-01.jpg',
        imageUrls: [
            '/images/services/headlight-restoration-01.jpg',
            '/images/services/headlight-restoration-02.jpg',
            '/images/services/headlight-restoration-03.jpg',
            '/images/services/headlight-restoration-04.jpg',
            '/images/services/headlight-restoration-05.jpg',
            '/images/services/headlight-restoration-06.jpg',
        ],
    },
];
export function getServiceBySlug(slug: string, locale: Locale): DetailService | undefined {
    return SERVICES.find((s) => s.slug[locale] === slug);
}

export function t(text: LocalizedText, locale: Locale): string {
    return text[locale];
}
