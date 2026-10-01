import Image from "next/image";
import Link from "next/link";
import {
    Armchair, Car, Check, ChevronDown, ChevronRight, Clock, Droplets, Eye, House,
    Lightbulb, Moon, ShieldCheck, Sparkles, Sun, Wallet, Wind, X,
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
 * PREVIEW ONLY — v3, a close 1:1 port of the /services/[service] design onto
 * a city page, confirmed as the direction to use. Same section order and
 * styling as the service page; only the content that's naturally local
 * (quick answer, FAQ, "areas"/internal links, ZIP check) is swapped for the
 * city's own data. Hardcoded to Headlight Restoration in Doral. Not linked,
 * not in the sitemap, safe to delete once ported to the real template.
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

export default async function PreviewRedesignV3Page({
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
    const showBestFor = SERVICES.every((s) => SERVICE_GUIDES[s.slug.en]);

    const steps = es
        ? [
            { title: "Reserva en línea", text: "Elige tu vehículo y un horario que te convenga." },
            { title: "Vamos a ti", text: `Nuestro equipo llega a tu casa u oficina en ${neighborhood.name}.` },
            { title: "Revisa y luego paga", text: "Revisa el trabajo primero. El pago se autoriza solo después de que lo apruebes." },
        ]
        : [
            { title: "Book online", text: "Choose your vehicle and a time that works for you." },
            { title: "We come to you", text: `Our team arrives at your home or office in ${neighborhood.name}.` },
            { title: "Inspect, then pay", text: "Check the work first. The payment is authorized only after you approve it." },
        ];

    const h1Lead = es ? `${service.name.es} a domicilio en` : `${service.name.en} in`;
    const bookLabel = es ? `Reservar ${service.name.es}` : `Book ${service.name.en}`;

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
                PREVIEW v3 — {es ? "Vista previa, replica fiel del diseno de servicio" : "Preview, faithful port of the service design"}
            </div>

            <header className="border-b border-white/5">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                    <Link href={`/${locale}`} aria-label={es ? "Ir al inicio" : "Go to home"} className={`rounded ${focusRing}`}>
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
                {/* Hero — identical layout to the service page: full-bleed cover, H1, "other services" aside */}
                <section className="relative isolate overflow-hidden">
                    <Image
                        src={guide?.photos?.cover ?? content.imageUrl}
                        alt={`${tb(service.name, locale)} – Lux Auto Detail Services`}
                        fill
                        priority
                        sizes="100vw"
                        style={guide?.photos?.coverPosition ? { objectPosition: guide.photos.coverPosition } : undefined}
                        className="-z-10 object-cover"
                    />
                    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#131835] via-[#131835]/80 to-[#131835]/40" />
                    <div className="mx-auto grid min-h-[360px] max-w-5xl gap-8 px-6 pb-12 pt-20 sm:min-h-[440px] lg:grid-cols-[1.25fr_1fr] lg:items-end">
                        <div className="self-end">
                            <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl" style={displayFont}>
                                {h1Lead} <span className="whitespace-nowrap">{neighborhood.name}</span>
                            </h1>
                            {guide && <p className="mt-4 max-w-xl text-lg text-white/85">{t(guide.heroSub)}</p>}
                            <p className="mt-4 text-white/85">
                                {es ? "Desde " : "From "}<span className="font-semibold text-[#D0B078]">${service.priceFrom}</span>
                                {es ? `. Dura ${durationPhrase(service.durationMin, locale)}.` : `. Takes ${durationPhrase(service.durationMin, locale)}.`}
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link href={bookHref} className={`rounded-full bg-[#D0B078] px-6 py-3 text-sm font-semibold text-[#131835] transition-colors hover:bg-[#dcc08d] ${focusRing}`}>
                                    {bookLabel}
                                </Link>
                                {waHref && (
                                    <a href={waHref} className={`rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/70 ${focusRing}`}>
                                        {es ? "Preguntar por WhatsApp" : "Ask on WhatsApp"}
                                    </a>
                                )}
                            </div>
                        </div>

                        <aside className="rounded-2xl border border-white/10 bg-[#0f1430]/85 p-6 backdrop-blur">
                            <h2 className="text-base font-semibold text-[#D0B078]">{es ? "Otros servicios" : "Other services"}</h2>
                            <ul className="mt-3 divide-y divide-white/10">
                                {otherServices.map((s) => (
                                    <li key={s.id}>
                                        <Link href={`/${locale}/${s.slug[locale]}/${neighborhood.slug}`} className={`flex items-center justify-between gap-3 py-3 text-sm transition-colors hover:text-[#D0B078] ${focusRing}`}>
                                            <span className="font-medium">{tb(s.name, locale)}</span>
                                            <span className="flex shrink-0 items-center gap-1 text-white/65">
                                                {es ? "desde" : "from"} ${s.priceFrom}
                                                <ChevronRight aria-hidden="true" className="h-4 w-4" />
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </aside>
                    </div>
                </section>

                {guide && (
                    <>
                        {/* Quick answer — local copy instead of the generic guide one */}
                        <section className="mx-auto max-w-5xl px-6 pt-10">
                            <div className="rounded-2xl border border-[#D0B078]/30 bg-[#D0B078]/5 p-6">
                                <h2 className="text-lg font-semibold">{es ? "Respuesta rápida" : "Quick answer"}</h2>
                                <p className="mt-2 max-w-3xl text-white/85">{content.quickAnswer}</p>
                            </div>
                        </section>

                        {/* What it is + what it can and can't fix */}
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

                        {/* Before and after photos */}
                        {guide.photos?.beforeAfter && guide.photos.beforeAfterTitle && guide.photos.beforeAfter.length > 0 && (
                            <section className="mx-auto max-w-5xl px-6 pb-12">
                                <h2 className={h2Class} style={displayFont}>{t(guide.photos.beforeAfterTitle)}</h2>
                                {guide.photos.beforeAfterIntro && <p className="mt-3 max-w-xl text-white/70">{t(guide.photos.beforeAfterIntro)}</p>}
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

                {/* What's included */}
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

                {/* How it works */}
                <section className={guide ? "" : "border-y border-white/5 bg-[#151B3A]"}>
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

                {/* FAQ — same section style as the service page, local questions underneath */}
                <section className="border-t border-white/5 bg-[#151B3A]">
                    <div className="mx-auto max-w-3xl px-6 py-12">
                        <h2 className={h2Class} style={displayFont}>{es ? "Preguntas frecuentes" : "Frequently asked questions"}</h2>
                        <div className="mt-6 space-y-3">
                            {content.faqs.map((f, i) => (
                                <details key={i} className="group rounded-xl border border-[#2C355E] bg-[#131835] open:border-[#D0B078]/50">
                                    <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 font-medium [&::-webkit-details-marker]:hidden ${focusRing}`}>
                                        <span>{f.q}</span>
                                        <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-[#D0B078] transition-transform group-open:rotate-180" />
                                    </summary>
                                    <p className="max-w-2xl px-5 pb-5 text-white/75">{f.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Areas we serve — mirrored for a city page as the internal-link mesh (other services here + this service nearby) */}
                <section className="mx-auto max-w-5xl px-6 py-12">
                    <h2 className={h2Class} style={displayFont}>{es ? "Enlaces relacionados" : "Related links"}</h2>
                    <p className="mt-3 max-w-xl text-white/70">
                        {es ? `Más opciones en ${neighborhood.name} y zonas cercanas.` : `More options in ${neighborhood.name} and nearby areas.`}
                    </p>
                    <div className="mt-6 grid gap-8 sm:grid-cols-2">
                        <div>
                            <p className="mb-3 text-sm font-semibold text-[#D0B078]">{es ? `Otros servicios en ${neighborhood.name}` : `Other services in ${neighborhood.name}`}</p>
                            <ul className="flex flex-wrap gap-2">
                                {otherServices.map((s) => (
                                    <li key={s.id}>
                                        <Link href={`/${locale}/${s.slug[locale]}/${neighborhood.slug}`} className={`inline-block rounded-full border border-[#2C355E] px-4 py-2 text-sm text-white/85 transition-colors hover:border-[#D0B078]/60 hover:text-white ${focusRing}`}>
                                            {tb(s.name, locale)}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="mb-3 text-sm font-semibold text-[#D0B078]">{es ? `${service.name.es} en zonas cercanas` : `${service.name.en} in nearby areas`}</p>
                            <ul className="flex flex-wrap gap-2">
                                {nearby.map((n) => (
                                    <li key={n.slug}>
                                        <Link href={`/${locale}/${service.slug[locale]}/${n.slug}`} className={`inline-block rounded-full border border-[#2C355E] px-4 py-2 text-sm text-white/85 transition-colors hover:border-[#D0B078]/60 hover:text-white ${focusRing}`}>
                                            {n.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Compare services */}
                <section className="mx-auto max-w-5xl px-6 py-12">
                    <h2 className={h2Class} style={displayFont}>{es ? "¿Qué servicio es para ti?" : "Which service fits you?"}</h2>
                    <p className="mt-3 max-w-xl text-white/70">{es ? "Compara el tiempo y el precio de cada servicio." : "Compare the time and starting price of each service."}</p>
                    <div className="mt-6 overflow-x-auto rounded-2xl border border-[#2C355E]">
                        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                            <caption className="sr-only">{es ? "Comparación de servicios" : "Service comparison"}</caption>
                            <thead className="bg-[#0f1430] text-white/70">
                                <tr>
                                    <th scope="col" className="px-4 py-3 font-medium">{es ? "Servicio" : "Service"}</th>
                                    <th scope="col" className="px-4 py-3 font-medium">{es ? "Tiempo" : "Time"}</th>
                                    <th scope="col" className="px-4 py-3 font-medium">{es ? "Desde" : "From"}</th>
                                    {showBestFor && <th scope="col" className="px-4 py-3 font-medium">{es ? "Ideal para" : "Best for"}</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {SERVICES.map((s) => {
                                    const isCurrent = s.id === service.id;
                                    const rowGuide = SERVICE_GUIDES[s.slug.en];
                                    return (
                                        <tr key={s.id} className={`border-t border-[#2C355E] ${isCurrent ? "bg-[#D0B078]/10" : ""}`}>
                                            <th scope="row" className="px-4 py-3 font-medium">
                                                {isCurrent ? (
                                                    <span className="text-[#D0B078]">{tb(s.name, locale)}<span className="sr-only">{es ? " (página actual)" : " (current page)"}</span></span>
                                                ) : (
                                                    <Link href={`/${locale}/${s.slug[locale]}/${neighborhood.slug}`} className={`rounded underline-offset-4 hover:underline ${focusRing}`}>{tb(s.name, locale)}</Link>
                                                )}
                                            </th>
                                            <td className="px-4 py-3 text-white/80">{formatDuration(s.durationMin, locale)}</td>
                                            <td className="px-4 py-3 text-white/80">${s.priceFrom}</td>
                                            {showBestFor && <td className="px-4 py-3 text-white/70">{rowGuide ? t(rowGuide.bestFor) : ""}</td>}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ZIP check */}
                <section className="border-y border-white/5 bg-[#151B3A] px-6 py-14">
                    <div className="mx-auto max-w-2xl space-y-6 text-center">
                        <h2 className="text-2xl font-bold sm:text-3xl" style={displayFont}>{es ? `¿Estás en ${neighborhood.name}?` : `Are you in ${neighborhood.name}?`}</h2>
                        <p className="text-white/60">{es ? "Verifica tu código postal y reserva en segundos." : "Check your ZIP and book in seconds."}</p>
                        <div className="mx-auto max-w-lg"><ZipChecker dict={dict.zipChecker} lang={locale} /></div>
                    </div>
                </section>

                {/* Final call to action */}
                <section className="mx-auto max-w-5xl px-6 pb-16">
                    <div className="rounded-2xl border border-[#2C355E] bg-[#151B3A] p-8 sm:p-10">
                        <h2 className="text-2xl font-semibold" style={displayFont}>{bookLabel}</h2>
                        <p className="mt-2 max-w-xl text-white/70">{es ? "Primero revisas el trabajo y después autorizas el pago." : "You inspect the work first, then authorize the payment."}</p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link href={bookHref} className={`rounded-full bg-[#D0B078] px-6 py-3 text-sm font-semibold text-[#131835] transition-colors hover:bg-[#dcc08d] ${focusRing}`}>{bookLabel}</Link>
                            {waHref && (
                                <a href={waHref} className={`rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/70 ${focusRing}`}>{es ? "Preguntar por WhatsApp" : "Ask on WhatsApp"}</a>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-white/5 px-6 py-8 text-xs text-white/55">
                <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
                    <p>© {new Date().getFullYear()} Lux Auto Detail Services</p>
                    <div className="flex gap-6">
                        <Link href={`/${locale}`} className={`hover:text-white ${focusRing}`}>{es ? "Inicio" : "Home"}</Link>
                        <Link href={`/${locale}/terms`} className={`hover:text-white ${focusRing}`}>{es ? "Términos" : "Terms"}</Link>
                        <Link href={`/${locale}/privacy`} className={`hover:text-white ${focusRing}`}>{es ? "Privacidad" : "Privacy"}</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
