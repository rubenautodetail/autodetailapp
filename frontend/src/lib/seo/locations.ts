import type { LocalizedText } from './services';

/**
 * Programmatic SEO — Neighborhood catalog (Miami-Dade).
 *
 * City slug is shared across locales (proper place names), so hreflang
 * mapping only swaps the service slug + lang prefix. Copy is bilingual and
 * carries genuinely local detail (landmarks, character, Spanish-market notes)
 * so each page is substantively unique — not a thin duplicate.
 *
 * Priority order reflects the research in `04-local-competitive-spanish.md`:
 * Hispanic-dense + low-competition neighborhoods first.
 */

export interface Neighborhood {
    /** shared URL slug (both locales) */
    slug: string;
    name: string;
    /** representative ZIPs from SERVICE_ZIP_CODES */
    zips: string[];
    /** short, human place descriptor for hero eyebrow */
    label: LocalizedText;
    /** 1–2 sentence local-context blurb (unique SEO body copy) */
    blurb: LocalizedText;
    /** recognizable local landmarks / areas for local relevance */
    landmarks: string[];
    /** true where the Spanish-first angle is strongest (per research) */
    spanishFirst: boolean;
    /** sitemap priority weight */
    priority: number;
}

export const NEIGHBORHOODS: Neighborhood[] = [
    {
        slug: 'hialeah',
        name: 'Hialeah',
        zips: ['33010', '33012', '33013', '33014', '33016', '33018'],
        label: { en: 'Hialeah, FL', es: 'Hialeah, FL' },
        blurb: {
            en: 'Hialeah is one of the most Spanish-speaking cities in America — and our detailers meet you right at your driveway, no appointment gymnastics required.',
            es: 'Hialeah es una de las ciudades más hispanohablantes del país — y nuestros detalladores llegan hasta tu entrada, sin complicaciones para agendar.',
        },
        landmarks: ['Amelia Earhart Park', 'Westland Mall', 'Hialeah Park'],
        spanishFirst: true,
        priority: 1.0,
    },
    {
        slug: 'little-havana',
        name: 'Little Havana',
        zips: ['33125', '33135', '33130'],
        label: { en: 'Little Havana, Miami', es: 'La Pequeña Habana, Miami' },
        blurb: {
            en: 'From Calle Ocho to your building on SW 8th, we bring full mobile detailing to the heart of Little Havana — parking-tight blocks are no problem.',
            es: 'Desde la Calle Ocho hasta tu edificio, llevamos el detallado móvil al corazón de La Pequeña Habana — las calles estrechas no son problema.',
        },
        landmarks: ['Calle Ocho', 'Domino Park', 'Tower Theater'],
        spanishFirst: true,
        priority: 0.95,
    },
    {
        slug: 'doral',
        name: 'Doral',
        zips: ['33122', '33172', '33178', '33166'],
        label: { en: 'Doral, FL', es: 'Doral, FL' },
        blurb: {
            en: 'Doral’s pace is fast and its cars are nice — we detail at your home, office, or dealership on your schedule, in English or Spanish.',
            es: 'Doral se mueve rápido y sus autos lo merecen — detallamos en tu casa, oficina o concesionaria, en inglés o español.',
        },
        landmarks: ['CityPlace Doral', 'Trump National Doral', 'Downtown Doral'],
        spanishFirst: true,
        priority: 0.9,
    },
    {
        slug: 'brickell',
        name: 'Brickell',
        zips: ['33129', '33131', '33130'],
        label: { en: 'Brickell, Miami', es: 'Brickell, Miami' },
        blurb: {
            en: 'No driveway? No problem. In Brickell’s high-rises we detail in the garage or valet level while you keep your day moving.',
            es: '¿Sin entrada de auto? No hay problema. En las torres de Brickell detallamos en el garaje o el nivel de valet mientras sigues con tu día.',
        },
        landmarks: ['Brickell City Centre', 'Mary Brickell Village', 'Simpson Park'],
        spanishFirst: false,
        priority: 0.85,
    },
    {
        slug: 'miami-beach',
        name: 'Miami Beach',
        zips: ['33139', '33140', '33141', '33154'],
        label: { en: 'Miami Beach, FL', es: 'Miami Beach, FL' },
        blurb: {
            en: 'Salt air and sand are hard on paint. We come to your condo or rental in Miami Beach to wash, decontaminate, and protect before the damage sets in.',
            es: 'La sal y la arena dañan la pintura. Vamos a tu condominio o renta en Miami Beach para lavar, descontaminar y proteger antes de que aparezca el daño.',
        },
        landmarks: ['Ocean Drive', 'Lincoln Road', 'South Pointe Park'],
        spanishFirst: false,
        priority: 0.85,
    },
    {
        slug: 'coral-gables',
        name: 'Coral Gables',
        zips: ['33134', '33143', '33146', '33156'],
        label: { en: 'Coral Gables, FL', es: 'Coral Gables, FL' },
        blurb: {
            en: 'The City Beautiful expects a flawless finish. Our detailers bring show-car results to your Coral Gables home — paint correction and ceramic on request.',
            es: 'La Ciudad Bella espera un acabado impecable. Llevamos resultados de auto de exhibición a tu hogar en Coral Gables — corrección de pintura y cerámico a pedido.',
        },
        landmarks: ['Miracle Mile', 'Venetian Pool', 'The Biltmore'],
        spanishFirst: false,
        priority: 0.8,
    },
    {
        slug: 'kendall',
        name: 'Kendall',
        zips: ['33156', '33176', '33183', '33186', '33193'],
        label: { en: 'Kendall, FL', es: 'Kendall, FL' },
        blurb: {
            en: 'Family cars take a beating in Kendall. We handle the car seats, the spills, and the pet hair — right in your driveway, weekends included.',
            es: 'Los autos familiares sufren en Kendall. Nos encargamos de las sillas de bebé, los derrames y el pelo de mascota — en tu entrada, incluso fines de semana.',
        },
        landmarks: ['Dadeland Mall', 'Baptist Hospital', 'The Falls'],
        spanishFirst: true,
        priority: 0.8,
    },
    {
        slug: 'miami',
        name: 'Miami',
        zips: ['33127', '33137', '33132', '33136'],
        label: { en: 'Miami, FL', es: 'Miami, FL' },
        blurb: {
            en: 'From Downtown to Wynwood to Edgewater, DTailWash brings vetted mobile detailers across the city of Miami — booked online, paid securely, done at your door.',
            es: 'Desde Downtown hasta Wynwood y Edgewater, DTailWash lleva detalladores verificados por toda la ciudad de Miami — reservado en línea, pago seguro, en tu puerta.',
        },
        landmarks: ['Wynwood Walls', 'Bayside', 'Museum Park'],
        spanishFirst: false,
        priority: 0.9,
    },
    // ── Phase 2 additions (2026-07) — remaining priority areas from research ──
    {
        slug: 'westchester',
        name: 'Westchester',
        zips: ['33144', '33155', '33165', '33174'],
        label: { en: 'Westchester, FL', es: 'Westchester, FL' },
        blurb: {
            en: 'Westchester is classic Miami suburbia — driveways, family cars, and no time to sit at a car wash. We come to you, evenings and weekends included.',
            es: 'Westchester es el suburbio clásico de Miami — entradas amplias, autos familiares y poco tiempo para el car wash. Vamos a ti, incluso tardes y fines de semana.',
        },
        landmarks: ['Tropical Park', 'FIU', 'Coral Way'],
        spanishFirst: true,
        priority: 0.85,
    },
    {
        slug: 'sweetwater',
        name: 'Sweetwater',
        zips: ['33172', '33174', '33182', '33194'],
        label: { en: 'Sweetwater, FL', es: 'Sweetwater, FL' },
        blurb: {
            en: 'Right by FIU and Dolphin Mall, Sweetwater keeps moving — our detailers work around your schedule, at home or at work.',
            es: 'Junto a FIU y Dolphin Mall, Sweetwater nunca para — nuestros detalladores se adaptan a tu horario, en casa o en el trabajo.',
        },
        landmarks: ['Dolphin Mall', 'FIU', 'Fountainebleau'],
        spanishFirst: true,
        priority: 0.85,
    },
    {
        slug: 'aventura',
        name: 'Aventura',
        zips: ['33160', '33180'],
        label: { en: 'Aventura, FL', es: 'Aventura, FL' },
        blurb: {
            en: 'Condo towers, HOA rules, valet garages — we know the drill in Aventura and detail right in your building, with management-friendly, self-contained setups.',
            es: 'Torres de condominios, reglas de HOA, garajes con valet — conocemos Aventura y detallamos en tu edificio con equipos autónomos que no molestan a la administración.',
        },
        landmarks: ['Aventura Mall', 'Turnberry', 'Founders Park'],
        spanishFirst: false,
        priority: 0.75,
    },
    {
        slug: 'north-miami',
        name: 'North Miami',
        zips: ['33161', '33162', '33167', '33168', '33181'],
        label: { en: 'North Miami, FL', es: 'North Miami, FL' },
        blurb: {
            en: 'From NE 125th to Biscayne Boulevard, North Miami gets the same premium mobile detail as the beach — without beach pricing.',
            es: 'Desde la 125 hasta Biscayne Boulevard, North Miami recibe el mismo detallado premium que la playa — sin precios de playa.',
        },
        landmarks: ['Biscayne Boulevard', 'FIU North', 'Oleta River State Park'],
        spanishFirst: false,
        priority: 0.7,
    },
    {
        slug: 'miami-gardens',
        name: 'Miami Gardens',
        zips: ['33054', '33055', '33056', '33169'],
        label: { en: 'Miami Gardens, FL', es: 'Miami Gardens, FL' },
        blurb: {
            en: 'Home of Hard Rock Stadium and proud car culture — Miami Gardens drivers keep their rides clean, and we make that effortless with detailing at your door.',
            es: 'Hogar del Hard Rock Stadium y de una cultura automotriz orgullosa — en Miami Gardens los autos se cuidan, y lo hacemos fácil con detallado en tu puerta.',
        },
        landmarks: ['Hard Rock Stadium', 'Calder', 'St. Thomas University'],
        spanishFirst: false,
        priority: 0.7,
    },
    {
        slug: 'homestead',
        name: 'Homestead',
        zips: ['33030', '33031', '33032', '33033', '33034', '33035'],
        label: { en: 'Homestead, FL', es: 'Homestead, FL' },
        blurb: {
            en: 'Deep South Dade shouldn’t mean driving 40 minutes for a proper detail. Our detailers cover Homestead and Leisure City — trucks and work vehicles welcome.',
            es: 'Vivir en el sur de Dade no debería significar manejar 40 minutos para un buen detallado. Cubrimos Homestead y Leisure City — camionetas y vehículos de trabajo bienvenidos.',
        },
        landmarks: ['Homestead-Miami Speedway', 'Krome Avenue', 'Losner Park'],
        spanishFirst: true,
        priority: 0.7,
    },
    {
        slug: 'cutler-bay',
        name: 'Cutler Bay',
        zips: ['33157', '33189', '33190'],
        label: { en: 'Cutler Bay, FL', es: 'Cutler Bay, FL' },
        blurb: {
            en: 'Quiet streets, salty bay air, and commuter miles — Cutler Bay cars earn their keep. We restore the shine in your own driveway.',
            es: 'Calles tranquilas, aire salado de la bahía y millas de viaje diario — los autos de Cutler Bay trabajan duro. Devolvemos el brillo en tu propia entrada.',
        },
        landmarks: ['Black Point Marina', 'Southland Mall', 'Old Cutler Road'],
        spanishFirst: false,
        priority: 0.65,
    },
    {
        slug: 'pinecrest',
        name: 'Pinecrest',
        zips: ['33156', '33176'],
        label: { en: 'Pinecrest, FL', es: 'Pinecrest, FL' },
        blurb: {
            en: 'Pinecrest garages hold cars worth protecting. Paint correction, ceramic coating, and meticulous interiors — brought to your estate on your schedule.',
            es: 'Los garajes de Pinecrest guardan autos que vale la pena proteger. Corrección de pintura, cerámico e interiores meticulosos — en tu residencia y a tu horario.',
        },
        landmarks: ['Pinecrest Gardens', 'US-1', 'Suniland'],
        spanishFirst: false,
        priority: 0.65,
    },
];

export function getNeighborhoodBySlug(slug: string): Neighborhood | undefined {
    return NEIGHBORHOODS.find((n) => n.slug === slug);
}

/** Nearby-neighborhood suggestions for internal linking (topic cluster). */
export function getNearbyNeighborhoods(slug: string, count = 4): Neighborhood[] {
    return NEIGHBORHOODS.filter((n) => n.slug !== slug).slice(0, count);
}
