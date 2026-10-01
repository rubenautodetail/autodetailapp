import Link from 'next/link';
import Image from 'next/image';
import { i18n, type Locale } from '@/i18n-config';
import { getDictionary } from '@/lib/dictionaries';
import ZipChecker from '@/components/ZipChecker/ZipChecker';
import { resolveLanding } from '@/lib/seo/landing';
import { SERVICES, t } from '@/lib/seo/services';
import { getNearbyNeighborhoods } from '@/lib/seo/locations';

/**
 * PREVIEW ONLY — not part of the real 192-page template, not linked from
 * anywhere, not in the sitemap. Hardcoded to one real combo (Mobile Car
 * Detailing in Doral) so Ruben can see a redesign direction before it
 * touches the live [service]/[city] pages. Safe to delete at any time.
 */

function normalize(lang: string): Locale {
    return i18n.locales.includes(lang as Locale) ? (lang as Locale) : 'en';
}

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

export default async function PreviewRedesignPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const locale = normalize(lang);
    const content = resolveLanding(locale, 'mobile-car-detailing', 'doral');
    if (!content) return <div className="p-10 text-white">Preview data not found.</div>;

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
    const nearby = getNearbyNeighborhoods(neighborhood.slug, 5);
    const gallery = content.imageUrls && content.imageUrls.length > 1 ? content.imageUrls : [content.imageUrl];

    const steps = es
        ? [
            { n: '1', t: 'Reserva en 60 segundos', d: `Elige tu servicio y confirma tu dirección en ${neighborhood.name}.` },
            { n: '2', t: 'Llegamos a tu puerta', d: 'Nuestro equipo llega con todo el equipo necesario — tú no mueves nada.' },
            { n: '3', t: 'Revisa y aprueba', d: 'Solo pagas cuando apruebas el trabajo terminado.' },
        ]
        : [
            { n: '1', t: 'Book in 60 seconds', d: `Pick your service and confirm your address in ${neighborhood.name}.` },
            { n: '2', t: 'We come to your door', d: 'Our team arrives fully equipped — you don\u2019t lift a finger.' },
            { n: '3', t: 'Review and approve', d: 'You only pay once you approve the finished job.' },
        ];

    return (
        <main className="min-h-screen bg-[#131835] text-white">
            <div className="sticky top-0 z-40 bg-amber-500 px-6 py-2 text-center text-xs font-bold text-[#131835]">
                PREVIEW — {es ? 'Vista previa de rediseño, no publicada' : 'Redesign preview, not published'}
            </div>

            <style>{`
                @keyframes dtwRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
                .dtw-rise { animation: dtwRise .7s cubic-bezier(.2,.7,.2,1) both; }
            `}</style>

            {/* ── Header ─────────────────────────────────────────────── */}
            <header className="sticky top-8 z-30 border-b border-white/5 bg-[#131835]/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link href={`/${locale}`} className="flex items-center gap-2">
                        <Image src="/dtailwash_logo_final.png" alt="Lux Auto Detail Services" width={1942} height={809} className="h-8 w-auto" style={{ width: 'auto' }} priority />
                    </Link>
                    <Link href={bookHref} className="rounded-full bg-[#D0B078] px-5 py-2 text-sm font-semibold text-[#131835] shadow-[0_0_24px_rgba(208,176,120,0.25)] transition-transform hover:scale-[1.03]">
                        {es ? 'Reservar' : 'Book now'}
                    </Link>
                </div>
            </header>

            {/* ── Hero: local-landing style, badge row up top, price band baked in ── */}
            <section className="relative overflow-hidden px-6 pt-10 pb-10 sm:pt-14">
                <div className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_90%_at_50%_-10%,rgba(208,176,120,0.14),transparent_60%)]" />
                <div className="relative mx-auto max-w-5xl text-center">
                    <div className="dtw-rise mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-[#D0B078]/30 bg-[#D0B078]/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#D0B078]">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {es ? `Ahora sirviendo ${neighborhood.name}` : `Now serving ${neighborhood.name}`}
                    </div>
                    <h1 className="dtw-rise text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl" style={{ fontFamily: 'var(--font-display)' }}>
                        {content.h1}
                    </h1>
                    <p className="dtw-rise mx-auto mt-4 max-w-xl text-lg font-light leading-relaxed text-white/75">
                        {content.heroSub}
                    </p>

                    {/* Local price band — distinct from the generic "Quick answer" card */}
                    <div className="dtw-rise mx-auto mt-8 flex max-w-lg flex-col items-center justify-between gap-4 rounded-2xl border border-[#D0B078]/25 bg-white/[0.03] px-6 py-5 sm:flex-row">
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

            {/* ── Photo gallery: dedicated carousel, framed as local proof ── */}
            <section className="px-6 pb-4">
                <div className="mx-auto max-w-5xl">
                    <p className="mb-4 text-center text-xs uppercase tracking-widest text-[#D0B078]">
                        {es ? `Trabajo reciente en ${neighborhood.name}` : `Recent work in ${neighborhood.name}`}
                    </p>
                    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 gold-scrollbar">
                        {gallery.map((src, i) => (
                            <div key={src} className="relative aspect-[4/3] w-64 shrink-0 snap-start overflow-hidden rounded-2xl sm:w-80">
                                <Image src={src} alt={`${t(service.name, locale)} ${i + 1}`} fill className="object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How it works: 3-step flow — not present on the live city pages ── */}
            <section className="border-y border-white/5 bg-white/[0.015] px-6 py-14 sm:py-20">
                <div className="mx-auto max-w-4xl">
                    <h2 className="mb-10 text-center text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                        {es ? 'Cómo funciona' : 'How it works'}
                    </h2>
                    <div className="grid gap-8 sm:grid-cols-3">
                        {steps.map((s) => (
                            <div key={s.n} className="text-center">
                                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#D0B078] text-sm font-bold text-[#131835]">{s.n}</div>
                                <h3 className="mb-1.5 text-base font-semibold">{s.t}</h3>
                                <p className="text-sm leading-relaxed text-white/60">{s.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Local intro copy (unchanged — this is the unique SEO text) ── */}
            <section className="px-6 py-14 sm:py-20">
                <div className="mx-auto max-w-3xl space-y-5">
                    {content.intro.map((p, i) => (
                        <p key={i} className="text-base leading-relaxed text-white/70">{p}</p>
                    ))}
                </div>
            </section>

            {/* ── What's included ─────────────────────────────────────── */}
            <section className="px-6 py-14 sm:py-24">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-10 space-y-3 text-center">
                        <p className="text-xs uppercase tracking-widest text-[#D0B078]">{es ? 'Qué incluye' : 'What\u2019s included'}</p>
                        <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                            {es ? `Tu ${service.name.es}` : `Your ${service.name.en}`}
                        </h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {service.includes.map((item) => (
                            <div key={item.en} className="glass-card flex items-center gap-3 rounded-xl px-5 py-4">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D0B078]/15 text-xs text-[#D0B078]">\u2713</span>
                                <span className="text-sm text-white/85">{t(item, locale)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Why this neighborhood trusts us — localized, list style (not a 3-col grid) ── */}
            <section className="border-y border-white/5 bg-white/[0.02] px-6 py-14 sm:py-20">
                <div className="mx-auto max-w-3xl">
                    <h2 className="mb-8 text-center text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                        {es ? `Por qué ${neighborhood.name} elige Lux` : `Why ${neighborhood.name} chooses Lux`}
                    </h2>
                    <div className="space-y-4">
                        {[
                            es ? `Vamos directo a tu casa u oficina en ${neighborhood.name}.` : `We come straight to your home or office in ${neighborhood.name}.`,
                            es ? 'Equipo verificado y asegurado.' : 'Vetted and insured team.',
                            es ? 'Ves tu precio exacto antes de confirmar.' : 'See your exact price before you confirm.',
                            es ? 'Reserva y atención en español o inglés.' : 'Book and get service in English or Spanish.',
                            es ? 'Solo pagas cuando apruebas el trabajo terminado.' : 'You only pay once you approve the finished job.',
                        ].map((line) => (
                            <div key={line} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4">
                                <span className="mt-0.5 text-[#D0B078]">\u2713</span>
                                <span className="text-sm text-white/80">{line}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ZIP check CTA ───────────────────────────────────────── */}
            <section className="px-6 py-14 sm:py-20">
                <div className="mx-auto max-w-2xl space-y-6 text-center">
                    <h2 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
                        {es ? `¿Estás en ${neighborhood.name}?` : `Are you in ${neighborhood.name}?`}
                    </h2>
                    <p className="text-white/60">{es ? 'Verifica tu código postal y reserva en segundos.' : 'Check your ZIP and book in seconds.'}</p>
                    <div className="mx-auto max-w-lg"><ZipChecker dict={dict.zipChecker} lang={locale} /></div>
                </div>
            </section>

            {/* ── FAQ ──────────────────────────────────────────────────── */}
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

            <footer className="border-t border-white/5 px-6 py-10">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-white/40 sm:flex-row">
                    <span>© {new Date().getFullYear()} Lux Auto Detail Services · {es ? 'Detallado móvil en Miami-Dade' : 'Mobile detailing in Miami-Dade'}</span>
                </div>
            </footer>
        </main>
    );
}
