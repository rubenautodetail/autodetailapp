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
    /** Extra local paragraphs shown after the intro (only where we want a stronger page). */
    extraIntro?: LocalizedText[];
    /** Extra local FAQs added after the standard ones. */
    extraFaqs?: { q: LocalizedText; a: LocalizedText }[];
    /** Custom Google title / description per service id (overrides the template). {price} = starting price. */
    seoOverrides?: Record<string, { title?: Partial<LocalizedText>; description?: Partial<LocalizedText> }>;
}

export const NEIGHBORHOODS: Neighborhood[] = [
    {
        slug: 'hialeah',
        name: 'Hialeah',
        zips: ['33010', '33012', '33013', '33014', '33016', '33018'],
        label: { en: 'Hialeah, FL', es: 'Hialeah, FL' },
        blurb: {
            en: 'In Hialeah, skip the drive — we come straight to you, no appointment gymnastics required.',
            es: 'En Hialeah, olvídate de manejar — llegamos directo a ti, sin complicaciones para agendar.',
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
        name: 'Miami Beach, FL',
        zips: ['33139', '33140', '33141', '33154'],
        label: { en: 'Miami Beach, FL', es: 'Miami Beach, FL' },
        blurb: {
            en: 'Salt air, sand and strong sun are hard on paint and interiors. We detail cars across Miami Beach — South Beach, Mid-Beach and North Beach — in condo garages, vacation rentals, office parking lots and home driveways. We bring our own water and equipment, so all you need to do is give us access to your car.',
            es: 'La sal, la arena y el sol fuerte dañan la pintura y el interior. Detallamos autos en todo Miami Beach — South Beach, Mid-Beach y North Beach — en garajes de condominios, rentas vacacionales, parqueos de oficinas y entradas de casas. Llevamos nuestra propia agua y equipo, así que solo necesitas darnos acceso a tu auto.',
        },
        landmarks: ['Ocean Drive', 'Lincoln Road', 'South Pointe Park', 'Mid-Beach', 'North Beach'],
        spanishFirst: false,
        priority: 0.85,
    },
    {
        slug: 'coral-gables',
        name: 'Coral Gables',
        zips: ['33134', '33143', '33146', '33156'],
        label: { en: 'Coral Gables, FL', es: 'Coral Gables, FL' },
        blurb: {
            en: 'The City Beautiful expects a flawless finish. Our team brings show-car results to your Coral Gables home — paint correction and ceramic on request.',
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
            es: 'Los autos familiares se ensucian rápido en Kendall. Nos encargamos de las sillas de bebé, los derrames y el pelo de mascota — en tu entrada, incluso los fines de semana.',
        },
        landmarks: ['Dadeland Mall', 'Baptist Hospital', 'The Falls'],
        spanishFirst: true,
        priority: 0.8,
    },
    {
        slug: 'miami',
        name: 'Miami, FL',
        zips: ['33137', '33132', '33133', '33127', '33136', '33138', '33142', '33150'],
        label: { en: 'Miami, FL', es: 'Miami, FL' },
        blurb: {
            en: 'We detail cars all over the city of Miami — Downtown, Edgewater, Wynwood, Midtown, Coconut Grove, Allapattah and the Upper East Side. Many of our Miami jobs happen in condo garages, office parking lots and home driveways; we bring our own water and equipment, so all you need is access to your car.',
            es: 'Detallamos autos en toda la ciudad de Miami — Downtown, Edgewater, Wynwood, Midtown, Coconut Grove, Allapattah y el Upper East Side. Muchos de nuestros trabajos en Miami son en garajes de condominios, parqueos de oficinas y entradas de casas; llevamos nuestra propia agua y equipo, así que solo necesitas darnos acceso a tu auto.',
        },
        landmarks: ['Wynwood Walls', 'Bayside', 'Museum Park', 'Coconut Grove', 'Design District'],
        spanishFirst: false,
        priority: 0.9,
        extraIntro: [
            {
                en: 'Searching for a mobile car wash or mobile car detailing in Miami? We do both: a careful hand wash when you just need the car clean, or a complete inside-and-out detail when it needs a reset. You see the full price before you confirm, and you pay only after you approve the work.',
                es: '¿Buscas lavado de autos a domicilio o un detallado completo en Miami? Hacemos las dos cosas: un lavado a mano cuidadoso cuando solo necesitas el carro limpio, o un detallado completo por dentro y por fuera cuando necesita quedar como nuevo. Ves el precio completo antes de confirmar y pagas solo cuando apruebas el trabajo.',
            },
            {
                en: 'Booking from a condo or an office building? Add your building, gate or parking instructions in the notes and our team will follow them. Between summer rain, road dust and the salt air near Biscayne Bay, a regular hand wash keeps water spots and grime from setting into the paint.',
                es: '¿Reservas desde un condominio o un edificio de oficinas? Escribe en las notas las instrucciones del edificio, el portón o el parqueo, y nuestro equipo las sigue. Entre la lluvia de verano, el polvo de la calle y el aire salado cerca de la Bahía de Biscayne, un lavado a mano regular evita que las manchas de agua y la suciedad se peguen a la pintura.',
            },
        ],
        extraFaqs: [
            {
                q: { en: 'Is mobile car detailing the same as a mobile car wash?', es: '¿El detallado a domicilio es lo mismo que un lavado de autos a domicilio?' },
                a: {
                    en: 'A mobile car wash is mainly the outside hand wash. Mobile car detailing goes further: wheels, interior vacuum, wipe-down and windows, up to a full interior and exterior detail. In Miami we offer both.',
                    es: 'El lavado a domicilio es sobre todo el lavado a mano por fuera. El detallado va más allá: rines, aspirado, limpieza del interior y vidrios, hasta un detallado completo por dentro y por fuera. En Miami ofrecemos los dos.',
                },
            },
            {
                q: { en: 'Can you detail my car in a condo garage in Miami?', es: '¿Pueden lavar mi carro en el garaje de mi condominio en Miami?' },
                a: {
                    en: 'Yes, as long as your building allows it. We bring our own water and equipment. Add the garage level, spot number or gate instructions when you book.',
                    es: 'Sí, siempre que el edificio lo permita. Llevamos nuestra propia agua y equipo. Al reservar, escribe el piso del garaje, el número de parqueo o las instrucciones del portón.',
                },
            },
        ],
        seoOverrides: {
            'mobile-car-detailing': {
                title: { en: 'Mobile Car Detailing & Car Wash in Miami, FL | Lux — From {price}' },
                description: {
                    en: 'Mobile car detailing and hand car wash in Miami, FL. We come to your home, condo garage or office in Downtown, Edgewater, Wynwood and more. Pay only after you approve. From {price}.',
                    es: 'Lavado de autos a domicilio en Miami, FL. Vamos a tu casa, al garaje de tu condominio o a tu oficina en Downtown, Edgewater, Wynwood y más. Pagas solo cuando apruebas. Desde {price}.',
                },
            },
        },
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
            en: 'Right by FIU and Dolphin Mall, Sweetwater keeps moving — our team works around your schedule, at home or at work.',
            es: 'Junto a FIU y Dolphin Mall, Sweetwater nunca para — nuestro equipo se adapta a tu horario, en casa o en el trabajo.',
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
            en: 'Deep South Dade shouldn’t mean driving 40 minutes for a proper detail. Our team covers Homestead and Leisure City — trucks and work vehicles welcome.',
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
