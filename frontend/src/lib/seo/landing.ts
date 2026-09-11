import type { Locale } from '@/i18n-config';
import { SERVICES, getServiceBySlug, t, type DetailService } from './services';
import { NEIGHBORHOODS, getNeighborhoodBySlug, type Neighborhood } from './locations';

/**
 * Programmatic SEO — content resolver.
 *
 * Turns a (locale, service-slug, city-slug) tuple into everything a landing
 * page + its metadata + its structured data need. All copy is generated
 * bilingually and woven with the target keyword + local context so each URL
 * is a substantive, unique, answer-engine-friendly page.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dtailwash.com';

const CITY_TAGLINE_SUFFIXES: { en: string; es: string }[] = [
    { en: 'Serving {city} and nearby areas.', es: 'Atendemos {city} y zonas cercanas.' },
    { en: 'Proudly serving the {city} community.', es: 'Con orgullo servimos a la comunidad de {city}.' },
    { en: 'Bringing this same care to {city}.', es: 'Llevando este mismo cuidado a {city}.' },
    { en: 'Available for clients across {city}.', es: 'Disponible para clientes en {city}.' },
    { en: 'Trusted by drivers throughout {city}.', es: 'Con la confianza de conductores en {city}.' },
    { en: 'Now serving {city} and the surrounding area.', es: 'Ahora atendemos {city} y sus alrededores.' },
    { en: 'Your neighbors in {city} already trust us.', es: 'Tus vecinos en {city} ya confían en nosotros.' },
    { en: 'Here for drivers in {city}, every day.', es: 'Aquí para los conductores de {city}, todos los días.' },
];

function getCityTaglineSuffix(cityName: string, locale: Locale): string {
    let hash = 0;
    for (let i = 0; i < cityName.length; i++) {
        hash = (hash * 31 + cityName.charCodeAt(i)) % CITY_TAGLINE_SUFFIXES.length;
    }
    const entry = CITY_TAGLINE_SUFFIXES[hash];
    return (locale === 'es' ? entry.es : entry.en).replace('{city}', cityName);
}

export interface Faq {
    q: string;
    a: string;
}

export interface LandingContent {
    locale: Locale;
    service: DetailService;
    neighborhood: Neighborhood;
    /** canonical path for this locale, e.g. /en/mobile-car-detailing/brickell */
    path: string;
    /** absolute alternates for hreflang */
    alternates: { en: string; es: string };
    title: string;
    metaDescription: string;
    h1: string;
    heroEyebrow: string;
    heroSub: string;
    /** concise featured-snippet / AI-answer block */
    quickAnswer: string;
    /** unique local body copy (2 paragraphs) */
    intro: string[];
    priceLabel: string;
    durationLabel: string;
    faqs: Faq[];
    /** path to service image asset */
    imageUrl: string;
    imageUrls?: string[];
}

/** Every (locale, service, city) combination — for generateStaticParams + sitemap. */
export function getAllLandingParams(): { lang: Locale; service: string; city: string }[] {
    const params: { lang: Locale; service: string; city: string }[] = [];
    for (const locale of ['en', 'es'] as Locale[]) {
        for (const service of SERVICES) {
            for (const hood of NEIGHBORHOODS) {
                params.push({ lang: locale, service: service.slug[locale], city: hood.slug });
            }
        }
    }
    return params;
}

export function resolveLanding(
    locale: Locale,
    serviceSlug: string,
    citySlug: string
): LandingContent | null {
    const service = getServiceBySlug(serviceSlug, locale);
    const neighborhood = getNeighborhoodBySlug(citySlug);
    if (!service || !neighborhood) return null;

    const name = t(service.name, locale);
    const kw = t(service.headKeyword, locale);
    const place = neighborhood.name;
    const price = `$${service.priceFrom}`;
    const hrs = service.durationMin >= 60
        ? `${Math.round((service.durationMin / 60) * 10) / 10} ${locale === 'es' ? 'h' : 'hr'}`
        : `${service.durationMin} min`;

    const path = `/${locale}/${service.slug[locale]}/${neighborhood.slug}`;
    const isShopBased = service.id === 'ceramic-coating';
    const alternates = {
        en: `${APP_URL}/en/${service.slug.en}/${neighborhood.slug}`,
        es: `${APP_URL}/es/${service.slug.es}/${neighborhood.slug}`,
    };

    if (locale === 'es') {
        return {
            locale, service, neighborhood, path, alternates,
            title: `${name} en ${place} | Dtailwash — Desde ${price}`,
            metaDescription: isShopBased
                ? `${name} en nuestro taller en Doral. Trae tu auto para un acabado profesional. Atendemos a clientes de ${place} y todo Miami-Dade. Desde ${price}.`
                : `${name} a domicilio en ${place}, Miami-Dade. Nuestro equipo llega a tu casa u oficina. Reserva en línea o por WhatsApp. Desde ${price}.`,
            h1: `${name} en ${place}`,
            heroEyebrow: isShopBased
                ? `En taller · Doral, FL`
                : `A domicilio · ${t(neighborhood.label, locale)}`,
            heroSub: `${t(service.tagline, locale)} ${getCityTaglineSuffix(place, locale)}`,
            quickAnswer: isShopBased
                ? `Dtailwash ofrece ${kw} en nuestro taller en Doral, desde ${price}. Trae tu auto para un ambiente controlado; el servicio dura aproximadamente ${hrs}. Llama o envía un mensaje al 305-988-4449 para agendar tu cita.`
                : `Dtailwash ofrece ${kw} en ${place}, Miami-Dade, desde ${price}. Nuestro equipo llega a tu ubicación; un servicio dura aproximadamente ${hrs}. Reserva en línea o escríbenos por WhatsApp al 305-988-4449.`,
            intro: isShopBased ? [
                `¿Buscas ${kw} en ${place}? Dtailwash ofrece recubrimiento cerámico profesional en nuestro taller en Doral — trae tu auto para un ambiente controlado y libre de polvo que garantiza el mejor acabado posible. Atendemos con orgullo a clientes de todo Miami-Dade, incluyendo ${place}.`,
                `Precios transparentes desde ${price}, pago seguro y atención en español. Llámanos o escríbenos al 305-988-4449 para agendar tu cita en nuestro taller en Doral.`,
            ] : [
                `¿Buscas ${kw} en ${place}? Dtailwash lleva a nuestro equipo verificado hasta la puerta de los residentes de ${place} — sin manejar hasta un taller ni esperar en fila. ${t(neighborhood.blurb, locale)}`,
                `Cubrimos los códigos postales ${neighborhood.zips.slice(0, 4).join(', ')} y zonas cercanas como ${neighborhood.landmarks.join(', ')}. Precios transparentes desde ${price}, pago seguro y atención en español. Reserva tu ${name.toLowerCase()} en menos de 60 segundos.`,
            ],
            priceLabel: `Desde ${price}`,
            durationLabel: `≈ ${hrs}`,
            faqs: buildFaqsEs(service, neighborhood, price, hrs),
            imageUrl: service.imageUrl,
            imageUrls: service.imageUrls,
        };
    }

    return {
        locale, service, neighborhood, path, alternates,
        title: `${name} in ${place} | Dtailwash — From ${price}`,
        metaDescription: isShopBased
            ? `${name} at our Doral facility. Bring your car in for a professional finish. Serving clients from ${place} and all of Miami-Dade. Starting at ${price}.`
            : `${name} in ${place}, Miami-Dade. Our team comes to your home or office — book online in 60 seconds. Transparent pricing from ${price}.`,
        h1: `${name} in ${place}`,
        heroEyebrow: isShopBased
            ? `In-Shop · Doral, FL`
            : `Mobile · ${t(neighborhood.label, locale)}`,
        heroSub: `${t(service.tagline, locale)} ${getCityTaglineSuffix(place, locale)}`,
        quickAnswer: isShopBased
            ? `Dtailwash offers ${kw} at our Doral facility, starting at ${price}. Bring your car in for a controlled environment; the service takes about ${hrs}. Call or text 305-988-4449 to book your appointment.`
            : `Dtailwash offers ${kw} in ${place}, Miami-Dade, starting at ${price}. Our team comes to your location; a typical service takes about ${hrs}. Book online or text us at 305-988-4449.`,
        intro: isShopBased ? [
            `Looking for ${kw} in ${place}? Dtailwash offers professional ceramic coating at our Doral facility — bring your car in for a controlled, dust-free environment that ensures the best possible finish. We proudly serve clients across Miami-Dade, including ${place}.`,
            `Transparent pricing from ${price}, secure payment, and service in English or Spanish. Call or text us at 305-988-4449 to book your appointment at our Doral facility.`,
        ] : [
            `Looking for ${kw} in ${place}? Dtailwash brings our vetted team to ${place} residents' doors — no driving to a shop, no waiting rooms. ${t(neighborhood.blurb, locale)}`,
            `We cover ZIP codes ${neighborhood.zips.slice(0, 4).join(', ')} and nearby areas like ${neighborhood.landmarks.join(', ')}. Transparent pricing from ${price}, secure online payment, and service in English or Spanish. Book your ${name.toLowerCase()} in under 60 seconds.`,
        ],
        priceLabel: `From ${price}`,
        durationLabel: `≈ ${hrs}`,
        faqs: buildFaqsEn(service, neighborhood, price, hrs),
        imageUrl: service.imageUrl,
        imageUrls: service.imageUrls,
    };
}

function buildFaqsEn(s: DetailService, n: Neighborhood, price: string, hrs: string): Faq[] {
    const name = s.name.en.toLowerCase();
    const isShop = s.id === 'ceramic-coating';
    return [
        {
            q: `How much does ${name} cost in ${n.name}?`,
            a: `${s.name.en} in ${n.name} starts at ${price}. Your final quote depends on vehicle size and condition — you'll see transparent pricing before you confirm, with no hidden fees.`,
        },
        {
            q: isShop ? `Do you come to my home, or do I bring my car in?` : `Do you come to my home or office in ${n.name}?`,
            a: isShop
                ? `${s.name.en} is done at our Doral facility, not on-site — you'll bring your car in for a controlled, dust-free environment that ensures the best finish. Call or text 305-988-4449 to book.`
                : `Yes. Dtailwash is fully mobile — our team arrives at your home, office, or building in ${n.name} (ZIPs ${n.zips.slice(0, 3).join(', ')} and nearby) with everything needed to complete the job on-site.`,
        },
        {
            q: `How long does ${name} take?`,
            a: `A typical ${name} takes about ${hrs}. You can keep working or relax while it's done — no waiting room required.`,
        },
        {
            q: isShop ? `Why is ceramic coating done in-shop instead of mobile?` : `Do I need to provide water or power?`,
            a: isShop
                ? `Ceramic coating needs a controlled, dust-free environment for the best results, so we only offer it at our Doral facility rather than on-site.`
                : `No. Our team arrives self-contained with their own water and equipment, so all we need is access to your vehicle in ${n.name}.`,
        },
        {
            q: `Can I book ${name} in Spanish?`,
            a: `Absolutely. Dtailwash is fully bilingual — book online in English or Spanish, or message us directly and someone from our team will take care of you.`,
        },
        {
            q: `When do you charge my card?`,
            a: `You approve the work first — we only charge your card after you confirm everything looks good.`,
        },
    ];
}
function buildFaqsEs(s: DetailService, n: Neighborhood, price: string, hrs: string): Faq[] {
    const name = s.name.es.toLowerCase();
    const isShop = s.id === 'ceramic-coating';
    return [
        {
            q: `¿Cuánto cuesta el ${name} en ${n.name}?`,
            a: `El ${s.name.es.toLowerCase()} en ${n.name} comienza desde ${price}. El precio final depende del tamaño y estado del vehículo — verás el precio claro antes de confirmar, sin cargos ocultos.`,
        },
        {
            q: isShop ? `¿Van hasta mi casa o llevo mi auto?` : `¿Van hasta mi casa u oficina en ${n.name}?`,
            a: isShop
                ? `El ${name} se hace en nuestro taller en Doral, no a domicilio — traes tu auto para un ambiente controlado y libre de polvo que garantiza el mejor acabado. Llama o escribe al 305-988-4449 para agendar.`
                : `Sí. Dtailwash es totalmente a domicilio — nuestro equipo llega a tu casa, oficina o edificio en ${n.name} (códigos ${n.zips.slice(0, 3).join(', ')} y cercanos) con todo lo necesario para hacer el trabajo en el sitio.`,
        },
        {
            q: `¿Cuánto tiempo toma el ${name}?`,
            a: `Un ${name} normal toma aproximadamente ${hrs}. Puedes seguir con tu día mientras lo hacemos — sin salas de espera.`,
        },
        {
            q: isShop ? `¿Por qué el recubrimiento cerámico se hace en taller y no a domicilio?` : `¿Necesito dar agua o electricidad?`,
            a: isShop
                ? `El recubrimiento cerámico necesita un ambiente controlado y libre de polvo para el mejor resultado, por eso solo lo ofrecemos en nuestro taller en Doral.`
                : `No. Nuestro equipo llega con su propia agua y equipo, así que solo necesitamos acceso a tu vehículo en ${n.name}.`,
        },
        {
            q: `¿Puedo reservar por WhatsApp?`,
            a: `Claro. Puedes reservar en línea en segundos o escribirnos por WhatsApp y alguien de nuestro equipo te atenderá directamente.`,
        },
        {
            q: `¿Cuándo cobran mi tarjeta?`,
            a: `Primero apruebas el trabajo — solo cobramos tu tarjeta después de que confirmes que todo está bien.`,
        },
    ];
}
