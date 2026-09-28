import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
    Armchair,
    Car,
    Check,
    ChevronDown,
    ChevronRight,
    Clock,
    Droplets,
    Eye,
    House,
    Lightbulb,
    Moon,
    ShieldCheck,
    Sparkles,
    Sun,
    Wallet,
    Wind,
    X,
    type LucideIcon,
} from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { i18n, type Locale } from "@/i18n-config";
import { SERVICES } from "@/lib/seo/services";
import { SERVICE_GUIDES, type IconKey, type L } from "@/lib/seo/serviceGuides";
import { getFaqSchema } from "@/lib/seo/schema";
import JsonLd from "@/components/seo/JsonLd";

/**
 * General (no city) page for each service shown on the home page.
 *
 * - Name, price, duration and the "what's included" list come from the Supabase
 *   `services` table (same source as the home-page cards), cached for 5 minutes.
 * - The educational text (what it is, benefits, care, FAQ) comes from
 *   src/lib/seo/serviceGuides.ts. A service without a guide gets a simpler page.
 * - URL: /{lang}/services/{slug}. The slug is generated from the service name.
 */
export const revalidate = 300;

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
const DEFAULT_COVER = "/images/services/exterior-car-detailing.png";
const SITE_NAME = "Lux Auto Detail Services";

/**
 * English slug of a service -> id of its entry in the SEO catalog (services.ts),
 * where the real photos live. Services not listed here (Full Detail, Paint Enhancement)
 * get the generic cover image and no gallery.
 */
const SEO_ID_BY_SLUG: Record<string, string> = {
    "express-detail": "express-detail",
    "interior-detail": "interior-detailing",
    "exterior-detail": "exterior-detailing",
    "headlight-restoration": "headlight-restoration",
};

const ICONS: Record<IconKey, LucideIcon> = {
    light: Lightbulb,
    night: Moon,
    eye: Eye,
    sparkle: Sparkles,
    wallet: Wallet,
    shield: ShieldCheck,
    car: Car,
    clock: Clock,
    home: House,
    sun: Sun,
    droplets: Droplets,
    wind: Wind,
    armchair: Armchair,
};

const displayFont = { fontFamily: "var(--font-display)" } as const;
const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131835]";
const h2Class = "text-2xl font-semibold sm:text-3xl";

type DbService = {
    id: number;
    name: string;
    name_es: string | null;
    description: string | null;
    description_es: string | null;
    base_price: number;
    duration_minutes: number | null;
    sort_order: number | null;
};

type PageProps = { params: Promise<{ lang: string; service: string }> };

function toLocale(lang: string): Locale {
    return (i18n.locales as readonly string[]).includes(lang) ? (lang as Locale) : i18n.defaultLocale;
}

function slugify(input: string): string {
    return input
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

const LOWER_WORDS = new Set([
    "a", "al", "and", "con", "de", "del", "e", "el", "en", "for", "in", "la", "las", "los", "of", "on", "or", "para", "por", "the", "to", "un", "una", "with", "y",
]);
const KEEP_UPPER = new Set(["suv", "uv", "led", "ppf", "vip"]);

/**
 * Service names are stored in capitals in Supabase ("HEADLIGHT RESTORATION").
 * On this page they read better as "Headlight Restoration". Names that are not
 * entirely in capitals are left exactly as they are. The URL slug is not affected.
 */
function toDisplayName(name: string): string {
    if (name !== name.toUpperCase() || name === name.toLowerCase()) return name;
    let first = true;
    return name.toLowerCase().replace(/[^\s/-]+/g, (word) => {
        const isFirst = first;
        first = false;
        if (KEEP_UPPER.has(word)) return word.toUpperCase();
        if (!isFirst && LOWER_WORDS.has(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
    });
}

const nameOf = (s: DbService, locale: Locale): string =>
    toDisplayName(locale === "es" ? (s.name_es ?? s.name) : s.name);
const slugOf = (s: DbService, locale: Locale): string => slugify(nameOf(s, locale));
const descriptionOf = (s: DbService, locale: Locale): string =>
    locale === "es" ? (s.description_es ?? s.description ?? "") : (s.description ?? "");

function formatDuration(minutes: number, locale: Locale): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    const hourLabel = locale === "es" ? "h" : "hr";
    if (hours === 0) return `${rest} min`;
    return rest === 0 ? `${hours} ${hourLabel}` : `${hours} ${hourLabel} ${rest} min`;
}

type Vars = { price: string; duration: string };

function durationPhrase(minutes: number | null, locale: Locale): string {
    if (!minutes) return locale === "es" ? "poco tiempo" : "a short while";
    return locale === "es"
        ? `aproximadamente ${formatDuration(minutes, locale)}`
        : `about ${formatDuration(minutes, locale)}`;
}

/** Replaces the {price} and {duration} placeholders used in serviceGuides.ts. */
function fill(text: string, vars: Vars): string {
    return text.split("{price}").join(vars.price).split("{duration}").join(vars.duration);
}

function basicDescription(name: string, price: number, locale: Locale): string {
    return locale === "es"
        ? `${name} a domicilio en Miami-Dade: vamos a tu casa u oficina. Desde $${price}. Reserva en línea en minutos.`
        : `${name} in Miami-Dade: we come to your home or office. From $${price}. Book online in minutes.`;
}

type Group = { title?: string; items: string[] };

/**
 * Turns the description text (one item per line) into groups. A line like
 * ">>>>INTERIOR<<<<" or "— Interior —" starts a new group with a heading.
 */
function groupDescription(text: string): Group[] {
    const groups: Group[] = [];
    let current: Group = { items: [] };

    for (const raw of text.split("\n")) {
        const line = raw.trim();
        if (!line) continue;

        const isHeader = line.startsWith(">>>>") || (line.startsWith("—") && line.endsWith("—"));
        if (isHeader) {
            if (current.items.length > 0) groups.push(current);
            const label = line.replace(/[>—<]/g, "").trim().toLowerCase();
            current = { title: label.charAt(0).toUpperCase() + label.slice(1), items: [] };
        } else {
            current.items.push(line);
        }
    }
    if (current.items.length > 0) groups.push(current);
    return groups;
}

async function getServices(): Promise<DbService[]> {
    try {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from("services")
            .select("id, name, name_es, description, description_es, base_price, duration_minutes, sort_order")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .limit(6);
        if (error) {
            console.error("[ServicePage] services query error:", error.message);
            return [];
        }
        return (data ?? []) as unknown as DbService[];
    } catch (e) {
        console.error("[ServicePage] services fetch failed:", e);
        return [];
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { lang, service: slug } = await params;
    const locale = toLocale(lang);
    const services = await getServices();
    const svc = services.find((s) => slugOf(s, locale) === slug);
    if (!svc) return {};

    const name = nameOf(svc, locale);
    const price = Math.round(svc.base_price);
    const guide = SERVICE_GUIDES[slugOf(svc, "en")];
    const vars: Vars = { price: `$${price}`, duration: durationPhrase(svc.duration_minutes, locale) };

    const title = guide ? fill(guide.seoTitle[locale], vars) : name;
    const description = guide ? fill(guide.metaDescription[locale], vars) : basicDescription(name, price, locale);

    return {
        title: guide ? { absolute: title } : title,
        description,
        alternates: {
            canonical: `/${locale}/services/${slug}`,
            languages: {
                en: `/en/services/${slugOf(svc, "en")}`,
                es: `/es/services/${slugOf(svc, "es")}`,
            },
        },
        openGraph: {
            type: "website",
            siteName: SITE_NAME,
            title,
            description,
            url: `/${locale}/services/${slug}`,
            locale: locale === "es" ? "es_ES" : "en_US",
        },
    };
}

export default async function ServicePage({ params }: PageProps) {
    const { lang, service: slug } = await params;
    const locale = toLocale(lang);
    const isEs = locale === "es";

    const services = await getServices();
    const svc = services.find((s) => slugOf(s, locale) === slug);
    if (!svc) {
        // Someone changed /en/ to /es/ (or the other way around) by hand: send them to the right address.
        const other = services.find((s) => slugOf(s, "en") === slug || slugOf(s, "es") === slug);
        if (other) permanentRedirect(`/${locale}/services/${slugOf(other, locale)}`);
        notFound();
    }

    const name = nameOf(svc, locale);
    const price = Math.round(svc.base_price);
    const groups = groupDescription(descriptionOf(svc, locale));
    const guide = SERVICE_GUIDES[slugOf(svc, "en")];
    const vars: Vars = { price: `$${price}`, duration: durationPhrase(svc.duration_minutes, locale) };
    const t = (text: L): string => fill(text[locale], vars);
    const others = services.filter((s) => s.id !== svc.id);

    // Photos: real ones for the services that have them, generic cover otherwise.
    const seo = SERVICES.find((x) => x.id === SEO_ID_BY_SLUG[slugOf(svc, "en")]);
    const gallery = (seo?.imageUrls ?? []).slice(0, 6);
    const cover = guide?.photos?.cover ?? gallery[0] ?? seo?.imageUrl ?? DEFAULT_COVER;
    const coverPosition = guide?.photos?.coverPosition;

    // The booking page matches services by their English name, as in "Book Again".
    const bookHref = `/${locale}/booking/select?service=${encodeURIComponent(svc.name)}`;
    const waText = encodeURIComponent(isEs ? `Hola, quisiera reservar ${name}.` : `Hi, I would like to book ${name}.`);
    const waHref = WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${waText}` : null;

    const steps = isEs
        ? [
              { title: "Reserva en línea", text: "Elige tu vehículo y un horario que te convenga." },
              { title: "Vamos a ti", text: "Nuestro equipo llega a tu casa u oficina en Miami-Dade." },
              { title: "Revisa y luego paga", text: "Revisa el trabajo primero. El pago se autoriza solo después de que lo apruebes." },
          ]
        : [
              { title: "Book online", text: "Choose your vehicle and a time that works for you." },
              { title: "We come to you", text: "Our team arrives at your home or office in Miami-Dade." },
              { title: "Inspect, then pay", text: "Check the work first. The payment is authorized only after you approve it." },
          ];

    // Comparison table: only show the "best for" column once every service has a guide.
    const showBestFor = services.length > 0 && services.every((s) => SERVICE_GUIDES[slugOf(s, "en")]);

    const serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        name,
        description: guide ? fill(guide.metaDescription[locale], vars) : basicDescription(name, price, locale),
        provider: { "@type": "Organization", name: SITE_NAME },
        areaServed: { "@type": "AdministrativeArea", name: "Miami-Dade County, FL" },
        offers: { "@type": "AggregateOffer", priceCurrency: "USD", lowPrice: price },
    };
    const schemas: Record<string, unknown>[] = [serviceSchema];
    if (guide) schemas.push(getFaqSchema(guide.faqs.map((f) => ({ q: t(f.q), a: t(f.a) }))));

    const h1Lead = isEs ? `${name} a domicilio en` : `${name} in`;
    const bookLabel = isEs ? `Reservar ${name}` : `Book ${name}`;

    return (
        <div className="min-h-screen bg-[#131835] text-white">
            <JsonLd data={schemas} />

            <header className="border-b border-white/5">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                    <Link
                        href={`/${locale}`}
                        aria-label={isEs ? "Ir al inicio" : "Go to home"}
                        className={`rounded ${focusRing}`}
                    >
                        <Image
                            src="/dtailwash_logo_final.png"
                            alt={SITE_NAME}
                            width={1942}
                            height={809}
                            className="h-11 w-auto sm:h-14"
                        />
                    </Link>
                    <div className="flex items-center gap-3">
                        {waHref && (
                            <a
                                href={waHref}
                                className={`hidden rounded-full bg-[#25D366] px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03] sm:inline-block ${focusRing}`}
                            >
                                WhatsApp
                            </a>
                        )}
                        <Link
                            href={bookHref}
                            className={`rounded-full bg-[#D0B078] px-5 py-2 text-sm font-semibold text-[#131835] transition-colors hover:bg-[#dcc08d] ${focusRing}`}
                        >
                            {isEs ? "Reservar" : "Book now"}
                        </Link>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero */}
                <section className="relative isolate overflow-hidden">
                    <Image
                        src={cover}
                        alt={`${name} – ${SITE_NAME}`}
                        fill
                        priority
                        sizes="100vw"
                        style={coverPosition ? { objectPosition: coverPosition } : undefined}
                        className="-z-10 object-cover"
                    />
                    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#131835] via-[#131835]/80 to-[#131835]/40" />
                    <div
                        className={`mx-auto grid min-h-[360px] max-w-5xl gap-8 px-6 pb-12 pt-20 sm:min-h-[440px] ${
                            others.length > 0 ? "lg:grid-cols-[1.25fr_1fr] lg:items-end" : "items-end"
                        }`}
                    >
                        <div className="self-end">
                            <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl" style={displayFont}>
                                {h1Lead} <span className="whitespace-nowrap">Miami-Dade</span>
                            </h1>
                            {guide && <p className="mt-4 max-w-xl text-lg text-white/85">{t(guide.heroSub)}</p>}
                            <p className="mt-4 text-white/85">
                                {isEs ? "Desde " : "From "}
                                <span className="font-semibold text-[#D0B078]">${price}</span>
                                {svc.duration_minutes
                                    ? isEs
                                        ? `. Dura aproximadamente ${formatDuration(svc.duration_minutes, locale)}.`
                                        : `. Takes about ${formatDuration(svc.duration_minutes, locale)}.`
                                    : "."}
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href={bookHref}
                                    className={`rounded-full bg-[#D0B078] px-6 py-3 text-sm font-semibold text-[#131835] transition-colors hover:bg-[#dcc08d] ${focusRing}`}
                                >
                                    {bookLabel}
                                </Link>
                                {waHref && (
                                    <a
                                        href={waHref}
                                        className={`rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/70 ${focusRing}`}
                                    >
                                        {isEs ? "Preguntar por WhatsApp" : "Ask on WhatsApp"}
                                    </a>
                                )}
                            </div>
                        </div>

                        {others.length > 0 && (
                            <aside className="rounded-2xl border border-white/10 bg-[#0f1430]/85 p-6 backdrop-blur">
                                <h2 className="text-base font-semibold text-[#D0B078]">
                                    {isEs ? "Otros servicios" : "Other services"}
                                </h2>
                                <ul className="mt-3 divide-y divide-white/10">
                                    {others.map((s) => (
                                        <li key={s.id}>
                                            <Link
                                                href={`/${locale}/services/${slugOf(s, locale)}`}
                                                className={`flex items-center justify-between gap-3 py-3 text-sm transition-colors hover:text-[#D0B078] ${focusRing}`}
                                            >
                                                <span className="font-medium">{nameOf(s, locale)}</span>
                                                <span className="flex shrink-0 items-center gap-1 text-white/65">
                                                    {isEs ? "desde" : "from"} ${Math.round(s.base_price)}
                                                    <ChevronRight aria-hidden="true" className="h-4 w-4" />
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </aside>
                        )}
                    </div>
                </section>

                {guide && (
                    <>
                        {/* Quick answer */}
                        <section className="mx-auto max-w-5xl px-6 pt-10">
                            <div className="rounded-2xl border border-[#D0B078]/30 bg-[#D0B078]/5 p-6">
                                <h2 className="text-lg font-semibold">{isEs ? "Respuesta rápida" : "Quick answer"}</h2>
                                <p className="mt-2 max-w-3xl text-white/85">{t(guide.quickAnswer)}</p>
                            </div>
                        </section>

                        {/* What it is + what it can and can't fix */}
                        <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[1.2fr_1fr]">
                            <div>
                                <h2 className={h2Class} style={displayFont}>
                                    {t(guide.scienceTitle)}
                                </h2>
                                <div className="mt-5 max-w-prose space-y-4 text-white/80">
                                    {guide.science.map((paragraph, i) => (
                                        <p key={i}>{t(paragraph)}</p>
                                    ))}
                                </div>
                                <ul className="mt-6 flex flex-wrap gap-2">
                                    {guide.keywords.map((keyword, i) => (
                                        <li
                                            key={i}
                                            className="rounded-full border border-[#2C355E] px-4 py-1.5 text-sm text-white/80"
                                        >
                                            {t(keyword)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-6 self-start rounded-2xl border border-[#2C355E] bg-[#151B3A] p-6">
                                <div>
                                    <h3 className="font-semibold text-[#D0B078]">{t(guide.limits.canTitle)}</h3>
                                    <ul className="mt-3 space-y-2.5 text-white/80">
                                        {guide.limits.can.map((item, i) => (
                                            <li key={i} className="flex gap-3">
                                                <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[#D0B078]" />
                                                <span>{t(item)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold">{t(guide.limits.cannotTitle)}</h3>
                                    <ul className="mt-3 space-y-2.5 text-white/70">
                                        {guide.limits.cannot.map((item, i) => (
                                            <li key={i} className="flex gap-3">
                                                <X aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-white/50" />
                                                <span>{t(item)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Before and after photos */}
                        {guide.photos?.beforeAfter && guide.photos.beforeAfterTitle && guide.photos.beforeAfter.length > 0 && (
                            <section className="mx-auto max-w-5xl px-6 pb-12">
                                <h2 className={h2Class} style={displayFont}>
                                    {t(guide.photos.beforeAfterTitle)}
                                </h2>
                                {guide.photos.beforeAfterIntro && (
                                    <p className="mt-3 max-w-xl text-white/70">{t(guide.photos.beforeAfterIntro)}</p>
                                )}
                                <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
                                    {guide.photos.beforeAfter.map((pair, i) => (
                                        <figure key={i}>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(["before", "after"] as const).map((side) => {
                                                    const sideLabel =
                                                        side === "before"
                                                            ? isEs ? "Antes" : "Before"
                                                            : isEs ? "Después" : "After";
                                                    return (
                                                        <div
                                                            key={side}
                                                            className={`relative overflow-hidden rounded-xl ${
                                                                pair.orientation === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]"
                                                            }`}
                                                        >
                                                            <Image
                                                                src={pair[side]}
                                                                alt={`${t(pair.caption)} – ${sideLabel.toLowerCase()}`}
                                                                fill
                                                                sizes="(min-width: 1024px) 25vw, 50vw"
                                                                className="object-cover"
                                                            />
                                                            <span
                                                                className={`absolute left-2 top-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                                                    side === "after"
                                                                        ? "bg-[#D0B078] text-[#131835]"
                                                                        : "bg-black/70 text-white"
                                                                }`}
                                                            >
                                                                {sideLabel}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <figcaption className="mt-3 text-sm text-white/70">{t(pair.caption)}</figcaption>
                                        </figure>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Benefits */}
                        <section className="border-y border-white/5 bg-[#151B3A]">
                            <div className="mx-auto max-w-5xl px-6 py-12">
                                <h2 className={h2Class} style={displayFont}>
                                    {t(guide.benefitsTitle)}
                                </h2>
                                <p className="mt-3 max-w-xl text-white/70">{t(guide.benefitsIntro)}</p>
                                <ul
                                    className={`mt-8 grid gap-4 sm:grid-cols-2 ${
                                        guide.benefits.length === 6 ? "lg:grid-cols-3" : "lg:grid-cols-4"
                                    }`}
                                >
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
                    </>
                )}

                {/* What's included (from Supabase) */}
                {groups.length > 0 && (
                    <section className="mx-auto max-w-5xl px-6 py-12">
                        <h2 className={h2Class} style={displayFont}>
                            {isEs ? "Qué incluye" : "What's included"}
                        </h2>
                        <div className={`mt-6 ${groups.length > 1 ? "grid gap-8 sm:grid-cols-2" : "max-w-xl"}`}>
                            {groups.map((group, gi) => (
                                <div key={gi}>
                                    {group.title && (
                                        <h3 className="mb-3 text-base font-semibold text-[#D0B078]">{group.title}</h3>
                                    )}
                                    <ul className="space-y-2.5 text-white/80">
                                        {group.items.map((item, i) => (
                                            <li key={i} className="flex gap-3">
                                                <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[#D0B078]" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* How it works */}
                <section className="border-y border-white/5 bg-[#151B3A]">
                    <div className="mx-auto max-w-5xl px-6 py-12">
                        <h2 className={h2Class} style={displayFont}>
                            {isEs ? "Cómo funciona" : "How it works"}
                        </h2>
                        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
                            {steps.map((step, i) => (
                                <li key={step.title} className="flex gap-4">
                                    <span
                                        aria-hidden="true"
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D0B078]/50 text-sm font-semibold text-[#D0B078]"
                                    >
                                        {i + 1}
                                    </span>
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
                        <h2 className={h2Class} style={displayFont}>
                            {t(guide.careTitle)}
                        </h2>
                        <p className="mt-3 max-w-xl text-white/70">{t(guide.careIntro)}</p>
                        <ul className="mt-6 max-w-2xl space-y-3 text-white/80">
                            {guide.care.map((tip, i) => (
                                <li key={i} className="flex gap-3">
                                    <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[#D0B078]" />
                                    <span>{t(tip)}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Photos */}
                {gallery.length > 1 && !guide?.photos?.beforeAfter && (
                    <section className="mx-auto max-w-5xl px-6 py-12">
                        <h2 className={h2Class} style={displayFont}>
                            {isEs ? "Trabajos recientes" : "Recent work"}
                        </h2>
                        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {gallery.map((src, i) => (
                                <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                                    <Image
                                        src={src}
                                        alt={`${name} – ${isEs ? "foto" : "photo"} ${i + 1}`}
                                        fill
                                        sizes="(min-width: 640px) 33vw, 50vw"
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* FAQ */}
                {guide && (
                    <section className="border-t border-white/5 bg-[#151B3A]">
                        <div className="mx-auto max-w-3xl px-6 py-12">
                            <h2 className={h2Class} style={displayFont}>
                                {isEs ? "Preguntas frecuentes" : "Frequently asked questions"}
                            </h2>
                            <div className="mt-6 space-y-3">
                                {guide.faqs.map((faq, i) => (
                                    <details
                                        key={i}
                                        className="group rounded-xl border border-[#2C355E] bg-[#131835] open:border-[#D0B078]/50"
                                    >
                                        <summary
                                            className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 font-medium [&::-webkit-details-marker]:hidden ${focusRing}`}
                                        >
                                            <span>{t(faq.q)}</span>
                                            <ChevronDown
                                                aria-hidden="true"
                                                className="h-5 w-5 shrink-0 text-[#D0B078] transition-transform group-open:rotate-180"
                                            />
                                        </summary>
                                        <p className="max-w-2xl px-5 pb-5 text-white/75">{t(faq.a)}</p>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Compare services */}
                {services.length > 1 && (
                    <section className="mx-auto max-w-5xl px-6 py-12">
                        <h2 className={h2Class} style={displayFont}>
                            {isEs ? "¿Qué servicio es para ti?" : "Which service fits you?"}
                        </h2>
                        <p className="mt-3 max-w-xl text-white/70">
                            {isEs
                                ? "Compara el tiempo y el precio de cada servicio."
                                : "Compare the time and starting price of each service."}
                        </p>
                        <div className="mt-6 overflow-x-auto rounded-2xl border border-[#2C355E]">
                            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                                <caption className="sr-only">
                                    {isEs ? "Comparación de servicios" : "Service comparison"}
                                </caption>
                                <thead className="bg-[#0f1430] text-white/70">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 font-medium">
                                            {isEs ? "Servicio" : "Service"}
                                        </th>
                                        <th scope="col" className="px-4 py-3 font-medium">
                                            {isEs ? "Tiempo" : "Time"}
                                        </th>
                                        <th scope="col" className="px-4 py-3 font-medium">
                                            {isEs ? "Desde" : "From"}
                                        </th>
                                        {showBestFor && (
                                            <th scope="col" className="px-4 py-3 font-medium">
                                                {isEs ? "Ideal para" : "Best for"}
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {services.map((s) => {
                                        const isCurrent = s.id === svc.id;
                                        const rowGuide = SERVICE_GUIDES[slugOf(s, "en")];
                                        return (
                                            <tr
                                                key={s.id}
                                                className={`border-t border-[#2C355E] ${isCurrent ? "bg-[#D0B078]/10" : ""}`}
                                            >
                                                <th scope="row" className="px-4 py-3 font-medium">
                                                    {isCurrent ? (
                                                        <span className="text-[#D0B078]">
                                                            {nameOf(s, locale)}
                                                            <span className="sr-only">
                                                                {isEs ? " (página actual)" : " (current page)"}
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <Link
                                                            href={`/${locale}/services/${slugOf(s, locale)}`}
                                                            className={`rounded underline-offset-4 hover:underline ${focusRing}`}
                                                        >
                                                            {nameOf(s, locale)}
                                                        </Link>
                                                    )}
                                                </th>
                                                <td className="px-4 py-3 text-white/80">
                                                    {s.duration_minutes ? formatDuration(s.duration_minutes, locale) : "—"}
                                                </td>
                                                <td className="px-4 py-3 text-white/80">${Math.round(s.base_price)}</td>
                                                {showBestFor && (
                                                    <td className="px-4 py-3 text-white/70">
                                                        {rowGuide ? t(rowGuide.bestFor) : ""}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Final call to action */}
                <section className="mx-auto max-w-5xl px-6 pb-16">
                    <div className="rounded-2xl border border-[#2C355E] bg-[#151B3A] p-8 sm:p-10">
                        <h2 className="text-2xl font-semibold" style={displayFont}>
                            {bookLabel}
                        </h2>
                        <p className="mt-2 max-w-xl text-white/70">
                            {isEs
                                ? "Primero revisas el trabajo y después autorizas el pago."
                                : "You inspect the work first, then authorize the payment."}
                        </p>
                        <Link
                            href={bookHref}
                            className={`mt-6 inline-block rounded-full bg-[#D0B078] px-6 py-3 text-sm font-semibold text-[#131835] transition-colors hover:bg-[#dcc08d] ${focusRing}`}
                        >
                            {bookLabel}
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="border-t border-white/5 px-6 py-8 text-xs text-white/55">
                <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
                    <p>
                        © {new Date().getFullYear()} {SITE_NAME}
                    </p>
                    <div className="flex gap-6">
                        <Link href={`/${locale}`} className={`hover:text-white ${focusRing}`}>
                            {isEs ? "Inicio" : "Home"}
                        </Link>
                        <Link href={`/${locale}/terms`} className={`hover:text-white ${focusRing}`}>
                            {isEs ? "Términos" : "Terms"}
                        </Link>
                        <Link href={`/${locale}/privacy`} className={`hover:text-white ${focusRing}`}>
                            {isEs ? "Privacidad" : "Privacy"}
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
