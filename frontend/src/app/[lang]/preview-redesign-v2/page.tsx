import Image from "next/image";
import Link from "next/link";
import {
    Armchair, Car, Check, ChevronDown, Clock, Droplets, Eye, House,
    Lightbulb, MapPin, Moon, ShieldCheck, Sparkles, Sun, Wallet, Wind, X,
    type LucideIcon,
} from "lucide-react";
import { i18n, type Locale } from "@/i18n-config";
import { getDictionary } from "@/lib/dictionaries";
import ZipChecker from "@/components/ZipChecker/ZipChecker";
import JsonLd from "@/components/seo/JsonLd";
import { resolveLanding } from "@/lib/seo/landing";
import { SERVICES, t as tb } from "@/lib/seo/services";
import { getNearbyNeighborhoods } from "@/lib/seo/locations";
import { SERVICE_GUIDES, type IconKey, type L } from "@/lib/seo/serviceGuides";
import { getCityServiceBusinessSchema, getFaqSchema, getBreadcrumbSchema } from "@/lib/seo/schema";

/**
 * PREVIEW ONLY — v2, closer to the /services/[service] look Ruben liked
 * (full-bleed hero, science/limits, before-after, benefit cards, care tips)
 * with the local/marketing layer from v1 kept on top (local badge, local
 * price band, "why this neighborhood" line). Hardcoded to one real combo —
 * Headlight Restoration in Doral — since it's the one service that has both
 * a city-catalog entry and a full educational guide. Not linked, not in the
 * sitemap, safe to delete.
 */

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131835]";
const displayFont = { fontFamily: "var(--font-display)" } as const;
const h2Class = "text-2xl font-semibold sm:text-3xl";

const ICONS: Record<IconKey, LucideIcon> = {
    light: Lightbulb, night: Moon, eye: Eye, sparkle: Sparkles, wallet: Wallet,
    shield: ShieldCheck, car: Car, clock: Clock, home: House, sun: Sun,
    droplets: Droplets, wind: Wind, armchair: Armchair,
};

function normalize(lang: string): Locale {
    return i18n.locales.includes(lang as Locale) ? (lang as Locale) : "en";
}

function formatDuration(minutes: number, locale: Locale): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    const hourLabel = locale === "es" ? "h" : "hr";
    if (hours === 0) return `${rest} min`;
    return rest === 0 ? `${hours} ${hourLabel}` : `${hours} ${hourLabel} ${rest} min`;
}

function durationPhrase(minutes: number, locale: Locale): string {
    return locale === "es" ? `aproximadamente ${formatDuration(minutes, locale)}` : `about ${formatDuration(minutes, locale)}`;
}

function fill(text: string, vars: { price: string; duration: string }): string {
    return text.split("{price}").join(vars.price).split("{duration}").join(vars.duration);
}

export default async function PreviewRedesignV2Page({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const locale = normalize(lang);
    const es = locale === "es";
    const content = resolveLanding(locale, "headlight-restoration", "doral");
    if (!content) return <div className="p-10 text-white">Preview data not found.</div>;

    const { service, neighborhood } = content;
    const dict = await getDictionary(locale);
    const guide = SERVICE_GUIDES["headlight-restoration"];
    const vars = { price: `$${service.priceFrom}`, duration: durationPhrase(service.durationMin, locale) };
    const t = (text: L): string => fill(text[locale], vars);

    const bookHref = `/${locale}/booking/select`;
    const waText = encodeURIComponent(es ? `Hola, quiero ${service.name.es} en ${neighborhood.name}.` : `Hi, I'd like ${service.name.en} in ${neighborhood.name}.`);
    const waHref = WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${waText}` : null;

    const otherServices = SERVICES.filter((s) => s.id !== service.id);
    const nearby = getNearbyNeighborhoods(neighborhood.slug, 5);

    const steps = es
        ? [
            { title: "Reserva en línea", text: `Elige tu vehículo y un horario en ${neighborhood.name}.` },
            { title: "Vamos a ti", text: "Nuestro equipo llega a tu casa u oficina." },
            { title: "Revisa y luego paga", text: "El pago se autoriza solo después de que apruebes el trabajo." },
        ]
        : [
            { title: "Book online", text: `Choose your vehicle and a time in ${neighborhood.name}.` },
            { title: "We come to you", text: "Our team arrives at your home or office." },
            { title: "Inspect, then pay", text: "Payment is authorized only after you approve the work." },
        ];

    const breadcrumbs = getBreadcrumbSchema(
        [
            { name: es ? "Inicio" : "Home", path: "" },
            { name: tb(service.name, locale), path: `/${service.slug[locale]}/${neighborhood.slug}` },
        ],
        locale,
    );

    return (
        <div className="min-h-screen bg-[#131835] text-white">
            <JsonLd
                data={[
                    getCityServiceBusinessSchema(dict.common.siteName, tb(service.name, locale), content.metaDescription, neighborhood.name, content.alternates[locale], service.priceFrom),
                    getFaqSchema(content.faqs),
                    breadcrumbs,
                ]}
            />

            <div className="sticky top-0 z-40 bg-amber-500 px-6 py-2 text-center text-xs font-bold text-[#131835]">
                PREVIEW v2 — {es ? "Vista previa de rediseño, no publicada" : "Redesign preview, not published"}
            </div>

            <header className="border-b border-white/5">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                    <Link href={`/${locale}`} className={`rounded ${focusRing}`}>
                        <Image src="/dtailwash_logo_final.png" alt="Lux Auto Detail Services" width={1942} height={809} className="h-11 w-auto sm:h-14" />
                    </Link>
                    <div className="flex items-center gap-3">
                        {waHref && (
                            <a href={waHref} className={`hidden rounded-full bg-[#25D366] px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03] sm:inline-block ${focusRing}`}>WhatsApp</a>
                        )}
                        <Link href={bookHref} className={`rounded-full bg-[#D0B078] px-5 py-2 text-sm font-semibold text-[#131835] transition-colors hover:bg-[#dcc08d] ${focusRing}`}>
                            {es ? "Reservar" : "Book now"}
                        </Link>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero — service-page style full-bleed cover, with a local badge and local price band layered on top */}
                <section className="relative isolate overflow-hidden">
                    <Image
                        src={guide?.photos?.cover ?? content.imageUrl}
                        alt={`${tb(service.name, locale)} – ${neighborhood.name}`}
                        fill
                        priority
                        sizes="100vw"
                        style={guide?.photos?.coverPosition ? { objectPosition: guide.photos.coverPosition } : undefined}
                        className="-z-10 object-cover"
                    />
                    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#131835] via-[#131835]/80 to-[#131835]/40" />
                    <div className="mx-auto grid min-h-[360px] max-w-5xl gap-8 px-6 pb-12 pt-20 sm:min-h-[440px] lg:grid-cols-[1.25fr_1fr] lg:items-end">
                        <div className="self-end">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D0B078]/30 bg-[#D0B078]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#D0B078] backdrop-blur">
                                <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                                {es ? `Ahora sirviendo ${neighborhood.name}` : `Now serving ${neighborhood.name}`}
                            </div>
                            <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl" style={displayFont}>
                                {content.h1}
                            </h1>
                            {guide && <p className="mt-4 max-w-xl text-lg text-white/85">{t(guide.heroSub)}</p>}
                            <div className="mt-6 flex flex-wrap items-center gap-4">
                                <div className="rounded-xl border border-[#D0B078]/25 bg-[#0f1430]/70 px-5 py-3 backdrop-blur">
                                    <p className="text-[11px] uppercase tracking-widest text-[#D0B078]">{es ? `Precio en ${neighborhood.name}` : `${neighborhood.name} price`}</p>
                                    <p className="text-xl font-bold">${service.priceFrom} <span className="text-sm font-normal text-white/60">· {formatDuration(service.durationMin, locale)}</span></p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Link href={bookHref} className={`rounded-full bg-[#D0B078] px-6 py-3 text-sm font-semibold text-[#131835] transition-colors hover:bg-[#dcc08d] ${focusRing}`}>
                                        {es ? "Reservar ahora" : "Book now"}
                                    </Link>
                                    {waHref && (
                                        <a href={waHref} className={`rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/70 ${focusRing}`}>WhatsApp</a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <aside className="rounded-2xl border border-white/10 bg-[#0f1430]/85 p-6 backdrop-blur">
                            <h2 className="text-base font-semibold text-[#D0B078]">{es ? "Otros servicios" : "Other services"}</h2>
                            <ul className="mt-3 divide-y divide-white/10">
                                {otherServices.slice(0, 4).map((s) => (
                                    <li key={s.id}>
                                        <Link href={`/${locale}/${s.slug[locale]}/${neighborhood.slug}`} className={`flex items-center justify-between gap-3 py-3 text-sm transition-colors hover:text-[#D0B078] ${focusRing}`}>
                                            <span className="font-medium">{tb(s.name, locale)}</span>
                                            <span className="text-white/60">{es ? "desde" : "from"} ${s.priceFrom}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </aside>
                    </div>
                </section>

                {/* Quick answer — local copy, not the generic guide one */}
                <section className="mx-auto max-w-5xl px-6 pt-10">
                    <div className="rounded-2xl border border-[#D0B078]/30 bg-[#D0B078]/5 p-6">
                        <h2 className="text-lg font-semibold">{es ? "Respuesta rápida" : "Quick answer"}</h2>
                        <p className="mt-2 max-w-3xl text-white/85">{content.quickAnswer}</p>
                    </div>
                </section>

                {guide && (
                    <>
                        {/* What it is + limits */}
                        <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[1.2fr_1fr]">
                            <div>
                                <h2 className={h2Class} style={displayFont}>{t(guide.scienceTitle)}</h2>
                                <div className="mt-5 max-w-prose space-y-4 text-white/80">
                                    {guide.science.map((p, i) => <p key={i}>{t(p)}</p>)}
                                </div>
                            </div>
                            <div className="space-y-6 self-start rounded-2xl border border-[#2C355E] bg-[#151B3A] p-6">
                                <div>
                                    <h3 className="font-semibold text-[#D0B078]">{t(guide.limits.canTitle)}</h3>
                                    <ul className="mt-3 space-y-2.5 text-white/80">
                                        {guide.limits.can.map((item, i) => (
                                            <li key={i} className="flex gap-3"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[#D0B078]" /><span>{t(item)}</span></li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold">{t(guide.limits.cannotTitle)}</h3>
                                    <ul className="mt-3 space-y-2.5 text-white/70">
                                        {guide.limits.cannot.map((item, i) => (
                                            <li key={i} className="flex gap-3"><X aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-white/50" /><span>{t(item)}</span></li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Before / after — real photos, framed as local proof */}
                        {guide.photos?.beforeAfter && guide.photos.beforeAfter.length > 0 && (
                            <section className="mx-auto max-w-5xl px-6 pb-12">
                                <h2 className={h2Class} style={displayFont}>
                                    {es ? `Antes y después en ${neighborhood.name}` : `Before & after in ${neighborhood.name}`}
                                </h2>
                                <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
                                    {guide.photos.beforeAfter.map((pair, i) => (
                                        <figure key={i}>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(["before", "after"] as const).map((side) => (
                                                    <div key={side} className={`relative overflow-hidden rounded-xl ${pair.orientation === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]"}`}>
                                                        <Image src={pair[side]} alt={`${t(pair.caption)} – ${side}`} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                                                        <span className={`absolute left-2 top-2 rounded-full px-3 py-1 text-xs font-semibold ${side === "after" ? "bg-[#D0B078] text-[#131835]" : "bg-black/70 text-white"}`}>
                                                            {side === "before" ? (es ? "Antes" : "Before") : (es ? "Después" : "After")}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            <figcaption className="mt-3 text-sm text-white/70">{t(pair.caption)}</figcaption>
                                        </figure>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}

                {/* What's included — real city-catalog data */}
                <section className="mx-auto max-w-5xl px-6 py-12">
                    <h2 className={h2Class} style={displayFont}>{es ? "Qué incluye" : "What's included"}</h2>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {service.includes.map((item) => (
                            <div key={item.en} className="flex items-center gap-3 rounded-xl border border-[#2C355E] bg-[#151B3A] px-5 py-4">
                                <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-[#D0B078]" />
                                <span className="text-sm text-white/85">{tb(item, locale)}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Benefits */}
                {guide && (
                    <section className="border-y border-white/5 bg-[#151B3A]">
                        <div className="mx-auto max-w-5xl px-6 py-12">
                            <h2 className={h2Class} style={displayFont}>{t(guide.benefitsTitle)}</h2>
                            <p className="mt-3 max-w-xl text-white/70">{t(guide.benefitsIntro)}</p>
                            <ul className={`mt-8 grid gap-4 sm:grid-cols-2 ${guide.benefits.length === 6 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
                                {guide.benefits.map((benefit, i) => {
                                    const Icon = ICONS[benefit.icon];
                                    return (
                                        <li key={i} className="rounded-xl border border-[#2C355E] bg-[#131835] p-5">
                                            <Icon aria-hidden="true" className="h-6 w-6 text-[#D0B078]" />
                                            <h3 className="mt-4 font-semibold">{t(benefit.t)}</h3>
                                            <p className="mt-1.5 text-sm text-white/70">{t(benefit.d)}</p>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </section>
                )}

                {/* How it works — localized steps */}
                <section>
                    <div className="mx-auto max-w-5xl px-6 py-12">
                        <h2 className={h2Class} style={displayFont}>{es ? "Cómo funciona" : "How it works"}</h2>
                        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
                            {steps.map((step, i) => (
                                <li key={step.title} className="flex gap-4">
                                    <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D0B078]/50 text-sm font-semibold text-[#D0B078]">{i + 1}</span>
                                    <div>
                                        <h3 className="font-semibold">{step.title}</h3>
                                        <p className="mt-1 text-sm text-white/70">{step.text}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* Care */}
                {guide && (
                    <section className="mx-auto max-w-5xl px-6 py-12">
                        <h2 className={h2Class} style={displayFont}>{t(guide.careTitle)}</h2>
                        <p className="mt-3 max-w-xl text-white/70">{t(guide.careIntro)}</p>
                        <ul className="mt-6 max-w-2xl space-y-3 text-white/80">
                            {guide.care.map((tip, i) => (
                                <li key={i} className="flex gap-3"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[#D0B078]" /><span>{t(tip)}</span></li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* ZIP check */}
                <section className="border-y border-white/5 bg-[#151B3A] px-6 py-14">
                    <div className="mx-auto max-w-2xl space-y-6 text-center">
                        <h2 className="text-2xl font-bold sm:text-3xl" style={displayFont}>{es ? `¿Estás en ${neighborhood.name}?` : `Are you in ${neighborhood.name}?`}</h2>
                        <p className="text-white/60">{es ? "Verifica tu código postal y reserva en segundos." : "Check your ZIP and book in seconds."}</p>
                        <div className="mx-auto max-w-lg"><ZipChecker dict={dict.zipChecker} lang={locale} /></div>
                    </div>
                </section>

                {/* FAQ — local, city-specific questions */}
                <section className="mx-auto max-w-3xl px-6 py-12">
                    <h2 className={h2Class} style={displayFont}>{es ? `Preguntas sobre ${neighborhood.name}` : `Questions about ${neighborhood.name}`}</h2>
                    <div className="mt-6 space-y-3">
                        {content.faqs.map((f, i) => (
                            <details key={i} className="group rounded-xl border border-[#2C355E] bg-[#151B3A] open:border-[#D0B078]/50">
                                <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 font-medium [&::-webkit-details-marker]:hidden ${focusRing}`}>
                                    <span>{f.q}</span>
                                    <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-[#D0B078] transition-transform group-open:rotate-180" />
                                </summary>
                                <p className="max-w-2xl px-5 pb-5 text-white/75">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                {/* Internal link mesh */}
                <section className="border-t border-white/5 px-6 py-14">
                    <div className="mx-auto max-w-5xl grid gap-10 sm:grid-cols-2">
                        <div>
                            <p className="mb-4 text-xs uppercase tracking-widest text-[#D0B078]">{es ? "Otros servicios en " : "Other services in "}{neighborhood.name}</p>
                            <ul className="space-y-2">
                                {otherServices.map((s) => (
                                    <li key={s.id}><Link href={`/${locale}/${s.slug[locale]}/${neighborhood.slug}`} className="text-sm text-white/70 underline-offset-4 hover:text-[#D0B078] hover:underline">{tb(s.name, locale)} — {neighborhood.name}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="mb-4 text-xs uppercase tracking-widest text-[#D0B078]">{es ? `${service.name.es} en otras zonas` : `${service.name.en} in nearby areas`}</p>
                            <ul className="space-y-2">
                                {nearby.map((n) => (
                                    <li key={n.slug}><Link href={`/${locale}/${service.slug[locale]}/${n.slug}`} className="text-sm text-white/70 underline-offset-4 hover:text-[#D0B078] hover:underline">{tb(service.name, locale)} — {n.name}</Link></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="mx-auto max-w-5xl px-6 pb-16">
                    <div className="rounded-2xl border border-[#2C355E] bg-[#151B3A] p-8 sm:p-10">
                        <h2 className="text-2xl font-semibold" style={displayFont}>
                            {es ? `${service.name.es} en ${neighborhood.name}, hoy` : `${service.name.en} in ${neighborhood.name}, today`}
                        </h2>
                        <p className="mt-2 max-w-xl text-white/70">{es ? "Primero revisas el trabajo y después autorizas el pago." : "You inspect the work first, then authorize the payment."}</p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link href={bookHref} className={`rounded-full bg-[#D0B078] px-6 py-3 text-sm font-semibold text-[#131835] transition-colors hover:bg-[#dcc08d] ${focusRing}`}>
                                {es ? "Reservar ahora" : "Book now"}
                            </Link>
                            {waHref && (
                                <a href={waHref} className={`rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/70 ${focusRing}`}>WhatsApp</a>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-white/5 px-6 py-8 text-xs text-white/55">
                <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
                    <p>© {new Date().getFullYear()} Lux Auto Detail Services</p>
                </div>
            </footer>
        </div>
    );
}
