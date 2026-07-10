import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { i18n, type Locale } from '@/i18n-config';
import { getDictionary } from '@/lib/dictionaries';
import ZipChecker from '@/components/ZipChecker/ZipChecker';
import JsonLd from '@/components/seo/JsonLd';
import ImagePlaceholder from '@/components/landing/programmatic/ImagePlaceholder';
import { getAllLandingParams, resolveLanding } from '@/lib/seo/landing';
import { SERVICES, t } from '@/lib/seo/services';
import { getNearbyNeighborhoods } from '@/lib/seo/locations';
import {
    getCityServiceBusinessSchema,
    getFaqSchema,
    getBreadcrumbSchema,
} from '@/lib/seo/schema';

export const dynamicParams = false;

export function generateStaticParams() {
    return getAllLandingParams();
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
            ? `Hola, quiero ${service.name.es.toLowerCase()} en ${neighborhood.name}.`
            : `Hi, I'd like ${service.name.en.toLowerCase()} in ${neighborhood.name}.`
    );
    const waHref = WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${waText}` : null;

    const otherServices = SERVICES.filter((s) => s.id !== service.id);
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
                        <Image src="/dtailwash_logo_final.png" alt="DTailWash" width={1942} height={809} className="h-8 w-auto" style={{ width: 'auto' }} priority />
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href={`/${es ? 'en' : 'es'}/${service.slug[es ? 'en' : 'es']}/${neighborhood.slug}`}
                            className="text-xs uppercase tracking-widest text-white/50 transition-colors hover:text-white">
                            {es ? 'EN' : 'ES'}
                        </Link>
                        <Link href={bookHref}
                            className="rounded-full bg-[#D0B078] px-5 py-2 text-sm font-semibold text-[#131835] shadow-[0_0_24px_rgba(208,176,120,0.25)] transition-transform hover:scale-[1.03]">
                            {es ? 'Reservar' : 'Book now'}
                        </Link>
                    </div>
                </div>
            </header>

            {/* ── Hero ───────────────────────────────────────────────── */}
            <section className="relative overflow-hidden px-6 pt-14 pb-16 sm:pt-20 sm:pb-24">
                <div className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_90%_at_50%_-10%,rgba(208,176,120,0.14),transparent_60%)]" />
                <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
                    <div className="space-y-7">
                        <div className="dtw-rise inline-flex items-center gap-2 rounded-full border border-[#D0B078]/30 bg-[#D0B078]/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#D0B078]" style={{ animationDelay: '0ms' }}>
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D0B078]" />
                            {content.heroEyebrow}
                        </div>
                        <h1 className="dtw-rise text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl" style={{ fontFamily: 'var(--font-display)', animationDelay: '80ms' }}>
                            {content.h1.split(' ').map((w, i, a) =>
                                i >= a.length - 1 ? <span key={i} className="text-gold-gradient">{w}</span> : <span key={i}>{w} </span>
                            )}
                        </h1>
                        <p className="dtw-rise max-w-md text-lg font-light leading-relaxed text-white/75" style={{ animationDelay: '140ms' }}>
                            {content.heroSub}
                        </p>
                        <div className="dtw-rise flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/60" style={{ animationDelay: '180ms' }}>
                            <span className="text-[#D0B078]">★ 4.97</span>
                            <span>· {es ? '2,400+ detalles' : '2,400+ details'}</span>
                            <span>· {es ? 'Detalladores verificados' : 'Vetted detailers'}</span>
                            <span>· {es ? 'Asegurados' : 'Insured'}</span>
                        </div>

                        {/* Locale-aware CTA — ES leads with WhatsApp/price per research */}
                        <div className="dtw-rise space-y-3 pt-1" style={{ animationDelay: '220ms' }}>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-2xl font-bold text-white">{content.priceLabel}</span>
                                <span className="text-sm text-white/50">· {content.durationLabel}</span>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                {es && waHref ? (
                                    <>
                                        <a href={waHref} className="rounded-full bg-[#25D366] px-6 py-3 text-center text-sm font-semibold text-white transition-transform hover:scale-[1.03]">
                                            WhatsApp
                                        </a>
                                        <Link href={bookHref} className="rounded-full border border-[#D0B078]/40 bg-[#D0B078]/10 px-6 py-3 text-center text-sm font-semibold text-[#D0B078] transition-colors hover:bg-[#D0B078]/20">
                                            Reservar en línea
                                        </Link>
                                    </>
                                ) : (
                                    <Link href={bookHref} className="rounded-full bg-[#D0B078] px-7 py-3 text-center text-sm font-semibold text-[#131835] shadow-[0_0_24px_rgba(208,176,120,0.25)] transition-transform hover:scale-[1.03]">
                                        {es ? 'Reservar en línea' : 'Book in 60 seconds'}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="dtw-rise" style={{ animationDelay: '120ms' }}>
                        <ImagePlaceholder
                            alt={es ? `${service.name.es} en ${neighborhood.name}` : `${service.name.en} in ${neighborhood.name}`}
                            prompt={`Premium cinematic photo of a professional mobile car detailer working on a luxury car in ${neighborhood.name}, Miami. Deep navy and champagne-gold color grade, golden-hour light, glossy wet paint reflections, DTailWash branded van softly blurred in background. Editorial, high-end, shallow depth of field.`}
                            aspect="aspect-[4/5]"
                            priority
                        />
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
                            {es ? `Tu ${service.name.es.toLowerCase()}` : `Your ${service.name.en.toLowerCase()}`}
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

            {/* ── Why DTailWash ───────────────────────────────────────── */}
            <section className="px-6 py-14 sm:py-24">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-10 space-y-3 text-center">
                        <p className="text-xs uppercase tracking-widest text-[#D0B078]">{es ? 'Por qué DTailWash' : 'Why DTailWash'}</p>
                        <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                            {es ? 'Detallado sin complicaciones' : 'Detailing without the hassle'}
                        </h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {[
                            { icon: '🚐', t: es ? 'Vamos a ti' : 'We come to you', d: es ? `A tu casa u oficina en ${neighborhood.name}.` : `To your home or office in ${neighborhood.name}.` },
                            { icon: '🛡️', t: es ? 'Verificados y asegurados' : 'Vetted & insured', d: es ? 'Cada detallador es revisado y asegurado.' : 'Every detailer is background-checked and insured.' },
                            { icon: '💳', t: es ? 'Precio transparente' : 'Transparent pricing', d: es ? 'Ves el precio antes de confirmar. Sin sorpresas.' : 'See your price before you confirm. No surprises.' },
                            { icon: '🗣️', t: es ? 'Bilingüe' : 'Bilingual', d: es ? 'Reserva y atención en español o inglés.' : 'Book and get service in English or Spanish.' },
                            { icon: '⭐', t: es ? '4.97 de calificación' : '4.97 average rating', d: es ? 'Más de 2,400 detalles completados.' : 'Over 2,400 details completed.' },
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

            {/* ── Final CTA ───────────────────────────────────────────── */}
            <section className="px-6 pb-20 pt-6">
                <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[#D0B078]/20 bg-gradient-to-br from-[#1A2142] to-[#131835] px-8 py-14 text-center">
                    <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                        {es ? `${service.name.es} en ${neighborhood.name}, hoy` : `${service.name.en} in ${neighborhood.name}, today`}
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-white/60">
                        {es ? `Desde ${content.priceLabel.replace('Desde ', '')} · vamos a tu ubicación.` : `${content.priceLabel} · we come to your location.`}
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
                    <span>© {new Date().getFullYear()} DTailWash · {es ? 'Detallado móvil en Miami-Dade' : 'Mobile detailing in Miami-Dade'}</span>
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
