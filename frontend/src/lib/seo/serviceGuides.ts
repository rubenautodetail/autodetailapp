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

export type IconKey = "light" | "night" | "eye" | "sparkle" | "wallet" | "shield" | "car" | "clock";

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
    beforeAfterTitle: L;
    beforeAfterIntro?: L;
    beforeAfter: BeforeAfterPair[];
}

export interface ServiceGuide {
    /** <title> (used as-is, without the site-name suffix). Keep it near 60 characters. */
    seoTitle: L;
    /** Meta description. Keep it near 155 characters after placeholders are filled. */
    metaDescription: L;
    heroSub: L;
    /** Short card next to the hero title. */
    whyTitle: L;
    why: { t: L; d: L }[];
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
        whyTitle: {
            en: "Why restore your headlights",
            es: "Por qué restaurar tus faros",
        },
        why: [
            {
                t: { en: "More light on the road", es: "Más luz en la carretera" },
                d: { en: "Clear lenses let more of the beam through.", es: "Un lente claro deja pasar más luz." },
            },
            {
                t: { en: "Safer at night", es: "Más seguro de noche" },
                d: {
                    en: "You see hazards sooner and have more time to react.",
                    es: "Ves los obstáculos antes y tienes más tiempo para reaccionar.",
                },
            },
            {
                t: { en: "Often cheaper than replacing", es: "Suele costar menos que reemplazar" },
                d: {
                    en: "Surface damage doesn't always mean a new headlight.",
                    es: "El daño en la superficie no siempre requiere un faro nuevo.",
                },
            },
            {
                t: { en: "We come to you", es: "Vamos a ti" },
                d: {
                    en: "Done at your home or office in Miami-Dade.",
                    es: "Lo hacemos en tu casa u oficina en Miami-Dade.",
                },
            },
        ],
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
};
