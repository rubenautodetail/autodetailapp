import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { i18n, type Locale } from '@/i18n-config';
import { getDictionary } from '@/lib/dictionaries';
import ZipChecker from '@/components/ZipChecker/ZipChecker';
import JsonLd from '@/components/seo/JsonLd';
import { Check, MapPin, X } from 'lucide-react';
import { getAllLandingParams, resolveLanding } from '@/lib/seo/landing';
import { SERVICES, t } from '@/lib/seo/services';
import { NEIGHBORHOODS, getNearbyNeighborhoods } from '@/lib/seo/locations';
import { SERVICE_GUIDES, type L } from '@/lib/seo/serviceGuides';
import {
    getCityServiceBusinessSchema,
    getFaqSchema,
    getBreadcrumbSchema,
} from '@/lib/seo/schema';

export const dynamicParams = false;

export function generateStaticParams() {
    return getAllLandingParams();
}

function formatDuration(minutes: number, locale: Locale): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    const hourLabel = locale === 'es' ? 'h' : 'hr';
    if (hours === 0) return `${rest} min`;
    return rest === 0 ? `${hours} ${hourLabel}` : `${hours} ${hourLabel} ${rest} min`;
}

function durationPhrase(minutes: number, locale: Locale): string {
    return locale === 'es' ? `aproximadamente ${formatDuration(minutes, locale)}` : `about ${formatDuration(minutes, locale)}`;
}

function fill(text: string, vars: { price: string; duration: string }): string {
    return text.split('{price}').join(vars.price).split('{duration}').join(vars.duration);
}

function normalize(lang: string): Locale {
    return i18n.locales.includes(lang as Locale) ? (lang as Locale) : 'en';
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string; service: string; city: string }>;
}): Promise<Metadata> {
    const { lang, service, city } = await params;
    const locale = normalize(lang);
    const content = resolveLanding(locale, service, city);
    if (!content) return {};
    return {
        title: { absolute: content.title },
        description: content.metaDescription,
        alternates: {
            canonical: content.path,
            languages: {
                en: `/en/${content.service.slug.en}/${content.neighborhood.slug}`,
                es: `/es/${content.service.slug.es}/${content.neighborhood.slug}`,
            },
        },
        openGraph: {
            type: 'website',
            title: content.title,
            description: content.metaDescription,
            url: content.path,
            locale: locale === 'es' ? 'es_ES' : 'en_US',
        },
    };
}

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER; // digits only, e.g. 13055551234

export default async function ServiceCityPage({
    params,
}: {
    params: Promise<{ lang: string; service: string; city: string }>;
}) {
    const { lang, service: serviceSlug, city } = await params;
    const locale = normalize(lang);
    const content = resolveLanding(locale, serviceSlug, city);
    if (!content) notFound();

    const { service, neighborhood } = content;
    const dict = await getDictionary(locale);
    const es = locale === 'es';

    const bookHref = `/${locale}/booking/select`;
    const waText = encodeURIComponent(
        es
            ? `Hola, quiero ${service.name.es} en ${neighborhood.name}.`
            : `Hi, I'd like ${service.name.en} in ${neighborhood.name}.`
    );
    const waHref = WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${waText}` : null;

    const otherServices = SERVICES.filter((s) => s.id !== service.id);
    // The city catalog and the educational guides were named independently, so a
    // couple of ids differ even though they're the same service — map those here
    // rather than renaming either catalog (renaming would change live URLs).
    const GUIDE_KEY_BY_SERVICE_ID: Record<string, string> = {
        'interior-detailing': 'interior-detail',
        'exterior-detailing': 'exterior-detail',
    };
    const guideKeyFor = (id: string) => GUIDE_KEY_BY_SERVICE_ID[id] ?? id;
    const showBestFor = SERVICES.every((s) => SERVICE_GUIDES[guideKeyFor(s.id)]);
    const guide = SERVICE_GUIDES[guideKeyFor(service.id)];
    const guideVars = { price: `$${service.priceFrom}`, duration: durationPhrase(service.durationMin, locale) };
    const tg = (text: L): string => fill(text[locale], guideVars);
    const gallery = content.imageUrls && content.imageUrls.length > 1 ? content.imageUrls : [content.imageUrl];
    const steps = es
        ? [
            { title: 'Reserva en 60 segundos', text: `Elige tu servicio y confirma tu dirección en ${neighborhood.name}.` },
            { title: 'Llegamos a tu puerta', text: 'Nuestro equipo llega con todo el equipo necesario — tú no mueves nada.' },
            { title: 'Revisa y aprueba', text: 'Solo pagas cuando apruebas el trabajo terminado.' },
        ]
        : [
            { title: 'Book in 60 seconds', text: `Pick your service and confirm your address in ${neighborhood.name}.` },
            { title: 'We come to your door', text: "Our team arrives fully equipped — you don't lift a finger." },
            { title: 'Review and approve', text: 'You only pay once you approve the finished job.' },
        ];
    const nearby = getNearbyNeighborhoods(neighborhood.slug, 5);

    const breadcrumbs = getBreadcrumbSchema(
        [
            { name: es ? 'Inicio' : 'Home', path: '' },
            { name: t(service.name, locale), path: `/${service.slug[locale]}/${neighborhood.slug}` },
        ],
        locale
    );

    return (
        <main className="min-h-screen bg-[#131835] text-white">
            <JsonLd
                data={[
                    getCityServiceBusinessSchema(
                        dict.common.siteName,
                        t(service.name, locale),
                        content.metaDescription,
                        neighborhood.name,
                        content.alternates[locale],
                        service.priceFrom
                    ),
                    getFaqSchema(content.faqs),
                    breadcrumbs,
                ]}
            />

            <style>{`
                @keyframes dtwRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
                .dtw-rise { animation: dtwRise .7s cubic-bezier(.2,.7,.2,1) both; }
            `}</style>

            {/* ── Header ─────────────────────────────────────────────── */}
            <header className="sticky top-0 z-30 border-b border-white/5 bg-[#131835]/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link href={`/${locale}`} className="flex items-center gap-2">
                        <Image src="/dtailwash_logo_final.png" alt="Lux Auto Detail Services"  width={1942} height={809} className="h-8 w-auto" style={{ width: 'auto' }} priority />
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href={`/${es ? 'en' : 'es'}/${service.slug[es ? 'en' : 'es']}/${neighborhood.slug}`}
                            className="text-xs uppercase tracking-widest text-white/50 transition-colors hover:text-white">
                            {es ? 'EN' : 'ES'}
                        </Link>
                        {waHref && (
                            <a href={waHref} className="hidden rounded-full bg-[#25D366] px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03] sm:inline-block">
                                WhatsApp
                            </a>
                        )}
                        <Link href={bookHref}
                            className="rounded-full bg-[#D0B078] px-5 py-2 text-sm font-semibold text-[#131835] shadow-[0_0_24px_rgba(208,176,120,0.25)] transition-transform hover:scale-[1.03]">
                            {es ? 'Reservar' : 'Book now'}
                        </Link>
                    </div>
                </div>
            </header>

            {/* ── Hero: centered local-landing style ──────────────────── */}
            <section className="relative overflow-hidden px-6 pt-14 pb-10 sm:pt-20">
                <div className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_90%_at_50%_-10%,rgba(208,176,120,0.14),transparent_60%)]" />
                <div className="relative mx-auto max-w-5xl text-center">
                    <div className="dtw-rise mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-[#D0B078]/30 bg-[#D0B078]/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#D0B078]" style={{ animationDelay: '0ms' }}>
                        <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                        {es ? `Ahora sirviendo ${neighborhood.name}` : `Now serving ${neighborhood.name}`}
                    </div>
                    <h1 className="dtw-rise text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl" style={{ fontFamily: 'var(--font-display)', animationDelay: '80ms' }}>
                        {content.h1}
                    </h1>
                    <p className="dtw-rise mx-auto mt-4 max-w-xl text-lg font-light leading-relaxed text-white/75" style={{ animationDelay: '140ms' }}>
                        {content.heroSub}
                    </p>

                    <div className="dtw-rise mx-auto mt-8 flex max-w-lg flex-col items-center justify-between gap-4 rounded-2xl border border-[#D0B078]/25 bg-white/[0.03] px-6 py-5 sm:flex-row" style={{ animationDelay: '200ms' }}>
                        <div className="text-left">
                            <p className="text-xs uppercase tracking-widest text-[#D0B078]">{es ? `Precio en ${neighborhood.name}` : `${neighborhood.name} pricing`}</p>
                            <p className="text-2xl font-bold">{content.priceLabel} <span className="text-sm font-normal text-white/50">· {content.durationLabel}</span></p>
                        </div>
                        <div className="flex gap-2">
                            {waHref && (
                                <a href={waHref} className="rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]">WhatsApp</a>
                            )}
                            <Link href={bookHref} className="rounded-full bg-[#D0B078] px-5 py-2.5 text-sm font-semibold text-[#131835] shadow-[0_0_24px_rgba(208,176,120,0.25)] transition-transform hover:scale-[1.03]">
                                {es ? 'Reservar' : 'Book now'}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Photo gallery: local proof, dedicated strip ─────────── */}
            <section className="px-6 pb-4">
                <div className="mx-auto max-w-5xl">
                    <p className="mb-4 text-center text-xs uppercase tracking-widest text-[#D0B078]">
                        {es ? `Trabajo reciente en ${neighborhood.name}` : `Recent work in ${neighborhood.name}`}
                    </p>
                    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 gold-scrollbar">
                        {gallery.map((src, i) => (
                            <div key={src} className="relative aspect-[4/3] w-64 shrink-0 snap-start overflow-hidden rounded-2xl sm:w-80">
                                <Image
                                    src={src}
                                    alt={es ? `${service.name.es} en ${neighborhood.name} ${i + 1}` : `${service.name.en} in ${neighborhood.name} ${i + 1}`}
                                    fill
                                    sizes="(min-width: 640px) 320px, 256px"
                                    priority={i === 0}
                                    className="object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How it works ─────────────────────────────────────────── */}
            <section className="border-y border-white/5 bg-white/[0.015] px-6 py-14 sm:py-20">
                <div className="mx-auto max-w-4xl">
                    <h2 className="mb-10 text-center text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                        {es ? 'Cómo funciona' : 'How it works'}
                    </h2>
                    <div className="grid gap-8 sm:grid-cols-3">
                        {steps.map((s, i) => (
                            <div key={s.title} className="text-center">
                                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#D0B078] text-sm font-bold text-[#131835]">
                                    {i + 1}
                                </div>
                                <h3 className="mb-1.5 text-base font-semibold">{s.title}</h3>
                                <p className="text-sm leading-relaxed text-white/60">{s.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Also in this city: quick links to the other 5 services, as a moving strip ── */}
            <section
                className="overflow-hidden border-b border-white/5 bg-white/[0.01] py-10 sm:py-12"
                aria-labelledby="also-in-city-heading"
            >
                <div className="mb-7 space-y-2 px-6 text-center">
                    <p id="also-in-city-heading" className="text-xs font-medium uppercase tracking-widest text-[#D0B078]">
                        {es ? `Más servicios en ${neighborhood.name}` : `More services in ${neighborhood.name}`}
                    </p>
                </div>
                <div className="[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
                    <div className="flex w-max animate-brand-marquee hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:justify-center">
                        {[0, 1].map((groupIndex) => (
                            <ul
                                key={groupIndex}
                                className={`flex shrink-0 items-center gap-10 pr-10 sm:gap-14 sm:pr-14 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-6 motion-reduce:pr-0 ${groupIndex === 1 ? 'motion-reduce:hidden' : ''}`}
                                aria-hidden={groupIndex === 1 ? true : undefined}
                            >
                                {otherServices.map((s) => (
                                    <li key={`${groupIndex}-${s.id}`} className="shrink-0">
                                        <Link
                                            href={`/${locale}/${s.slug[locale]}/${neighborhood.slug}`}
                                            className="whitespace-nowrap text-sm font-medium text-white/60 transition-colors hover:text-[#D0B078]"
                                            tabIndex={groupIndex === 1 ? -1 : undefined}
                                        >
                                            {t(s.name, locale)}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Quick answer (featured-snippet / AI answer) ─────────── */}
            <section className="px-6">
                <div className="mx-auto max-w-3xl rounded-2xl border border-[#D0B078]/20 bg-white/[0.02] p-6 sm:p-8">
                    <p className="mb-2 text-xs uppercase tracking-widest text-[#D0B078]">{es ? 'En resumen' : 'Quick answer'}</p>
                    <p className="text-lg leading-relaxed text-white/85">{content.quickAnswer}</p>
                </div>
            </section>

            {/* ── What it is + what it can and can't fix (only for services with a full guide) ── */}
            {guide && (
                <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[1.2fr_1fr]">
                    <div>
                        <h2 className="text-2xl font-semibold sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
                            {tg(guide.scienceTitle)}
                        </h2>
                        <div className="mt-5 max-w-prose space-y-4 text-white/80">
                            {guide.science.map((p, i) => <p key={i}>{tg(p)}</p>)}
                        </div>
                    </div>
                    <div className="space-y-6 self-start rounded-2xl border border-[#2C355E] bg-[#151B3A] p-6">
                        <div>
                            <h3 className="font-semibold text-[#D0B078]">{tg(guide.limits.canTitle)}</h3>
                            <ul className="mt-3 space-y-2.5 text-white/80">
                                {guide.limits.can.map((item, i) => (
                                    <li key={i} className="flex gap-3"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[#D0B078]" /><span>{tg(item)}</span></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold">{tg(guide.limits.cannotTitle)}</h3>
                            <ul className="mt-3 space-y-2.5 text-white/70">
                                {guide.limits.cannot.map((item, i) => (
                                    <li key={i} className="flex gap-3"><X aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-white/50" /><span>{tg(item)}</span></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Local intro copy ────────────────────────────────────── */}
            <section className="px-6 py-14 sm:py-20">
                <div className="mx-auto max-w-3xl space-y-5">
                    {content.intro.map((p, i) => (
                        <p key={i} className="text-base leading-relaxed text-white/70">{p}</p>
                    ))}
                </div>
            </section>

            {/* ── What's included ─────────────────────────────────────── */}
            <section className="border-y border-white/5 bg-white/[0.015] px-6 py-14 sm:py-24">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-10 space-y-3 text-center">
                        <p className="text-xs uppercase tracking-widest text-[#D0B078]">{es ? 'Qué incluye' : 'What’s included'}</p>
                        <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                            {es ? `Tu ${service.name.es}` : `Your ${service.name.en}`}
                        </h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {service.includes.map((item) => (
                            <div key={item.en} className="glass-card flex items-center gap-3 rounded-xl px-5 py-4">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D0B078]/15 text-xs text-[#D0B078]">✓</span>
                                <span className="text-sm text-white/85">{t(item, locale)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Why Lux ───────────────────────────────────────── */}
            <section className="px-6 py-14 sm:py-24">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-10 space-y-3 text-center">
                        <p className="text-xs uppercase tracking-widest text-[#D0B078]">{es ? 'Por qué Lux' : 'Why Lux'}</p>
                        <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                            {es ? 'Detallado sin complicaciones' : 'Detailing without the hassle'}
                        </h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {[
                            { icon: service.id === 'ceramic-coating' ? '🏭' : '🚐', t: es ? (service.id === 'ceramic-coating' ? 'Trae tu auto' : 'Vamos a ti') : (service.id === 'ceramic-coating' ? 'Bring your car in' : 'We come to you'), d: es ? (service.id === 'ceramic-coating' ? 'Visítanos en nuestro taller en Doral.' : `A tu casa u oficina en ${neighborhood.name}.`) : (service.id === 'ceramic-coating' ? 'Visit our facility in Doral.' : `To your home or office in ${neighborhood.name}.`) },
                            { icon: '🛡️', t: es ? 'Verificados y asegurados' : 'Vetted & insured', d: es ? 'Cada miembro de nuestro equipo es revisado y asegurado.' : 'Every team member is background-checked and insured.' },
                            { icon: '💳', t: es ? 'Precio transparente' : 'Transparent pricing', d: es ? 'Ves el precio antes de confirmar. Sin sorpresas.' : 'See your price before you confirm. No surprises.' },
                            { icon: '🗣️', t: es ? 'Bilingüe' : 'Bilingual', d: es ? 'Reserva y atención en español o inglés.' : 'Book and get service in English or Spanish.' },
                            { icon: '⭐', t: es ? '5.0 de calificación' : '5.0 average rating', d: es ? 'Más de 90 detalles completados.' : 'Over 90 details completed.' },
                            { icon: '📱', t: es ? 'Reserva en 60s' : 'Book in 60s', d: es ? 'En línea o por WhatsApp, cuando quieras.' : 'Online or by text, whenever you want.' },
                        ].map((v) => (
                            <div key={v.t} className="glass-card rounded-2xl p-6">
                                <div className="mb-3 text-2xl">{v.icon}</div>
                                <h3 className="mb-1.5 text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{v.t}</h3>
                                <p className="text-sm leading-relaxed text-white/60">{v.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ZIP check CTA ───────────────────────────────────────── */}
            <section className="border-y border-white/5 bg-white/[0.02] px-6 py-14 sm:py-20">
                <div className="mx-auto max-w-2xl space-y-6 text-center">
                    <h2 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
                        {es ? `¿Estás en ${neighborhood.name}?` : `Are you in ${neighborhood.name}?`}
                    </h2>
                    <p className="text-white/60">{es ? 'Verifica tu código postal y reserva en segundos.' : 'Check your ZIP and book in seconds.'}</p>
                    <div className="mx-auto max-w-lg"><ZipChecker dict={dict.zipChecker} lang={locale} /></div>
                </div>
            </section>

            {/* ── FAQ (GEO / answer-engine) ───────────────────────────── */}
            <section className="px-6 py-14 sm:py-24">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-10 space-y-3 text-center">
                        <p className="text-xs uppercase tracking-widest text-[#D0B078]">{es ? 'Preguntas frecuentes' : 'FAQ'}</p>
                        <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                            {es ? `${service.name.es} en ${neighborhood.name}` : `${service.name.en} in ${neighborhood.name}`}
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {content.faqs.map((f) => (
                            <details key={f.q} className="group glass-card rounded-xl px-5 py-4">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-white/90">
                                    {f.q}
                                    <span className="text-[#D0B078] transition-transform group-open:rotate-45">+</span>
                                </summary>
                                <p className="mt-3 text-sm leading-relaxed text-white/65">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Internal-link mesh (topic cluster) ──────────────────── */}
            <section className="border-t border-white/5 px-6 py-14">
                <div className="mx-auto max-w-5xl grid gap-10 sm:grid-cols-2">
                    <div>
                        <p className="mb-4 text-xs uppercase tracking-widest text-[#D0B078]">{es ? 'Otros servicios en ' : 'Other services in '}{neighborhood.name}</p>
                        <ul className="space-y-2">
                            {otherServices.map((s) => (
                                <li key={s.id}>
                                    <Link href={`/${locale}/${s.slug[locale]}/${neighborhood.slug}`} className="text-sm text-white/70 underline-offset-4 hover:text-[#D0B078] hover:underline">
                                        {t(s.name, locale)} — {neighborhood.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <p className="mb-4 text-xs uppercase tracking-widest text-[#D0B078]">{es ? `${service.name.es} en otras zonas` : `${service.name.en} in nearby areas`}</p>
                        <ul className="space-y-2">
                            {nearby.map((n) => (
                                <li key={n.slug}>
                                    <Link href={`/${locale}/${service.slug[locale]}/${n.slug}`} className="text-sm text-white/70 underline-offset-4 hover:text-[#D0B078] hover:underline">
                                        {t(service.name, locale)} — {n.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* ── Areas we serve: every neighborhood, for this same service ── */}
            <section className="mx-auto max-w-5xl px-6 py-12">
                <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                    {es ? 'Zonas donde trabajamos' : 'Areas we serve'}
                </h2>
                <p className="mt-3 max-w-xl text-white/70">
                    {es
                        ? 'Reserva este servicio en cualquier zona de Miami-Dade. Elige la tuya para ver los detalles de tu vecindario.'
                        : 'Book this service anywhere in Miami-Dade. Pick your area to see details for your neighborhood.'}
                </p>
                <ul className="mt-6 flex flex-wrap gap-2">
                    {NEIGHBORHOODS.map((n) => (
                        <li key={n.slug}>
                            <Link
                                href={`/${locale}/${service.slug[locale]}/${n.slug}`}
                                className={`inline-block rounded-full border px-4 py-2 text-sm transition-colors hover:border-[#D0B078]/60 hover:text-white ${n.slug === neighborhood.slug ? 'border-[#D0B078] text-[#D0B078]' : 'border-[#2C355E] text-white/85'}`}
                            >
                                {n.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>

            {/* ── Compare services ─────────────────────────────────────── */}
            <section className="mx-auto max-w-5xl px-6 py-12">
                <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                    {es ? '¿Qué servicio es para ti?' : 'Which service fits you?'}
                </h2>
                <p className="mt-3 max-w-xl text-white/70">
                    {es ? 'Compara el tiempo y el precio de cada servicio.' : 'Compare the time and starting price of each service.'}
                </p>
                <div className="mt-6 overflow-x-auto rounded-2xl border border-[#2C355E]">
                    <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                        <caption className="sr-only">{es ? 'Comparación de servicios' : 'Service comparison'}</caption>
                        <thead className="bg-[#0f1430] text-white/70">
                            <tr>
                                <th scope="col" className="px-4 py-3 font-medium">{es ? 'Servicio' : 'Service'}</th>
                                <th scope="col" className="px-4 py-3 font-medium">{es ? 'Tiempo' : 'Time'}</th>
                                <th scope="col" className="px-4 py-3 font-medium">{es ? 'Desde' : 'From'}</th>
                                {showBestFor && <th scope="col" className="px-4 py-3 font-medium">{es ? 'Ideal para' : 'Best for'}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {SERVICES.map((s) => {
                                const isCurrent = s.id === service.id;
                                const rowGuide = SERVICE_GUIDES[guideKeyFor(s.id)];
                                return (
                                    <tr key={s.id} className={`border-t border-[#2C355E] ${isCurrent ? 'bg-[#D0B078]/10' : ''}`}>
                                        <th scope="row" className="px-4 py-3 font-medium">
                                            {isCurrent ? (
                                                <span className="text-[#D0B078]">{t(s.name, locale)}<span className="sr-only">{es ? ' (página actual)' : ' (current page)'}</span></span>
                                            ) : (
                                                <Link href={`/${locale}/${s.slug[locale]}/${neighborhood.slug}`} className="rounded underline-offset-4 hover:underline">
                                                    {t(s.name, locale)}
                                                </Link>
                                            )}
                                        </th>
                                        <td className="px-4 py-3 text-white/80">{formatDuration(s.durationMin, locale)}</td>
                                        <td className="px-4 py-3 text-white/80">${s.priceFrom}</td>
                                        {showBestFor && <td className="px-4 py-3 text-white/70">{rowGuide ? rowGuide.bestFor[locale] : ''}</td>}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ── Final CTA ───────────────────────────────────────────── */}
            <section className="px-6 pb-20 pt-6">
                <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[#D0B078]/20 bg-gradient-to-br from-[#1A2142] to-[#131835] px-8 py-14 text-center">
                    <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                        {es ? `${service.name.es} en ${neighborhood.name}, hoy` : `${service.name.en} in ${neighborhood.name}, today`}
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-white/60">
                        {service.id === 'ceramic-coating'
                            ? (es ? `Desde ${content.priceLabel.replace('Desde ', '')} · en nuestro taller en Doral.` : `${content.priceLabel} · at our Doral facility.`)
                            : (es ? `Desde ${content.priceLabel.replace('Desde ', '')} · vamos a tu ubicación.` : `${content.priceLabel} · we come to your location.`)}
                    </p>
                    <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link href={bookHref} className="rounded-full bg-[#D0B078] px-8 py-3 text-sm font-semibold text-[#131835] shadow-[0_0_24px_rgba(208,176,120,0.25)] transition-transform hover:scale-[1.03]">
                            {es ? 'Reservar ahora' : 'Book now'}
                        </Link>
                        {waHref && (
                            <a href={waHref} className="rounded-full border border-white/15 px-8 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5">
                                WhatsApp
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <footer className="border-t border-white/5 px-6 py-10">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-white/40 sm:flex-row">
                    <span>© {new Date().getFullYear()} Lux Auto Detail Services · {es ? 'Detallado móvil en Miami-Dade' : 'Mobile detailing in Miami-Dade'}</span>
                    <div className="flex gap-4">
                        <Link href={`/${locale}`} className="hover:text-white">{es ? 'Inicio' : 'Home'}</Link>
                        <Link href={`/${locale}/contractors`} className="hover:text-white">{es ? 'Detalladores' : 'For detailers'}</Link>
                        <Link href={`/${locale}/privacy`} className="hover:text-white">{es ? 'Privacidad' : 'Privacy'}</Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
