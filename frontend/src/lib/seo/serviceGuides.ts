/**
 * Educational content for the general service pages (/{lang}/services/{slug}).
 *
 * Price, duration, the "what's included" list and photos come from Supabase / services.ts.
 * Everything else that explains the service lives here, keyed by the ENGLISH slug of the
 * service name (e.g. "Headlight Restoration" -> "headlight-restoration").
 *
 * Placeholders filled in by the page:
 *   {price}     -> "$120"
 *   {duration}  -> "about 2 hr" / "aproximadamente 2 h"
 *
 * A service without an entry here still gets a simpler page.
 */

export type L = { en: string; es: string };

export type IconKey =
    | "light"
    | "night"
    | "eye"
    | "sparkle"
    | "wallet"
    | "shield"
    | "car"
    | "clock"
    | "home"
    | "sun"
    | "droplets"
    | "wind"
    | "armchair";

export interface BeforeAfterPair {
    /** Path under /public of the photo before the work. */
    before: string;
    /** Path under /public of the photo after the work. */
    after: string;
    /** Shape of both photos, so they are shown without being cut. */
    orientation: "portrait" | "landscape";
    caption: L;
}

export interface ServicePhotos {
    /** Cover photo of the page (defaults to the first photo of the service). */
    cover?: string;
    /** CSS object-position for the cover, e.g. "60% 60%". */
    coverPosition?: string;
    beforeAfterTitle?: L;
    beforeAfterIntro?: L;
    beforeAfter?: BeforeAfterPair[];
}

export interface ServiceGuide {
    /** <title> (used as-is, without the site-name suffix). Keep it near 60 characters. */
    seoTitle: L;
    /** Meta description. Keep it near 155 characters after placeholders are filled. */
    metaDescription: L;
    heroSub: L;
    quickAnswer: L;
    scienceTitle: L;
    science: L[];
    /** Search phrases customers use, shown as tags. */
    keywords: L[];
    limits: { canTitle: L; can: L[]; cannotTitle: L; cannot: L[] };
    benefitsTitle: L;
    benefitsIntro: L;
    benefits: { icon: IconKey; t: L; d: L }[];
    careTitle: L;
    careIntro: L;
    care: L[];
    faqs: { q: L; a: L }[];
    /** One line for the comparison table. */
    bestFor: L;
    /** Optional photos that go with the text. When present, the plain gallery is not shown. */
    photos?: ServicePhotos;
}

type Pair = { q: L; a: L };
type Benefit = ServiceGuide["benefits"][number];

const faqCost = (what: L): Pair => ({
    q: {
        en: `How much does ${what.en} cost in Miami?`,
        es: `¿Cuánto cuesta ${what.es} en Miami?`,
    },
    a: {
        en: "It starts at {price}. The final quote depends on your vehicle and its condition, and you see transparent pricing before you confirm, with no hidden fees.",
        es: "Empieza en {price}. El precio final depende de tu vehículo y de su estado, y ves el precio claro antes de confirmar, sin cargos ocultos.",
    },
});

const faqTime: Pair = {
    q: { en: "How long does it take?", es: "¿Cuánto tarda?" },
    a: {
        en: "A typical visit takes {duration}. You can keep working or relax while it's done. No waiting room required.",
        es: "Una visita típica toma {duration}. Puedes seguir trabajando o descansar mientras se hace. No necesitas sala de espera.",
    },
};

const faqHome: Pair = {
    q: { en: "Do you come to my home or office?", es: "¿Vienen a mi casa u oficina?" },
    a: {
        en: "Yes. Dtailwash is fully mobile: our team arrives at your home, office or building anywhere in Miami-Dade with everything needed to complete the job on-site. We arrive self-contained with our own water and equipment, so all we need is access to your vehicle.",
        es: "Sí. Dtailwash es totalmente móvil: nuestro equipo llega a tu casa, oficina o edificio en cualquier lugar de Miami-Dade con todo lo necesario para hacer el trabajo en el sitio. Llegamos con nuestra propia agua y equipo, así que solo necesitamos acceso a tu vehículo.",
    },
};

const faqCharge: Pair = {
    q: { en: "When do you charge my card?", es: "¿Cuándo cobran mi tarjeta?" },
    a: {
        en: "You approve the work first. We only charge your card after you confirm everything looks good.",
        es: "Tú apruebas el trabajo primero. Solo cobramos tu tarjeta después de que confirmes que todo se ve bien.",
    },
};

const benefitHome: Benefit = {
    icon: "home",
    t: { en: "Done where you are", es: "Donde estés" },
    d: {
        en: "No trip to a shop. Our team comes to your home or office in Miami-Dade.",
        es: "Sin ir a un taller. Nuestro equipo llega a tu casa u oficina en Miami-Dade.",
    },
};


export const SERVICE_GUIDES: Record<string, ServiceGuide> = {
    "headlight-restoration": {
        seoTitle: {
            en: "Headlight Restoration Miami: Fix Cloudy & Yellow Headlights",
            es: "Restauración de Faros en Miami: Faros Opacos y Amarillos",
        },
        metaDescription: {
            en: "Mobile headlight restoration in Miami-Dade. Why headlights turn yellow and cloudy, what restoration fixes, and how we clear them at your door. From {price}.",
            es: "Restauración de faros a domicilio en Miami-Dade. Por qué se ponen amarillos y opacos, qué corrige el servicio y cómo los dejamos claros. Desde {price}.",
        },
        heroSub: {
            en: "Yellow, foggy or hazy headlights are common on cars that spend years in strong sun. Headlight restoration clears the damaged outer layer of the lens and protects it again, so you see farther at night and your car looks sharper.",
            es: "Los faros amarillentos, opacos o con un velo blanco son comunes en autos que pasan años bajo el sol fuerte. La restauración de faros elimina la capa dañada del lente y lo protege de nuevo, para que veas más lejos de noche y tu auto se vea mejor.",
        },
        quickAnswer: {
            en: "Headlight restoration removes the yellow, cloudy layer that forms on the outside of a headlight lens over time and protects the surface again. It improves how much light reaches the road and how your car looks. It works on the outside of the lens and does not replace the headlight.",
            es: "La restauración de faros elimina la capa amarilla y opaca que se forma con el tiempo en la parte exterior del lente y vuelve a proteger la superficie. Mejora la luz que llega a la carretera y la apariencia del auto. Trabaja sobre el exterior del lente y no reemplaza el faro.",
        },
        scienceTitle: {
            en: "What is headlight restoration?",
            es: "¿Qué es la restauración de faros?",
        },
        science: [
            {
                en: "Most modern headlights use polycarbonate lenses, a tough plastic that comes from the factory with a clear protective coating against the sun. Over the years, UV rays, heat and road grime wear that coating down. Once it fails, the plastic itself starts to oxidize and turns yellow, cloudy or covered in a white haze.",
                es: "La mayoría de los autos modernos tienen lentes de policarbonato, un plástico resistente que sale de fábrica con una capa transparente que lo protege del sol. Con los años, los rayos UV, el calor y la suciedad de la carretera desgastan esa capa. Cuando falla, el plástico se oxida y se pone amarillo, opaco o con un velo blanco.",
            },
            {
                en: "Restoration sands away the damaged outer layer in stages, polishes the lens back to clear, applies a protective coating and finishes with UV protection. Without that protection the lens can yellow again quickly, which is why the protective layer matters as much as the sanding and polishing. In Miami, where the sun is strong most of the year, lenses tend to age faster than in cloudier places.",
                es: "La restauración lija la capa exterior dañada por etapas, pule el lente hasta dejarlo claro, aplica un recubrimiento protector y termina con protección UV. Sin esa protección el lente puede volver a amarillear rápido, por eso la capa protectora importa tanto como el lijado y el pulido. En Miami, donde el sol es fuerte casi todo el año, los lentes suelen envejecer más rápido que en lugares más nublados.",
            },
        ],
        keywords: [
            { en: "Headlight restoration", es: "Restauración de faros" },
            { en: "Cloudy headlights", es: "Faros opacos" },
            { en: "Yellow headlights", es: "Faros amarillos" },
            { en: "Foggy headlights", es: "Faros nublados" },
            { en: "Headlight polishing", es: "Pulido de faros" },
            { en: "UV protection", es: "Protección UV" },
            { en: "Mobile service in Miami", es: "Servicio a domicilio en Miami" },
        ],
        limits: {
            canTitle: { en: "What restoration can fix", es: "Lo que sí corrige la restauración" },
            can: [
                {
                    en: "Yellowing and oxidation on the outside of the lens",
                    es: "Amarillo y oxidación en el exterior del lente",
                },
                { en: "Cloudy or hazy lenses", es: "Lentes opacos o con velo" },
                { en: "Light surface scratches", es: "Rayones ligeros en la superficie" },
            ],
            cannotTitle: { en: "What it can't fix", es: "Lo que no corrige" },
            cannot: [
                {
                    en: "Moisture or fogging inside the headlight",
                    es: "Humedad o empañado dentro del faro",
                },
                {
                    en: "Cracks, chips or deep damage in the lens",
                    es: "Grietas, astillas o daño profundo en el lente",
                },
                {
                    en: "Burned-out bulbs or electrical problems",
                    es: "Focos quemados o problemas eléctricos",
                },
            ],
        },
        benefitsTitle: {
            en: "What you get from clear headlights",
            es: "Lo que ganas con faros claros",
        },
        benefitsIntro: {
            en: "Restoring headlights is about seeing better and keeping your car looking cared for.",
            es: "Restaurar los faros mejora lo que ves de noche y cómo se ve tu auto.",
        },
        benefits: [
            {
                icon: "light",
                t: { en: "More light on the road", es: "Más luz en la carretera" },
                d: {
                    en: "Clear lenses let more of the beam through, so the road is better lit at night and in the rain.",
                    es: "Un lente claro deja pasar más luz, así que la vía se ilumina mejor de noche y bajo la lluvia.",
                },
            },
            {
                icon: "night",
                t: { en: "Easier night driving", es: "Manejar de noche con más confianza" },
                d: {
                    en: "Better visibility gives you more time to spot hazards and react.",
                    es: "Mejor visibilidad te da más tiempo para detectar obstáculos y reaccionar.",
                },
            },
            {
                icon: "eye",
                t: { en: "Less scattered light", es: "Menos luz dispersa" },
                d: {
                    en: "Hazy lenses scatter the beam. Clear lenses can direct it where it should go.",
                    es: "Un lente opaco dispersa el haz de luz. Uno claro puede dirigirlo mejor.",
                },
            },
            {
                icon: "sparkle",
                t: { en: "A sharper look", es: "Un aspecto más limpio" },
                d: {
                    en: "Yellow lenses make a car look older than it is. Clear ones bring back the clean front end.",
                    es: "Los lentes amarillos hacen que el auto se vea más viejo de lo que es. Claros, recuperan el frente limpio.",
                },
            },
            {
                icon: "wallet",
                t: { en: "Often costs less than replacing", es: "Suele costar menos que reemplazar" },
                d: {
                    en: "When the damage is only on the surface, restoration can save you the price of a new headlight.",
                    es: "Cuando el daño está solo en la superficie, restaurar puede ahorrarte el precio de un faro nuevo.",
                },
            },
            {
                icon: "shield",
                t: { en: "Fresh UV protection", es: "Protección UV nueva" },
                d: {
                    en: "A protective layer at the end helps slow future yellowing.",
                    es: "Una capa protectora al final ayuda a frenar que vuelvan a amarillear.",
                },
            },
            {
                icon: "car",
                t: { en: "Good for resale", es: "Ayuda al vender" },
                d: {
                    en: "Clear headlights are one of the first things a buyer notices.",
                    es: "Unos faros claros son de las primeras cosas que nota un comprador.",
                },
            },
            {
                icon: "clock",
                t: { en: "Done where you are", es: "Donde estés" },
                d: {
                    en: "No trip to a shop. Our team comes to your home or office in Miami-Dade.",
                    es: "Sin ir a un taller. Nuestro equipo llega a tu casa u oficina en Miami-Dade.",
                },
            },
        ],
        careTitle: { en: "How to keep them clear", es: "Cómo mantenerlos claros" },
        careIntro: {
            en: "The result lasts longer when the lens is protected from the same things that damaged it in the first place.",
            es: "El resultado dura más cuando proteges el lente de lo mismo que lo dañó al inicio.",
        },
        care: [
            {
                en: "Park in a garage or in the shade when you can. Sun is the main cause of yellowing.",
                es: "Estaciona en un garaje o a la sombra cuando puedas. El sol es la causa principal del amarillamiento.",
            },
            {
                en: "Wash by hand with a soft mitt and car shampoo. Brushes at automatic washes can scratch the lens.",
                es: "Lava a mano con una esponja suave y champú para autos. Los cepillos de los lavados automáticos pueden rayar el lente.",
            },
            {
                en: "Keep solvents, degreasers and abrasive cleaners off the lenses.",
                es: "Evita solventes, desengrasantes y limpiadores abrasivos en los faros.",
            },
            {
                en: "Add a UV-protective sealant now and then. It helps slow future yellowing.",
                es: "Aplica de vez en cuando un sellador con protección UV. Ayuda a frenar que vuelvan a amarillear.",
            },
            {
                en: "If you notice moisture inside the headlight, get it checked. Restoration only treats the outside.",
                es: "Si ves humedad dentro del faro, haz que lo revisen. La restauración solo trata el exterior.",
            },
        ],
        faqs: [
            {
                q: {
                    en: "How much does headlight restoration cost in Miami?",
                    es: "¿Cuánto cuesta la restauración de faros en Miami?",
                },
                a: {
                    en: "Headlight restoration starts at {price}. The final quote depends on your vehicle and the condition of the lenses, and you see transparent pricing before you confirm, with no hidden fees.",
                    es: "La restauración de faros empieza en {price}. El precio final depende de tu vehículo y del estado de los lentes, y ves el precio claro antes de confirmar, sin cargos ocultos.",
                },
            },
            {
                q: { en: "How long does it take?", es: "¿Cuánto tarda?" },
                a: {
                    en: "A typical headlight restoration takes {duration}. You can keep working or relax while it's done. No waiting room required.",
                    es: "Una restauración de faros típica toma {duration}. Puedes seguir trabajando o descansar mientras se hace. No necesitas sala de espera.",
                },
            },
            {
                q: { en: "Why do headlights turn yellow?", es: "¿Por qué se ponen amarillos los faros?" },
                a: {
                    en: "The factory clear coat on the lens wears down from sun, heat and road grime. Once it's gone, the plastic oxidizes and turns yellow or cloudy.",
                    es: "La capa transparente de fábrica del lente se desgasta por el sol, el calor y la suciedad de la carretera. Cuando desaparece, el plástico se oxida y se pone amarillo u opaco.",
                },
            },
            {
                q: { en: "Can any headlight be restored?", es: "¿Se puede restaurar cualquier faro?" },
                a: {
                    en: "If the damage is on the outside of the lens, usually yes. Moisture inside the headlight, cracks or deep damage can't be fixed by restoring the surface, and in those cases replacing the headlight may be the right call.",
                    es: "Si el daño está en el exterior del lente, normalmente sí. La humedad dentro del faro, las grietas o el daño profundo no se arreglan restaurando la superficie, y en esos casos puede ser mejor reemplazar el faro.",
                },
            },
            {
                q: {
                    en: "How long do restored headlights stay clear?",
                    es: "¿Cuánto tiempo se mantienen claros los faros restaurados?",
                },
                a: {
                    en: "It depends on the protective layer applied at the end and on how much sun the car gets. A car kept in a garage holds the result longer than one parked in the sun every day.",
                    es: "Depende de la capa protectora que se aplica al final y de cuánto sol recibe el auto. Un auto guardado en garaje conserva el resultado más tiempo que uno estacionado al sol todos los días.",
                },
            },
            {
                q: {
                    en: "Can I restore my headlights myself with a kit?",
                    es: "¿Puedo restaurar mis faros yo mismo con un kit?",
                },
                a: {
                    en: "Kits can help with light haze, but results vary. The most common mistakes are sanding too aggressively and skipping the final UV protection, which lets the lens yellow again quickly.",
                    es: "Los kits pueden ayudar con un velo ligero, pero los resultados varían. Los errores más comunes son lijar de más y omitir la protección UV final, lo que deja que el lente vuelva a amarillear rápido.",
                },
            },
            {
                q: {
                    en: "Do you come to my home or office?",
                    es: "¿Vienen a mi casa u oficina?",
                },
                a: {
                    en: "Yes. Dtailwash is fully mobile: our team arrives at your home, office or building anywhere in Miami-Dade with everything needed to complete the job on-site. We arrive self-contained with our own water and equipment, so all we need is access to your vehicle.",
                    es: "Sí. Dtailwash es totalmente móvil: nuestro equipo llega a tu casa, oficina o edificio en cualquier lugar de Miami-Dade con todo lo necesario para hacer el trabajo en el sitio. Llegamos con nuestra propia agua y equipo, así que solo necesitamos acceso a tu vehículo.",
                },
            },
            {
                q: { en: "When do you charge my card?", es: "¿Cuándo cobran mi tarjeta?" },
                a: {
                    en: "You approve the work first. We only charge your card after you confirm everything looks good.",
                    es: "Tú apruebas el trabajo primero. Solo cobramos tu tarjeta después de que confirmes que todo se ve bien.",
                },
            },
        ],
        bestFor: {
            en: "Cloudy or yellow headlights on an otherwise healthy car",
            es: "Faros opacos o amarillos en un auto que por lo demás está en buen estado",
        },
        photos: {
            cover: "/images/services/headlight-restoration-06.jpg",
            coverPosition: "60% 60%",
            beforeAfterTitle: { en: "Before and after", es: "Antes y después" },
            beforeAfterIntro: {
                en: "Real headlights from our own jobs.",
                es: "Faros reales de nuestros propios trabajos.",
            },
            beforeAfter: [
                {
                    before: "/images/services/headlight-restoration-02.jpg",
                    after: "/images/services/headlight-restoration-03.jpg",
                    orientation: "portrait",
                    caption: { en: "Truck headlight", es: "Faro de camión" },
                },
                {
                    before: "/images/services/headlight-restoration-05.jpg",
                    after: "/images/services/headlight-restoration-06.jpg",
                    orientation: "landscape",
                    caption: { en: "SUV headlight", es: "Faro de SUV" },
                },
            ],
        },
    },
    "express-detail": {
        seoTitle: {
            en: "Express Car Detail Miami: Quick Mobile Detailing",
            es: "Detallado Express en Miami: Limpieza Rápida a Domicilio",
        },
        metaDescription: {
            en: "Express car detail in Miami-Dade at your home or office. A quick refresh in {duration}: what it covers, who it suits and what it can't do. From {price}.",
            es: "Detallado express en Miami-Dade en tu casa u oficina. Un repaso rápido en {duration}: qué cubre, para quién es y qué no hace. Desde {price}.",
        },
        heroSub: {
            en: "Between deeper details, your car still needs regular care. An express detail is a quick refresh that keeps it clean and comfortable without taking your whole day.",
            es: "Entre un detallado profundo y otro, tu auto igual necesita cuidado. El detallado express es un repaso rápido que lo mantiene limpio y cómodo sin quitarte el día.",
        },
        quickAnswer: {
            en: "An express detail is a shorter version of a full detail: a quick clean of the inside and outside of your car to freshen it up between deeper services. It takes {duration} and costs less because it doesn't go as deep as an interior, exterior or full detail.",
            es: "Un detallado express es una versión corta del detallado completo: una limpieza rápida por dentro y por fuera para refrescar tu auto entre servicios más profundos. Toma {duration} y cuesta menos porque no llega tan a fondo como un detallado interior, exterior o completo.",
        },
        scienceTitle: { en: "What is an express detail?", es: "¿Qué es un detallado express?" },
        science: [
            {
                en: "A detail is a deeper clean than a car wash. It reaches the places a wash skips, like door jambs, wheels and small interior surfaces. An express detail takes that idea and shortens it: the most noticeable areas get attention, so the car looks and feels fresh again in far less time.",
                es: "Un detallado es una limpieza más profunda que un lavado. Llega a lugares que un lavado deja pasar, como los marcos de las puertas, los rines y las superficies pequeñas del interior. El detallado express toma esa idea y la acorta: se atienden las zonas más visibles, así que el auto vuelve a verse y sentirse fresco en mucho menos tiempo.",
            },
            {
                en: "That makes it a good fit for regular upkeep. Dirt that stays on a car for weeks gets harder to remove, and a quick, frequent clean is easier on the paint and the interior than waiting for a big cleanup. When the car needs more, such as deep stains or heavy buildup, a longer service is the better choice.",
                es: "Por eso funciona muy bien para el mantenimiento regular. La suciedad que se queda semanas sobre el auto cuesta más quitarla, y una limpieza rápida y frecuente es más amable con la pintura y el interior que esperar a una limpieza grande. Cuando el auto necesita más, como manchas profundas o mucha acumulación, un servicio más largo es la mejor opción.",
            },
        ],
        keywords: [
            { en: "Express car detail", es: "Detallado express" },
            { en: "Quick car detailing", es: "Detallado rápido de autos" },
            { en: "Mobile car detailing Miami", es: "Detallado móvil en Miami" },
            { en: "Interior and exterior refresh", es: "Limpieza interior y exterior" },
            { en: "Car maintenance detail", es: "Mantenimiento de auto" },
        ],
        limits: {
            canTitle: { en: "What an express detail is good for", es: "Para qué sirve un detallado express" },
            can: [
                { en: "Regular upkeep between deeper details", es: "Mantenimiento regular entre detallados más profundos" },
                { en: "Everyday dirt, dust and light grime", es: "Suciedad, polvo y mugre del día a día" },
                {
                    en: "Freshening up before a trip, a meeting or a sale",
                    es: "Dejar el auto listo antes de un viaje, una reunión o una venta",
                },
            ],
            cannotTitle: { en: "What needs a longer service", es: "Lo que necesita un servicio más largo" },
            cannot: [
                {
                    en: "Deep stains or heavy buildup in seats and carpets",
                    es: "Manchas profundas o mucha acumulación en asientos y alfombras",
                },
                { en: "Paint that needs polishing", es: "Pintura que necesita pulido" },
                { en: "Heavy odors or areas neglected for a long time", es: "Olores fuertes o zonas descuidadas por mucho tiempo" },
            ],
        },
        benefitsTitle: { en: "Why choose an express detail", es: "Por qué elegir un detallado express" },
        benefitsIntro: {
            en: "A shorter service for cars that need a refresh, not a full restoration.",
            es: "Un servicio más corto para autos que necesitan un repaso, no una restauración.",
        },
        benefits: [
            {
                icon: "clock",
                t: { en: "Fast turnaround", es: "Rápido" },
                d: {
                    en: "It takes {duration}, so it fits into a workday or a free morning.",
                    es: "Toma {duration}, así que cabe en un día de trabajo o en una mañana libre.",
                },
            },
            {
                icon: "wallet",
                t: { en: "Lower price", es: "Precio más bajo" },
                d: {
                    en: "The most affordable way to get a detail, from {price}.",
                    es: "La forma más económica de recibir un detallado, desde {price}.",
                },
            },
            {
                icon: "sparkle",
                t: { en: "Looks fresh again", es: "Se ve fresco otra vez" },
                d: {
                    en: "The most visible areas get cleaned, so the car feels cared for.",
                    es: "Se limpian las zonas más visibles y el auto se siente cuidado.",
                },
            },
            {
                icon: "shield",
                t: { en: "Easier upkeep", es: "Mantenimiento más fácil" },
                d: {
                    en: "Regular cleaning keeps dirt from setting in and getting harder to remove.",
                    es: "Limpiar con frecuencia evita que la suciedad se asiente y cueste más quitarla.",
                },
            },
            {
                icon: "car",
                t: { en: "Ready for anything", es: "Listo para lo que sea" },
                d: {
                    en: "Good before a trip, a meeting or showing the car to a buyer.",
                    es: "Ideal antes de un viaje, una reunión o de enseñarle el auto a un comprador.",
                },
            },
            benefitHome,
        ],
        careTitle: { en: "Keep it fresh between details", es: "Mantenlo fresco entre detallados" },
        careIntro: {
            en: "Small habits make the result last longer.",
            es: "Pequeños hábitos hacen que el resultado dure más.",
        },
        care: [
            {
                en: "Remove trash and loose items regularly so crumbs and dirt don't build up.",
                es: "Saca la basura y los objetos sueltos con frecuencia para que no se acumulen migajas y suciedad.",
            },
            { en: "Shake out or vacuum the floor mats every so often.", es: "Sacude o aspira los tapetes de vez en cuando." },
            { en: "Wipe up spills as soon as they happen, before they set.", es: "Limpia los derrames en cuanto ocurran, antes de que se fijen." },
            {
                en: "Park in the shade or a garage when you can to protect the paint and the dashboard from the sun.",
                es: "Estaciona a la sombra o en un garaje cuando puedas para cuidar la pintura y el tablero del sol.",
            },
            {
                en: "Book the next express detail before the car gets very dirty. It's faster and easier than a big cleanup.",
                es: "Reserva el siguiente detallado express antes de que el auto esté muy sucio. Es más rápido y fácil que una limpieza grande.",
            },
        ],
        faqs: [
            faqCost({ en: "an express detail", es: "un detallado express" }),
            faqTime,
            {
                q: {
                    en: "What's the difference between an express detail and a full detail?",
                    es: "¿Cuál es la diferencia entre un detallado express y uno completo?",
                },
                a: {
                    en: "A full detail goes deeper inside and outside and takes several hours. An express detail focuses on the most visible areas for regular upkeep, so it's shorter and costs less.",
                    es: "Un detallado completo llega más a fondo por dentro y por fuera y toma varias horas. El express se enfoca en las zonas más visibles para el mantenimiento regular, así que es más corto y cuesta menos.",
                },
            },
            {
                q: { en: "How often should I get an express detail?", es: "¿Cada cuánto conviene un detallado express?" },
                a: {
                    en: "It depends on how much you drive and where you park. A regular schedule, such as once a month, keeps dirt from building up.",
                    es: "Depende de cuánto manejes y dónde estaciones. Un calendario regular, por ejemplo una vez al mes, evita que la suciedad se acumule.",
                },
            },
            {
                q: {
                    en: "Is an express detail enough for a very dirty car?",
                    es: "¿Alcanza un detallado express para un auto muy sucio?",
                },
                a: {
                    en: "If the car has deep stains, heavy buildup or hasn't been cleaned in a long time, a longer service such as an interior, exterior or full detail is usually the better choice.",
                    es: "Si el auto tiene manchas profundas, mucha acumulación o hace mucho que no se limpia, un servicio más largo, como un detallado interior, exterior o completo, suele ser la mejor opción.",
                },
            },
            faqHome,
            faqCharge,
        ],
        bestFor: {
            en: "Regular upkeep of a car that just needs a refresh",
            es: "Mantenimiento regular de un auto que solo necesita un repaso",
        },
    },
    "interior-detail": {
        seoTitle: {
            en: "Interior Car Detailing Miami: Deep Clean Seats & Carpets",
            es: "Detallado Interior en Miami: Limpieza Profunda del Auto",
        },
        metaDescription: {
            en: "Interior car detailing in Miami-Dade at your home or office. What a deep interior clean covers, what it can't fix and how to keep it fresh. From {price}.",
            es: "Detallado interior en Miami-Dade en tu casa u oficina. Qué cubre una limpieza profunda, qué no puede arreglar y cómo mantenerla. Desde {price}.",
        },
        heroSub: {
            en: "Your car's interior collects dust, crumbs, spills and odors every day. An interior detail cleans it in depth, so the inside feels fresh and comfortable again.",
            es: "El interior de tu auto acumula polvo, migajas, derrames y olores todos los días. Un detallado interior lo limpia a fondo para que vuelva a sentirse fresco y cómodo.",
        },
        quickAnswer: {
            en: "An interior detail is a deep clean of the inside of your car: seats, carpets, dashboard, doors and the small spaces a quick vacuum misses. It removes built-up dirt and can help with odors. It takes {duration}.",
            es: "Un detallado interior es una limpieza profunda por dentro del auto: asientos, alfombras, tablero, puertas y los espacios pequeños que una aspirada rápida no alcanza. Quita la suciedad acumulada y puede ayudar con los olores. Toma {duration}.",
        },
        scienceTitle: { en: "What is an interior detail?", es: "¿Qué es un detallado interior?" },
        science: [
            {
                en: "The inside of a car is a mix of materials: fabric, carpet, plastic, leather or vinyl, glass and rubber. Each one holds dirt differently and needs its own kind of cleaning. An interior detail goes surface by surface, instead of just vacuuming and wiping what's easy to reach.",
                es: "El interior de un auto mezcla materiales: tela, alfombra, plástico, piel o vinilo, vidrio y goma. Cada uno retiene la suciedad de forma distinta y necesita su propia limpieza. Un detallado interior avanza superficie por superficie, en lugar de solo aspirar y limpiar lo que queda a la mano.",
            },
            {
                en: "Dirt and moisture that stay in seats and carpets can lead to stains and odors over time. A deep clean removes what a regular vacuum leaves behind and gets into the seams, vents and corners where dust collects. The result is an interior that looks better and is more pleasant to sit in.",
                es: "La suciedad y la humedad que se quedan en asientos y alfombras pueden causar manchas y olores con el tiempo. Una limpieza profunda quita lo que una aspiradora normal deja atrás y llega a las costuras, las rejillas y los rincones donde se junta el polvo. El resultado es un interior que se ve mejor y es más agradable para sentarse.",
            },
        ],
        keywords: [
            { en: "Interior car detailing", es: "Detallado interior de autos" },
            { en: "Deep clean car interior", es: "Limpieza profunda del interior" },
            { en: "Seat and carpet cleaning", es: "Limpieza de asientos y alfombras" },
            { en: "Dashboard and console cleaning", es: "Limpieza de tablero y consola" },
            { en: "Mobile interior detail", es: "Detallado interior a domicilio" },
        ],
        limits: {
            canTitle: { en: "What an interior detail can do", es: "Lo que puede hacer un detallado interior" },
            can: [
                {
                    en: "Remove built-up dust, crumbs and everyday grime",
                    es: "Quitar polvo, migajas y mugre acumulados",
                },
                { en: "Refresh seats, carpets and hard surfaces", es: "Refrescar asientos, alfombras y superficies duras" },
                {
                    en: "Reach seams, vents and corners a quick vacuum misses",
                    es: "Llegar a costuras, rejillas y rincones que una aspirada rápida no alcanza",
                },
            ],
            cannotTitle: { en: "What it can't fix", es: "Lo que no corrige" },
            cannot: [
                {
                    en: "Burns, rips or cracks in upholstery and leather",
                    es: "Quemaduras, rasgaduras o grietas en tapicería y piel",
                },
                { en: "Permanent dye stains or sun-faded fabric", es: "Manchas de tinte permanentes o tela descolorida por el sol" },
                { en: "Damage from flooding or long-term moisture", es: "Daño por inundación o humedad de mucho tiempo" },
            ],
        },
        benefitsTitle: { en: "Why get an interior detail", es: "Por qué hacer un detallado interior" },
        benefitsIntro: {
            en: "You spend your time inside the car, so this is the part you notice every day.",
            es: "Pasas tu tiempo dentro del auto, así que esta es la parte que notas todos los días.",
        },
        benefits: [
            {
                icon: "armchair",
                t: { en: "Cleaner seats and carpets", es: "Asientos y alfombras más limpios" },
                d: {
                    en: "A deep clean lifts dirt that a regular vacuum leaves in the fabric.",
                    es: "Una limpieza profunda saca la suciedad que una aspiradora normal deja en la tela.",
                },
            },
            {
                icon: "wind",
                t: { en: "A fresher cabin", es: "Una cabina más fresca" },
                d: {
                    en: "Removing built-up dirt helps the inside smell and feel cleaner.",
                    es: "Quitar la suciedad acumulada ayuda a que el interior huela y se sienta más limpio.",
                },
            },
            {
                icon: "eye",
                t: { en: "The details you'd miss", es: "Los detalles que se te pasan" },
                d: {
                    en: "Vents, seams, cup holders and corners get attention too.",
                    es: "Las rejillas, las costuras, los portavasos y los rincones también se atienden.",
                },
            },
            {
                icon: "sparkle",
                t: { en: "A cared-for look", es: "Un aspecto cuidado" },
                d: {
                    en: "Clean surfaces make the whole interior look newer.",
                    es: "Las superficies limpias hacen que todo el interior se vea más nuevo.",
                },
            },
            {
                icon: "car",
                t: { en: "Good for resale", es: "Ayuda al vender" },
                d: {
                    en: "A clean interior is one of the first things a buyer notices.",
                    es: "Un interior limpio es de las primeras cosas que nota un comprador.",
                },
            },
            benefitHome,
        ],
        careTitle: { en: "Keep the inside clean longer", es: "Mantén el interior limpio por más tiempo" },
        careIntro: {
            en: "A few habits protect the results.",
            es: "Unos pocos hábitos protegen el resultado.",
        },
        care: [
            {
                en: "Vacuum the floor and seats regularly so dirt doesn't get ground into the fabric.",
                es: "Aspira el piso y los asientos con regularidad para que la suciedad no se incruste en la tela.",
            },
            { en: "Wipe spills right away, before they soak in.", es: "Limpia los derrames de inmediato, antes de que penetren." },
            {
                en: "Use a sunshade or park in the shade to protect the dashboard and seats from sun fading.",
                es: "Usa un parasol o estaciona a la sombra para proteger el tablero y los asientos de la decoloración por el sol.",
            },
            {
                en: "Keep food and drinks to a minimum, and choose cups with lids.",
                es: "Reduce la comida y las bebidas dentro del auto, y usa vasos con tapa.",
            },
            {
                en: "Air out the car once in a while to let moisture escape.",
                es: "Ventila el auto de vez en cuando para que escape la humedad.",
            },
        ],
        faqs: [
            faqCost({ en: "an interior detail", es: "un detallado interior" }),
            faqTime,
            {
                q: { en: "How often should I get an interior detail?", es: "¿Cada cuánto conviene un detallado interior?" },
                a: {
                    en: "It depends on how many people and pets ride in the car, and how often you eat or drink in it. Many drivers do a deep interior clean once or twice a year and keep up with quick vacuuming in between.",
                    es: "Depende de cuántas personas y mascotas viajen en el auto y de cuánto comas o bebas dentro. Muchos conductores hacen una limpieza profunda una o dos veces al año y mantienen el resto con aspiradas rápidas.",
                },
            },
            {
                q: { en: "Can it remove every stain?", es: "¿Puede quitar todas las manchas?" },
                a: {
                    en: "Many everyday stains come out with a deep clean, but some are permanent, such as dye transfer, burns or sun-faded fabric. If a stain is old or unusual, the result depends on the material and how long it has been there.",
                    es: "Muchas manchas del día a día salen con una limpieza profunda, pero algunas son permanentes, como la transferencia de tinte, las quemaduras o la tela descolorida por el sol. Si la mancha es vieja o poco común, el resultado depende del material y del tiempo que lleve ahí.",
                },
            },
            {
                q: {
                    en: "What's the difference between an interior detail and a full detail?",
                    es: "¿Cuál es la diferencia entre un detallado interior y uno completo?",
                },
                a: {
                    en: "An interior detail focuses only on the inside of the car. A full detail covers the inside and the outside in one visit.",
                    es: "Un detallado interior se enfoca solo en el interior del auto. Uno completo cubre el interior y el exterior en una sola visita.",
                },
            },
            {
                q: { en: "Do I need to empty my car first?", es: "¿Tengo que vaciar el auto antes?" },
                a: {
                    en: "It helps if you remove personal belongings and valuables beforehand, so every area can be reached.",
                    es: "Ayuda que saques tus pertenencias y objetos de valor antes, para poder llegar a todas las zonas.",
                },
            },
            faqHome,
            faqCharge,
        ],
        bestFor: {
            en: "Cars whose seats, carpets and cabin need a deep clean",
            es: "Autos cuyos asientos, alfombras y cabina necesitan limpieza profunda",
        },
    },
    "exterior-detail": {
        seoTitle: {
            en: "Exterior Car Detailing Miami: Mobile Deep Clean",
            es: "Detallado Exterior en Miami: Limpieza Profunda a Domicilio",
        },
        metaDescription: {
            en: "Exterior car detailing in Miami-Dade at your home or office. What a deep exterior clean covers, what it can't fix and how to keep the shine. From {price}.",
            es: "Detallado exterior en Miami-Dade en tu casa u oficina. Qué cubre una limpieza profunda, qué no puede arreglar y cómo conservar el brillo. Desde {price}.",
        },
        heroSub: {
            en: "Sun, rain, road grime and bugs take a toll on your car's finish. An exterior detail cleans it far beyond a regular wash, so the outside looks sharp again.",
            es: "El sol, la lluvia, la mugre de la carretera y los insectos desgastan el acabado de tu auto. Un detallado exterior lo limpia mucho más a fondo que un lavado común, para que se vea impecable otra vez.",
        },
        quickAnswer: {
            en: "An exterior detail is a deep clean of the outside of your car: paint, wheels, tires and the areas a car wash tends to skip. It removes built-up dirt and improves how the finish looks. It takes {duration}.",
            es: "Un detallado exterior es una limpieza profunda por fuera del auto: pintura, rines, llantas y las zonas que un lavado suele saltarse. Quita la suciedad acumulada y mejora cómo se ve el acabado. Toma {duration}.",
        },
        scienceTitle: { en: "What is an exterior detail?", es: "¿Qué es un detallado exterior?" },
        science: [
            {
                en: "A car wash removes the loose dirt on the surface. An exterior detail goes further: it cleans the paint, wheels, tires, door jambs and other spots where grime settles and stays, working area by area instead of rushing through.",
                es: "Un lavado quita la suciedad suelta de la superficie. Un detallado exterior va más allá: limpia la pintura, los rines, las llantas, los marcos de las puertas y otros lugares donde la mugre se asienta y se queda, trabajando zona por zona en lugar de apurarse.",
            },
            {
                en: "Miami's sun, salty air and frequent rain leave film, water spots and road grime on the finish. Over time that buildup dulls the paint and makes it harder to keep clean. Regular exterior care keeps the surface clean and helps the color look deeper.",
                es: "El sol, el aire salado y las lluvias frecuentes de Miami dejan película, manchas de agua y mugre de carretera sobre el acabado. Con el tiempo esa acumulación opaca la pintura y la hace más difícil de mantener limpia. Un cuidado exterior regular mantiene la superficie limpia y ayuda a que el color se vea más profundo.",
            },
        ],
        keywords: [
            { en: "Exterior car detailing", es: "Detallado exterior de autos" },
            { en: "Deep clean car exterior", es: "Limpieza profunda exterior" },
            { en: "Wheel and tire cleaning", es: "Limpieza de rines y llantas" },
            { en: "Door jamb cleaning", es: "Limpieza de marcos de puertas" },
            { en: "Mobile exterior detail", es: "Detallado exterior a domicilio" },
        ],
        limits: {
            canTitle: { en: "What an exterior detail can do", es: "Lo que puede hacer un detallado exterior" },
            can: [
                { en: "Remove built-up dirt, bugs and road grime", es: "Quitar suciedad acumulada, insectos y mugre de la carretera" },
                { en: "Clean wheels, tires and often-missed spots", es: "Limpiar rines, llantas y zonas que suelen pasarse por alto" },
                { en: "Improve how the finish looks", es: "Mejorar cómo se ve el acabado" },
            ],
            cannotTitle: { en: "What it can't fix", es: "Lo que no corrige" },
            cannot: [
                { en: "Deep scratches or rock chips in the paint", es: "Rayones profundos o piquetes de piedra en la pintura" },
                { en: "Peeling or failing clear coat", es: "Barniz que se pela o falla" },
                { en: "Dents and body damage", es: "Abolladuras y daños en la carrocería" },
            ],
        },
        benefitsTitle: { en: "Why get an exterior detail", es: "Por qué hacer un detallado exterior" },
        benefitsIntro: {
            en: "The outside is the first thing everyone sees, and the part the weather hits hardest.",
            es: "El exterior es lo primero que ve todo el mundo y la parte que más golpea el clima.",
        },
        benefits: [
            {
                icon: "droplets",
                t: { en: "A deeper clean than a wash", es: "Más profundo que un lavado" },
                d: {
                    en: "It reaches wheels, jambs and other spots a car wash skips.",
                    es: "Llega a los rines, los marcos y otras zonas que un lavado se salta.",
                },
            },
            {
                icon: "sparkle",
                t: { en: "A sharper finish", es: "Un acabado más nítido" },
                d: {
                    en: "Removing film and grime helps the paint look cleaner and brighter.",
                    es: "Quitar la película y la mugre ayuda a que la pintura se vea más limpia y brillante.",
                },
            },
            {
                icon: "shield",
                t: { en: "Easier to keep clean", es: "Más fácil de mantener" },
                d: {
                    en: "A clean surface makes regular washes faster and easier.",
                    es: "Una superficie limpia hace que los lavados regulares sean más rápidos y fáciles.",
                },
            },
            {
                icon: "eye",
                t: { en: "Attention to details", es: "Atención a los detalles" },
                d: {
                    en: "Wheels, tires, fenders and door jambs are part of the job.",
                    es: "Rines, llantas, salpicaderas y marcos de puertas son parte del trabajo.",
                },
            },
            {
                icon: "car",
                t: { en: "Good for resale", es: "Ayuda al vender" },
                d: {
                    en: "A clean exterior makes a strong first impression on buyers.",
                    es: "Un exterior limpio causa una buena primera impresión en los compradores.",
                },
            },
            benefitHome,
        ],
        careTitle: { en: "Keep the shine longer", es: "Conserva el brillo por más tiempo" },
        careIntro: {
            en: "How you wash the car matters as much as how often.",
            es: "Cómo lavas el auto importa tanto como cada cuánto.",
        },
        care: [
            {
                en: "Wash by hand with a clean mitt and car shampoo, and rinse before you wipe.",
                es: "Lava a mano con una esponja limpia y champú para autos, y enjuaga antes de frotar.",
            },
            {
                en: "Avoid automatic washes with spinning brushes that can scratch the paint.",
                es: "Evita los lavados automáticos con cepillos giratorios que pueden rayar la pintura.",
            },
            {
                en: "Wash in the shade and dry the car so water doesn't leave spots.",
                es: "Lava a la sombra y seca el auto para que el agua no deje manchas.",
            },
            {
                en: "Remove bird droppings and bug residue quickly, before they etch into the paint.",
                es: "Quita los excrementos de pájaros y los restos de insectos rápido, antes de que marquen la pintura.",
            },
            {
                en: "Park in the shade or a garage when you can.",
                es: "Estaciona a la sombra o en un garaje cuando puedas.",
            },
        ],
        faqs: [
            faqCost({ en: "an exterior detail", es: "un detallado exterior" }),
            faqTime,
            {
                q: {
                    en: "What's the difference between an exterior detail and a car wash?",
                    es: "¿Cuál es la diferencia entre un detallado exterior y un lavado?",
                },
                a: {
                    en: "A car wash removes surface dirt quickly. An exterior detail is slower and more thorough, covering areas a wash skips and working on the finish itself.",
                    es: "Un lavado quita rápido la suciedad de la superficie. Un detallado exterior es más lento y más completo: cubre zonas que un lavado se salta y trabaja el acabado en sí.",
                },
            },
            {
                q: { en: "Will it remove scratches?", es: "¿Quita los rayones?" },
                a: {
                    en: "Dirt marks come off, but scratches are damage to the paint and need polishing or repair. If your car has swirl marks or dull paint, a paint enhancement is the better fit.",
                    es: "Las marcas de suciedad salen, pero los rayones son daño en la pintura y necesitan pulido o reparación. Si tu auto tiene remolinos finos o la pintura opaca, un pulido de pintura es la mejor opción.",
                },
            },
            {
                q: { en: "How often should I get an exterior detail?", es: "¿Cada cuánto conviene un detallado exterior?" },
                a: {
                    en: "It depends on where the car is parked and how much it drives. Cars parked outside in the sun and rain benefit from more frequent care than cars kept in a garage.",
                    es: "Depende de dónde se estacione el auto y cuánto se maneje. Los autos estacionados afuera, bajo el sol y la lluvia, se benefician de cuidados más frecuentes que los que duermen en un garaje.",
                },
            },
            {
                q: {
                    en: "What's the difference between an exterior detail and a full detail?",
                    es: "¿Cuál es la diferencia entre un detallado exterior y uno completo?",
                },
                a: {
                    en: "An exterior detail covers the outside only. A full detail cleans the inside and the outside in one visit.",
                    es: "Un detallado exterior cubre solo el exterior. Uno completo limpia el interior y el exterior en una sola visita.",
                },
            },
            faqHome,
            faqCharge,
        ],
        bestFor: {
            en: "Cars with a dirty or dull-looking exterior",
            es: "Autos con el exterior sucio o de aspecto opaco",
        },
    },
    "full-detail": {
        seoTitle: {
            en: "Full Car Detail Miami: Mobile Interior & Exterior Detailing",
            es: "Detallado Completo en Miami: Interior y Exterior a Domicilio",
        },
        metaDescription: {
            en: "Full car detail in Miami-Dade at your home or office: a deep clean inside and out in one visit. What it covers, who it's for and what to expect. From {price}.",
            es: "Detallado completo en Miami-Dade en tu casa u oficina: limpieza profunda por dentro y por fuera en una visita. Qué cubre y qué esperar. Desde {price}.",
        },
        heroSub: {
            en: "A full detail cleans the inside and the outside of your car in depth in a single visit, so you don't have to book two separate services.",
            es: "Un detallado completo limpia a fondo el interior y el exterior de tu auto en una sola visita, para que no tengas que reservar dos servicios por separado.",
        },
        quickAnswer: {
            en: "A full detail combines a deep interior clean and a deep exterior clean in one visit. Inside, it covers the interior surfaces, dashboard, console, doors and panels; outside, the paint, wheels, tires and door jambs. It takes {duration}.",
            es: "Un detallado completo combina una limpieza profunda del interior y otra del exterior en una sola visita. Por dentro cubre las superficies del interior, el tablero, la consola, las puertas y los paneles; por fuera, la pintura, los rines, las llantas y los marcos de las puertas. Toma {duration}.",
        },
        scienceTitle: { en: "What is a full detail?", es: "¿Qué es un detallado completo?" },
        science: [
            {
                en: "A full detail is two services in one visit: a deep interior detail and a deep exterior detail. Instead of booking them separately, the whole car is handled in a single appointment, from the trunk and dashboard to the wheels and door jambs.",
                es: "Un detallado completo son dos servicios en una visita: un detallado interior profundo y un detallado exterior profundo. En lugar de reservarlos por separado, todo el auto se atiende en una sola cita, desde la cajuela y el tablero hasta los rines y los marcos de las puertas.",
            },
            {
                en: "It's a good choice when the car hasn't had a deep clean in a while, when you're getting it ready to sell, or when you simply want it to look its best. Because it covers everything, it takes longer and costs more than a single-area service, but it's also the simplest way to reset the whole car.",
                es: "Es una buena opción cuando el auto lleva tiempo sin una limpieza profunda, cuando lo estás preparando para vender, o cuando simplemente quieres que se vea en su mejor estado. Como cubre todo, toma más tiempo y cuesta más que un servicio de una sola zona, pero también es la forma más sencilla de dejar todo el auto como nuevo.",
            },
        ],
        keywords: [
            { en: "Full car detail", es: "Detallado completo" },
            { en: "Interior and exterior detailing", es: "Detallado interior y exterior" },
            { en: "Complete car cleaning", es: "Limpieza completa del auto" },
            { en: "Deep clean car", es: "Limpieza profunda de autos" },
            { en: "Mobile full detail in Miami", es: "Detallado completo a domicilio en Miami" },
        ],
        limits: {
            canTitle: { en: "What a full detail can do", es: "Lo que puede hacer un detallado completo" },
            can: [
                { en: "Deep clean the inside and outside in one visit", es: "Limpiar a fondo el interior y el exterior en una visita" },
                { en: "Reset a car that hasn't been detailed in a while", es: "Poner al día un auto que hace tiempo no se detalla" },
                { en: "Get a car ready to sell or to show off", es: "Dejar un auto listo para vender o para lucir" },
            ],
            cannotTitle: { en: "What it can't fix", es: "Lo que no corrige" },
            cannot: [
                {
                    en: "Scratches, swirl marks or dull paint that need polishing",
                    es: "Rayones, remolinos o pintura opaca que necesitan pulido",
                },
                { en: "Tears, burns or cracks in upholstery", es: "Rasgaduras, quemaduras o grietas en la tapicería" },
                { en: "Dents, rust damage or mechanical problems", es: "Abolladuras, daño por óxido o problemas mecánicos" },
            ],
        },
        benefitsTitle: { en: "Why get a full detail", es: "Por qué hacer un detallado completo" },
        benefitsIntro: {
            en: "One visit, the whole car.",
            es: "Una visita, todo el auto.",
        },
        benefits: [
            {
                icon: "sparkle",
                t: { en: "The whole car, one visit", es: "Todo el auto, una visita" },
                d: {
                    en: "Inside and outside are cleaned in a single appointment.",
                    es: "El interior y el exterior se limpian en una sola cita.",
                },
            },
            {
                icon: "armchair",
                t: { en: "A cleaner interior", es: "Un interior más limpio" },
                d: {
                    en: "Interior surfaces, dashboard, console, doors and panels get a deep clean.",
                    es: "Las superficies del interior, el tablero, la consola, las puertas y los paneles se limpian a fondo.",
                },
            },
            {
                icon: "droplets",
                t: { en: "A cleaner exterior", es: "Un exterior más limpio" },
                d: {
                    en: "Wheels, tires, fenders and door jambs are included.",
                    es: "Rines, llantas, salpicaderas y marcos de puertas están incluidos.",
                },
            },
            {
                icon: "clock",
                t: { en: "Saves you time", es: "Te ahorra tiempo" },
                d: {
                    en: "One service instead of two means less scheduling and no trips to a shop.",
                    es: "Un servicio en lugar de dos significa menos citas y ningún viaje a un taller.",
                },
            },
            {
                icon: "car",
                t: { en: "Ready to sell or show", es: "Listo para vender o lucir" },
                d: {
                    en: "A car that's clean inside and out makes a strong impression.",
                    es: "Un auto limpio por dentro y por fuera causa una gran impresión.",
                },
            },
            benefitHome,
        ],
        careTitle: { en: "Keep the whole car fresh", es: "Mantén todo el auto fresco" },
        careIntro: {
            en: "Simple habits make a full detail last longer.",
            es: "Hábitos sencillos hacen que un detallado completo dure más.",
        },
        care: [
            {
                en: "Vacuum and wipe the interior regularly so dirt doesn't build up.",
                es: "Aspira y limpia el interior con regularidad para que la suciedad no se acumule.",
            },
            {
                en: "Wash the exterior by hand and avoid brushes at automatic washes.",
                es: "Lava el exterior a mano y evita los cepillos de los lavados automáticos.",
            },
            {
                en: "Wipe spills and remove bird droppings quickly.",
                es: "Limpia los derrames y quita los excrementos de pájaros rápido.",
            },
            {
                en: "Park in the shade or a garage when you can.",
                es: "Estaciona a la sombra o en un garaje cuando puedas.",
            },
            {
                en: "Book a lighter service, such as an express detail, to keep the car fresh between full details.",
                es: "Reserva un servicio más ligero, como un detallado express, para mantener el auto fresco entre detallados completos.",
            },
        ],
        faqs: [
            faqCost({ en: "a full detail", es: "un detallado completo" }),
            faqTime,
            {
                q: {
                    en: "What's the difference between a full detail and an interior or exterior detail?",
                    es: "¿Cuál es la diferencia entre un detallado completo y uno interior o exterior?",
                },
                a: {
                    en: "Interior and exterior details each cover one part of the car. A full detail does both in one visit.",
                    es: "Los detallados interior y exterior cubren cada uno una parte del auto. El completo hace ambos en una sola visita.",
                },
            },
            {
                q: { en: "When should I get a full detail?", es: "¿Cuándo conviene un detallado completo?" },
                a: {
                    en: "It's a good fit when the car hasn't had a deep clean in a long time, before selling it, or when you want a fresh start for the season.",
                    es: "Conviene cuando el auto lleva mucho tiempo sin una limpieza profunda, antes de venderlo, o cuando quieres empezar la temporada con el auto como nuevo.",
                },
            },
            {
                q: {
                    en: "Does a full detail include polishing?",
                    es: "¿El detallado completo incluye pulido?",
                },
                a: {
                    en: "A full detail is a deep clean. Polishing is a separate service, so if your paint has swirl marks or looks dull, ask about a paint enhancement.",
                    es: "El detallado completo es una limpieza profunda. El pulido es un servicio aparte, así que si tu pintura tiene remolinos o se ve opaca, pregunta por el pulido de pintura.",
                },
            },
            {
                q: { en: "Do I need to empty my car first?", es: "¿Tengo que vaciar el auto antes?" },
                a: {
                    en: "It helps if you remove personal belongings and valuables beforehand, so every area can be reached.",
                    es: "Ayuda que saques tus pertenencias y objetos de valor antes, para poder llegar a todas las zonas.",
                },
            },
            faqHome,
            faqCharge,
        ],
        bestFor: {
            en: "Cars that need a deep clean inside and out",
            es: "Autos que necesitan una limpieza profunda por dentro y por fuera",
        },
        photos: {
            cover: "/images/services/mobile-car-detailing-05.jpg",
            coverPosition: "50% 60%",
        },
    },
    "paint-enhancement": {
        seoTitle: {
            en: "Paint Enhancement Miami: One-Step Polish for Dull Paint",
            es: "Pulido de Un Paso en Miami: Devuelve el Brillo a tu Pintura",
        },
        metaDescription: {
            en: "Paint enhancement in Miami-Dade at your home or office: a one-step polish for dull, lightly swirled paint. What it can and can't fix. From {price}.",
            es: "Pulido de un paso en Miami-Dade en tu casa u oficina para pintura opaca o con remolinos ligeros. Qué corrige y qué no. Desde {price}.",
        },
        heroSub: {
            en: "Over time, paint loses its gloss. Fine swirl marks, dullness and light oxidation make the color look flat. A paint enhancement polishes the surface to bring back depth and shine.",
            es: "Con el tiempo, la pintura pierde brillo. Los remolinos finos, la opacidad y la oxidación ligera hacen que el color se vea plano. Un pulido de pintura trabaja la superficie para devolverle profundidad y brillo.",
        },
        quickAnswer: {
            en: "A paint enhancement is a one-step polish: one polishing stage to improve the gloss and clarity of your paint and reduce light imperfections such as fine swirl marks and dullness. It's a lighter option than full paint correction and it doesn't remove deep scratches. It takes {duration}.",
            es: "Un pulido de pintura es un pulido de un paso: una sola etapa de pulido para mejorar el brillo y la claridad de tu pintura y reducir imperfecciones ligeras como los remolinos finos y la opacidad. Es una opción más ligera que la corrección de pintura completa y no quita los rayones profundos. Toma {duration}.",
        },
        scienceTitle: { en: "What is a paint enhancement?", es: "¿Qué es un pulido de pintura?" },
        science: [
            {
                en: "Your car's paint has a clear coat on top, and that is the layer you see shine. Washing, drying, sun and dirt slowly create fine scratches and dullness in it, which scatter the light and make the color look flat. Polishing removes a very thin layer of that clear coat so the surface becomes smooth and reflective again.",
                es: "La pintura de tu auto tiene una capa transparente encima, y esa es la capa que ves brillar. Con el lavado, el secado, el sol y la suciedad se le van formando rayones finos y opacidad, que dispersan la luz y hacen que el color se vea plano. El pulido quita una capa muy delgada de ese barniz para que la superficie vuelva a ser lisa y reflectante.",
            },
            {
                en: "A paint enhancement uses a single polishing stage. That's enough to improve gloss and soften light swirl marks, without the extra time and cost of multi-stage paint correction. Deeper scratches and chips need a different repair, and how much improvement you see depends on the condition of the paint.",
                es: "Un pulido de pintura usa una sola etapa de pulido. Es suficiente para mejorar el brillo y suavizar los remolinos ligeros, sin el tiempo y el costo extra de una corrección de pintura de varias etapas. Los rayones profundos y los piquetes necesitan otra reparación, y cuánto mejora depende del estado de la pintura.",
            },
        ],
        keywords: [
            { en: "Paint enhancement", es: "Mejora de pintura" },
            { en: "One-step polish", es: "Pulido de un paso" },
            { en: "Car polishing Miami", es: "Pulido de autos en Miami" },
            { en: "Light swirl marks", es: "Remolinos ligeros en la pintura" },
            { en: "Restore paint shine", es: "Recuperar el brillo de la pintura" },
        ],
        limits: {
            canTitle: { en: "What a one-step polish can improve", es: "Lo que puede mejorar un pulido de un paso" },
            can: [
                { en: "Dull or faded-looking paint", es: "Pintura opaca o de aspecto desteñido" },
                { en: "Fine swirl marks and light surface scratches", es: "Remolinos finos y rayones ligeros de superficie" },
                { en: "Gloss and depth of color", es: "Brillo y profundidad del color" },
            ],
            cannotTitle: { en: "What it can't fix", es: "Lo que no corrige" },
            cannot: [
                { en: "Deep scratches or rock chips", es: "Rayones profundos o piquetes de piedra" },
                { en: "Peeling or failing clear coat", es: "Barniz que se pela o falla" },
                { en: "Dents and damage that reaches the metal", es: "Abolladuras y daños que llegan al metal" },
            ],
        },
        benefitsTitle: { en: "Why get a paint enhancement", es: "Por qué hacer un pulido de pintura" },
        benefitsIntro: {
            en: "Shine is the first thing people notice about a car's paint.",
            es: "El brillo es lo primero que la gente nota de la pintura de un auto.",
        },
        benefits: [
            {
                icon: "sparkle",
                t: { en: "More gloss", es: "Más brillo" },
                d: {
                    en: "Polishing brings back the shine that dullness hides.",
                    es: "El pulido devuelve el brillo que la opacidad esconde.",
                },
            },
            {
                icon: "eye",
                t: { en: "Deeper color", es: "Color más profundo" },
                d: {
                    en: "Smoother paint reflects light better, so the color looks richer.",
                    es: "Una pintura más lisa refleja mejor la luz, así que el color se ve más rico.",
                },
            },
            {
                icon: "sun",
                t: { en: "Softer swirl marks", es: "Remolinos más suaves" },
                d: {
                    en: "Fine swirls become less visible under sunlight and headlights.",
                    es: "Los remolinos finos se notan menos bajo el sol y las luces.",
                },
            },
            {
                icon: "clock",
                t: { en: "Faster than full correction", es: "Más rápido que la corrección completa" },
                d: {
                    en: "One polishing stage takes less time than multi-stage correction.",
                    es: "Una etapa de pulido toma menos tiempo que una corrección de varias etapas.",
                },
            },
            {
                icon: "car",
                t: { en: "Good for resale", es: "Ayuda al vender" },
                d: {
                    en: "Shiny paint is one of the first things a buyer notices.",
                    es: "Una pintura brillante es de las primeras cosas que nota un comprador.",
                },
            },
            benefitHome,
        ],
        careTitle: { en: "Keep the shine longer", es: "Conserva el brillo por más tiempo" },
        careIntro: {
            en: "Polished paint stays glossy longer with gentle care.",
            es: "La pintura pulida conserva el brillo por más tiempo con un cuidado suave.",
        },
        care: [
            {
                en: "Wash by hand with a clean mitt and car shampoo.",
                es: "Lava a mano con una esponja limpia y champú para autos.",
            },
            {
                en: "Avoid automatic washes with brushes, which can bring swirl marks back.",
                es: "Evita los lavados automáticos con cepillos, que pueden volver a marcar la pintura.",
            },
            {
                en: "Dry with clean microfiber towels. Dirty or rough towels can scratch the paint.",
                es: "Seca con toallas de microfibra limpias. Las toallas sucias o ásperas pueden rayar la pintura.",
            },
            {
                en: "Wash in the shade, not on a hot surface in direct sun.",
                es: "Lava a la sombra, no sobre una superficie caliente bajo el sol directo.",
            },
            {
                en: "Consider a wax or sealant afterwards to protect the polished paint.",
                es: "Considera una cera o un sellador después para proteger la pintura pulida.",
            },
        ],
        faqs: [
            faqCost({ en: "a paint enhancement", es: "un pulido de pintura" }),
            faqTime,
            {
                q: {
                    en: "What's the difference between paint enhancement and paint correction?",
                    es: "¿Cuál es la diferencia entre un pulido de pintura y una corrección de pintura?",
                },
                a: {
                    en: "Paint correction is a multi-stage process aimed at removing as many defects as possible. A paint enhancement uses one polishing stage to improve gloss and reduce light defects, so it's faster and the change is more moderate.",
                    es: "La corrección de pintura es un proceso de varias etapas que busca quitar la mayor cantidad posible de defectos. El pulido de pintura usa una sola etapa para mejorar el brillo y reducir defectos ligeros, así que es más rápido y el cambio es más moderado.",
                },
            },
            {
                q: { en: "Will it remove all scratches?", es: "¿Quita todos los rayones?" },
                a: {
                    en: "No. It softens fine swirl marks and light surface scratches, but deeper scratches and chips need repair.",
                    es: "No. Suaviza los remolinos finos y los rayones ligeros de superficie, pero los rayones profundos y los piquetes necesitan reparación.",
                },
            },
            {
                q: { en: "How long do the results last?", es: "¿Cuánto duran los resultados?" },
                a: {
                    en: "Polishing by itself doesn't add protection. How long the result lasts depends on how the car is washed, where it's parked and whether the paint gets a protective layer afterwards.",
                    es: "El pulido por sí solo no agrega protección. Cuánto dura el resultado depende de cómo se lava el auto, dónde se estaciona y si la pintura recibe una capa protectora después.",
                },
            },
            {
                q: { en: "Is polishing safe for my paint?", es: "¿Es seguro pulir mi pintura?" },
                a: {
                    en: "Polishing removes a very thin layer of clear coat. Done correctly, it is safe, but paint that is already thin or has been polished many times can only take so much.",
                    es: "El pulido quita una capa muy delgada de barniz. Bien hecho es seguro, pero una pintura que ya está delgada o que se ha pulido muchas veces tiene un límite.",
                },
            },
            faqHome,
            faqCharge,
        ],
        bestFor: {
            en: "Dull paint with fine swirl marks",
            es: "Pintura opaca con remolinos finos",
        },
        photos: {
            cover: "/images/services/mobile-car-detailing-04.jpg",
            coverPosition: "50% 60%",
        },
    },
};
