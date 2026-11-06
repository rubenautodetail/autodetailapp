import type { BlogPost } from "../types";

/**
 * Question: "How much does mobile car detailing cost in Miami?"
 * Search data (SearchVector, US/month): car detailing prices 8.1K; car detailing near me prices 2.4K;
 * interior car detailing prices 480; interior car detailing near me prices 260; lavado de autos a domicilio precios 70.
 * Prices = "from" prices on dtailwash.com (Nov 2026). Update this file if a price changes.
 */
export const mobileDetailingCostMiami: BlogPost = {
    id: "mobile-detailing-cost-miami",
    slug: {
        en: "how-much-does-mobile-car-detailing-cost-in-miami",
        es: "cuanto-cuesta-lavar-un-carro-a-domicilio-en-miami",
    },
    title: {
        en: "How Much Does Mobile Car Detailing Cost in Miami?",
        es: "¿Cuánto cuesta lavar un carro a domicilio en Miami?",
    },
    seoTitle: {
        en: "Mobile Car Detailing Prices in Miami (2026 Guide)",
        es: "Precios de Lavado de Carros a Domicilio en Miami (2026)",
    },
    description: {
        en: "Real 2026 prices for mobile car detailing in Miami-Dade: express wash, interior, seat shampoo, full detail and more, plus what changes the final price.",
        es: "Precios reales 2026 de lavado y detallado de carros a domicilio en Miami-Dade: express, interior, asientos, completo y más, y qué cambia el precio final.",
    },
    category: "tips",
    published: "2026-11-05",
    cover: {
        src: "/images/services/express-detail-01.jpg",
        alt: {
            en: "Mobile car detailing at a customer's home in Miami",
            es: "Lavado de carro a domicilio en Miami",
        },
    },
    quickAnswer: {
        en: "In Miami-Dade, a mobile express wash with interior vacuum starts at **$70**. An interior detail, a seat and carpet shampoo or an exterior hand wash & wax start at **$200**, and a full detail inside and out starts at **$400**. The final price depends on the size and condition of your vehicle, and you see it before you confirm.",
        es: "En Miami-Dade, un lavado express a domicilio con aspirado interior cuesta desde **$70**. Una limpieza interior, un lavado de asientos y alfombras o un lavado exterior a mano con cera cuestan desde **$200**, y un lavado completo por dentro y por fuera desde **$400**. El precio final depende del tamaño y del estado del carro, y lo ves antes de confirmar.",
    },
    body: [
        { type: "h2", text: { en: "Prices by service", es: "Precios por servicio" } },
        {
            type: "p",
            text: {
                en: "These are our starting prices for 2026. All of them are done at your home, office or building anywhere in Miami-Dade, except ceramic coating, which is applied at our Doral shop.",
                es: "Estos son nuestros precios de partida en 2026. Todos se hacen en tu casa, oficina o edificio en cualquier parte de Miami-Dade, menos el recubrimiento cerámico, que se aplica en nuestro taller de Doral.",
            },
        },
        {
            type: "table",
            head: [
                { en: "Service", es: "Servicio" },
                { en: "From", es: "Desde" },
                { en: "Best for", es: "Ideal para" },
            ],
            rows: [
                [
                    { en: "[Express Detail](/en/services/express-detail)", es: "[Lavado Express](/es/services/detallado-express)" },
                    { en: "$70", es: "$70" },
                    { en: "A quick refresh: hand wash, interior vacuum and wipe-down (about 80 min)", es: "Una renovación rápida: lavado a mano, aspirado y limpieza interior (unos 80 min)" },
                ],
                [
                    { en: "[Headlight Restoration](/en/services/headlight-restoration)", es: "[Pulido de Faros](/es/services/restauracion-de-faros)" },
                    { en: "$100", es: "$100" },
                    { en: "Yellow or foggy headlights", es: "Faros amarillos u opacos" },
                ],
                [
                    { en: "[Interior Detail](/en/services/interior-detail)", es: "[Limpieza Interior](/es/services/detallado-interior)" },
                    { en: "$200", es: "$200" },
                    { en: "A deep clean of the whole cabin", es: "Una limpieza profunda de toda la cabina" },
                ],
                [
                    { en: "[Car Interior Shampoo](/en/services/car-interior-shampoo)", es: "[Lavado de Asientos y Alfombras](/es/services/lavado-de-asientos-y-alfombras)" },
                    { en: "$200", es: "$200" },
                    { en: "Stains and odors in fabric seats, carpets, headliner and trunk", es: "Manchas y olores en asientos de tela, alfombras, techo y maletero" },
                ],
                [
                    { en: "[Exterior Hand Wash & Wax](/en/services/exterior-detail)", es: "[Lavado Exterior y Encerado](/es/services/detallado-exterior)" },
                    { en: "$200", es: "$200" },
                    { en: "Water spots and dull paint", es: "Manchas de agua y pintura opaca" },
                ],
                [
                    { en: "[1-Step Paint Correction](/en/services/paint-enhancement)", es: "[Pulido de Pintura](/es/services/pulido)" },
                    { en: "$300", es: "$300" },
                    { en: "Swirl marks and dull paint (one-step polish)", es: "Marcas de remolino y pintura opaca (pulido de un paso)" },
                ],
                [
                    { en: "[Full Detail](/en/services/full-detail)", es: "[Lavado Completo](/es/services/detallado-completo)" },
                    { en: "$400", es: "$400" },
                    { en: "Inside and outside in one visit", es: "Por dentro y por fuera en una sola visita" },
                ],
                [
                    { en: "[Ceramic Coating](/en/ceramic-coating/doral)", es: "[Recubrimiento Cerámico](/es/recubrimiento-ceramico/doral)" },
                    { en: "$999", es: "$999" },
                    { en: "Years of paint protection, with paint correction included (Doral shop, about 24 h)", es: "Años de protección para la pintura, con corrección de pintura incluida (taller de Doral, unas 24 h)" },
                ],
            ],
        },
        { type: "h2", text: { en: "What changes the final price", es: "Qué cambia el precio final" } },
        {
            type: "list",
            items: [
                {
                    en: "**Vehicle size.** An SUV, truck or minivan has more surface and more interior than a compact car.",
                    es: "**El tamaño del vehículo.** Una SUV, una camioneta o una minivan tienen más superficie y más interior que un carro compacto.",
                },
                {
                    en: "**Condition.** Heavy dirt, pet hair, sand or old stains take more time than a car that gets regular care.",
                    es: "**El estado.** La suciedad acumulada, el pelo de mascota, la arena o las manchas viejas llevan más tiempo que un carro que se cuida seguido.",
                },
                {
                    en: "**What you need.** A quick refresh and a deep clean are different jobs. Choosing the right service is the easiest way to avoid paying for more than you need.",
                    es: "**Lo que necesitas.** Una renovación rápida y una limpieza profunda son trabajos distintos. Elegir bien el servicio es la forma más fácil de no pagar de más.",
                },
            ],
        },
        {
            type: "callout",
            title: { en: "No surprises", es: "Sin sorpresas" },
            text: {
                en: "You see the price before you confirm, and you pay only after you approve the finished work.",
                es: "Ves el precio antes de confirmar y pagas solo después de aprobar el trabajo terminado.",
            },
        },
        { type: "h2", text: { en: "How to choose the right service", es: "Cómo elegir el servicio correcto" } },
        {
            type: "list",
            items: [
                {
                    en: "Your car just needs to look clean again → **Express Detail**.",
                    es: "Solo quieres que el carro vuelva a verse limpio → **Lavado Express**.",
                },
                {
                    en: "The inside is what bothers you: dust, crumbs, sticky console → **Interior Detail**.",
                    es: "Lo que te molesta es el interior: polvo, migajas, consola pegajosa → **Limpieza Interior**.",
                },
                {
                    en: "Your fabric seats or carpets have stains or odors → **Car Interior Shampoo**.",
                    es: "Tus asientos de tela o alfombras tienen manchas u olores → **Lavado de Asientos y Alfombras**.",
                },
                {
                    en: "Your paint looks dull or has swirl marks → **1-Step Paint Correction**.",
                    es: "Tu pintura se ve opaca o tiene marcas de remolino → **Pulido de Pintura**.",
                },
                {
                    en: "You want inside and outside done in one visit → **Full Detail**.",
                    es: "Quieres el interior y el exterior en una sola visita → **Lavado Completo**.",
                },
                {
                    en: "You want long-term protection against the Miami sun → **Ceramic Coating**.",
                    es: "Quieres protección duradera contra el sol de Miami → **Recubrimiento Cerámico**.",
                },
            ],
        },
    ],
    faqs: [
        {
            q: { en: "Do you need my water or electricity?", es: "¿Necesitan mi agua o electricidad?" },
            a: {
                en: "No. We arrive self-contained with our own water and equipment, so all we need is access to your vehicle.",
                es: "No. Llegamos con nuestra propia agua y equipo, así que solo necesitamos acceso a tu vehículo.",
            },
        },
        {
            q: { en: "When do I pay?", es: "¿Cuándo pago?" },
            a: {
                en: "You approve the work first. We only charge your card after you confirm everything looks good.",
                es: "Primero apruebas el trabajo. Solo cobramos tu tarjeta después de que confirmes que todo se ve bien.",
            },
        },
        {
            q: { en: "Is mobile detailing more expensive than a shop?", es: "¿Lavar el carro a domicilio sale más caro que en un taller?" },
            a: {
                en: "It depends on the shop, but with mobile detailing you don't spend time driving there and waiting. For many people that time is worth more than any price difference.",
                es: "Depende del taller, pero a domicilio no pierdes tiempo manejando ni esperando. Para mucha gente ese tiempo vale más que cualquier diferencia de precio.",
            },
        },
        {
            q: { en: "Which areas do you cover?", es: "¿A qué zonas van?" },
            a: {
                en: "We work all over Miami-Dade, including Miami, Doral, Kendall, Hialeah, Miami Beach, Coral Gables and more. See all our [locations](/en/locations).",
                es: "Trabajamos en todo Miami-Dade, incluidos Miami, Doral, Kendall, Hialeah, Miami Beach, Coral Gables y más. Mira todas las [zonas](/es/locations).",
            },
        },
    ],
    cta: {
        title: { en: "Ready for us to come to you?", es: "¿Listo para que vayamos a ti?" },
        text: {
            en: "Book online in a few minutes and pay only after you approve the work.",
            es: "Reserva en línea en pocos minutos y paga solo cuando apruebes el trabajo.",
        },
        href: { en: "/en/booking/select", es: "/es/booking/select" },
        label: { en: "See prices and book", es: "Ver precios y reservar" },
    },
};
