import type { Metadata } from "next";
import Link from "next/link";
import { i18n, type Locale } from "@/i18n-config";
import BlogShell from "@/components/blog/BlogShell";
import BlogIndexClient, { type CardPost } from "@/components/blog/BlogIndexClient";
import JsonLd from "@/components/seo/JsonLd";
import { getBreadcrumbSchema } from "@/lib/seo/schema";
import { CATEGORIES } from "@/lib/blog/types";
import { formatDate, getPublishedPosts, postPath, readMinutes } from "@/lib/blog/posts";
import { plainText } from "@/components/blog/Inline";

/** /{lang}/blog — list of articles. Hidden from Google until there is at least one article. */

export const revalidate = 3600;

function toLocale(lang: string): Locale {
    return (i18n.locales as readonly string[]).includes(lang) ? (lang as Locale) : i18n.defaultLocale;
}

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const locale = toLocale((await params).lang);
    const es = locale === "es";
    const hasPosts = getPublishedPosts().length > 0;
    return {
        title: es ? "Blog: Consejos de Detallado y Cuidado del Auto en Miami" : "Car Care Blog: Detailing Tips for Miami Drivers",
        description: es
            ? "Guías claras de detallado, lavado y protección para tu auto en Miami-Dade, escritas por el equipo de Lux Auto Detail Services."
            : "Clear guides on detailing, washing and protecting your car in Miami-Dade, written by the Lux Auto Detail Services team.",
        alternates: {
            canonical: `/${locale}/blog`,
            languages: { en: "/en/blog", es: "/es/blog" },
        },
        robots: hasPosts ? { index: true, follow: true } : { index: false, follow: true },
    };
}

export default async function BlogIndexPage({ params }: { params: Promise<{ lang: string }> }) {
    const locale = toLocale((await params).lang);
    const es = locale === "es";
    const posts = getPublishedPosts();

    const cards: CardPost[] = posts.map((p) => ({
        id: p.id,
        href: postPath(p, locale),
        title: plainText(p.title[locale]),
        description: plainText(p.description[locale]),
        category: p.category,
        categoryLabel: CATEGORIES[p.category][locale],
        meta: `${formatDate(p.published, locale)} · ${readMinutes(p, locale)} ${es ? "min de lectura" : "min read"}`,
        cover: p.cover ? { src: p.cover.src, alt: p.cover.alt[locale], position: p.cover.position } : undefined,
    }));

    return (
        <BlogShell locale={locale} switchHref={`/${es ? "en" : "es"}/blog`}>
            <JsonLd data={getBreadcrumbSchema([{ name: es ? "Inicio" : "Home", path: "" }, { name: "Blog", path: "/blog" }], locale)} />

            <section className="mx-auto max-w-5xl px-6 pb-16 pt-12">
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#D0B078]">Blog</p>
                <h1 className="mt-2 text-3xl font-semibold sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                    {es ? "Cuida tu auto en Miami" : "Take care of your car in Miami"}
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-white/70">
                    {es
                        ? "Guías claras de detallado, lavado y protección, escritas por el equipo de Lux Auto Detail Services."
                        : "Clear guides on detailing, washing and protection, written by the Lux Auto Detail Services team."}
                </p>

                {cards.length === 0 ? (
                    <div className="mt-10 rounded-2xl border border-[#2C355E] bg-[#151B3A] p-8">
                        <h2 className="text-xl font-semibold">
                            {es ? "Pronto publicaremos los primeros artículos" : "Our first articles are coming soon"}
                        </h2>
                        <p className="mt-2 max-w-xl text-white/70">
                            {es
                                ? "Mientras tanto, mira nuestros servicios o reserva en minutos: vamos a tu casa u oficina en Miami-Dade."
                                : "In the meantime, see our services or book in minutes: we come to your home or office in Miami-Dade."}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Link
                                href={`/${locale}#services`}
                                className="rounded-full border border-[#D0B078] px-5 py-2 text-sm font-semibold text-[#D0B078] hover:bg-[#D0B078]/10"
                            >
                                {es ? "Ver servicios" : "See services"}
                            </Link>
                            <Link
                                href={`/${locale}/booking/select`}
                                className="rounded-full bg-[#D0B078] px-5 py-2 text-sm font-semibold text-[#131835] hover:bg-[#dcc08d]"
                            >
                                {es ? "Reservar" : "Book now"}
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <BlogIndexClient posts={cards} allLabel={es ? "Todos" : "All"} readLabel={es ? "Leer artículo" : "Read article"} />

                        <div className="mt-14 flex flex-col items-start justify-between gap-5 rounded-2xl border border-[#D0B078]/30 bg-[#D0B078]/5 p-7 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {es ? "¿Prefieres que lo hagamos nosotros?" : "Prefer to leave it to us?"}
                                </h2>
                                <p className="mt-1 text-white/75">
                                    {es
                                        ? "Vamos a tu casa u oficina en Miami-Dade. Reserva en minutos."
                                        : "We come to your home or office in Miami-Dade. Book in minutes."}
                                </p>
                            </div>
                            <Link
                                href={`/${locale}/booking/select`}
                                className="shrink-0 rounded-full bg-[#D0B078] px-6 py-2.5 text-sm font-semibold text-[#131835] hover:bg-[#dcc08d]"
                            >
                                {es ? "Reservar ahora" : "Book now"}
                            </Link>
                        </div>
                    </>
                )}
            </section>
        </BlogShell>
    );
}
