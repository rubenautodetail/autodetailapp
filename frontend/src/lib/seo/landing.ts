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
    const alternates = {
        en: `${APP_URL}/en/${service.slug.en}/${neighborhood.slug}`,
        es: `${APP_URL}/es/${service.slug.es}/${neighborhood.slug}`,
    };

    if (locale === 'es') {
        return {
            locale, service, neighborhood, path, alternates,
            title: `${name} en ${place} | DTailWash — Desde ${price}`,
            metaDescription: `${name} a domicilio en ${place}, Miami-Dade. Un detallador profesional llega a tu casa u oficina. Reserva en línea o por WhatsApp. Desde ${price}.`,
            h1: `${name} en ${place}`,
            heroEyebrow: `A domicilio · ${t(neighborhood.label, locale)}`,
            heroSub: t(service.tagline, locale),
            quickAnswer: `DTailWash ofrece ${kw} en ${place}, Miami-Dade, desde ${price}. Un detallador verificado llega a tu ubicación; un servicio dura aproximadamente ${hrs}. Reserva en línea o escríbenos por WhatsApp.`,
            intro: [
                `¿Buscas ${kw} en ${place}? DTailWash conecta a los residentes de ${place} con detalladores móviles verificados que llegan hasta tu puerta — sin manejar hasta un taller ni esperar en fila. ${t(neighborhood.blurb, locale)}`,
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
        title: `${name} in ${place} | DTailWash — From ${price}`,
        metaDescription: `${name} in ${place}, Miami-Dade. A vetted detailer comes to your home or office — book online in 60 seconds. Transparent pricing from ${price}.`,
        h1: `${name} in ${place}`,
        heroEyebrow: `Mobile · ${t(neighborhood.label, locale)}`,
        heroSub: t(service.tagline, locale),
        quickAnswer: `DTailWash offers ${kw} in ${place}, Miami-Dade, starting at ${price}. A vetted detailer comes to your location; a typical service takes about ${hrs}. Book online or reserve by text.`,
        intro: [
            `Looking for ${kw} in ${place}? DTailWash connects ${place} residents with vetted mobile detailers who come to your door — no driving to a shop, no waiting rooms. ${t(neighborhood.blurb, locale)}`,
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
    return [
        {
            q: `How much does ${name} cost in ${n.name}?`,
            a: `${s.name.en} in ${n.name} starts at ${price}. Your final quote depends on vehicle size and condition — you'll see transparent pricing before you confirm, with no hidden fees.`,
        },
        {
            q: `Do you come to my home or office in ${n.name}?`,
            a: `Yes. DTailWash is fully mobile — a vetted detailer arrives at your home, office, or building in ${n.name} (ZIPs ${n.zips.slice(0, 3).join(', ')} and nearby) with everything needed to complete the job on-site.`,
        },
        {
            q: `How long does ${name} take?`,
            a: `A typical ${name} takes about ${hrs}. You can keep working or relax while it's done — no waiting room required.`,
        },
        {
            q: `Do I need to provide water or power?`,
            a: `No. Our detailers arrive self-contained with their own water and equipment, so all we need is access to your vehicle in ${n.name}.`,
        },
        {
            q: `Can I book ${name} in Spanish?`,
            a: `Absolutely. DTailWash is fully bilingual — book online in English or Spanish, or message us directly and a Spanish-speaking detailer will take care of you.`,
        },
    ];
}

function buildFaqsEs(s: DetailService, n: Neighborhood, price: string, hrs: string): Faq[] {
    const name = s.name.es.toLowerCase();
    return [
        {
            q: `¿Cuánto cuesta el ${name} en ${n.name}?`,
            a: `El ${s.name.es.toLowerCase()} en ${n.name} comienza desde ${price}. El precio final depende del tamaño y estado del vehículo — verás el precio claro antes de confirmar, sin cargos ocultos.`,
        },
        {
            q: `¿Van hasta mi casa u oficina en ${n.name}?`,
            a: `Sí. DTailWash es totalmente a domicilio — un detallador verificado llega a tu casa, oficina o edificio en ${n.name} (códigos ${n.zips.slice(0, 3).join(', ')} y cercanos) con todo lo necesario para hacer el trabajo en el sitio.`,
        },
        {
            q: `¿Cuánto tiempo toma el ${name}?`,
            a: `Un ${name} normal toma aproximadamente ${hrs}. Puedes seguir con tu día mientras lo hacemos — sin salas de espera.`,
        },
        {
            q: `¿Necesito dar agua o electricidad?`,
            a: `No. Nuestros detalladores llegan con su propia agua y equipo, así que solo necesitamos acceso a tu vehículo en ${n.name}.`,
        },
        {
            q: `¿Puedo reservar por WhatsApp?`,
            a: `Claro. Puedes reservar en línea en segundos o escribirnos por WhatsApp y un detallador que habla español te atenderá directamente.`,
        },
    ];
}
