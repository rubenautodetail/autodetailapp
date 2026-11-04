import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { i18n, type Locale } from "@/i18n-config";
import BlogShell from "@/components/blog/BlogShell";
import Inline, { plainText } from "@/components/blog/Inline";
import JsonLd from "@/components/seo/JsonLd";
import { getBreadcrumbSchema, getFaqSchema } from "@/lib/seo/schema";
import { slugify } from "@/lib/seo/serviceNames";
import { CATEGORIES, type Block } from "@/lib/blog/types";
import {
    formatDate,
    getPostByAnySlug,
    getPostBySlug,
    getPublishedPosts,
    getRelatedPosts,
    postPath,
    readMinutes,
} from "@/lib/blog/posts";

/** /{lang}/blog/{slug} — one article. */

export const revalidate = 3600;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dtailwash.com";
const SITE_NAME = "Lux Auto Detail Services";
const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131835]";

type PageProps = { params: Promise<{ lang: string; slug: string }> };

function toLocale(lang: string): Locale {
    return (i18n.locales as readonly string[]).includes(lang) ? (lang as Locale) : i18n.defaultLocale;
}

export async function generateStaticParams() {
    return getPublishedPosts().flatMap((p) => i18n.locales.map((locale) => ({ lang: locale, slug: p.slug[locale] })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { lang, slug } = await params;
    const locale = toLocale(lang);
    const post = getPostBySlug(locale, slug);
    if (!post) return {};

    const title = post.seoTitle?.[locale] ?? `${plainText(post.title[locale])} | ${SITE_NAME}`;
    const description = plainText(post.description[locale]);
    return {
        title: { absolute: title },
        description,
        alternates: {
            canonical: postPath(post, locale),
            languages: { en: postPath(post, "en"), es: postPath(post, "es") },
        },
        openGraph: {
            type: "article",
            siteName: SITE_NAME,
            title,
            description,
            url: postPath(post, locale),
            locale: locale === "es" ? "es_ES" : "en_US",
            publishedTime: post.published,
            modifiedTime: post.updated ?? post.published,
            ...(post.cover ? { images: [{ url: post.cover.src, alt: post.cover.alt[locale] }] } : {}),
        },
    };
}

function BlockView({ block, locale, index }: { block: Block; locale: Locale; index: number }) {
    switch (block.type) {
        case "h2":
            return (
                <h2
                    id={slugify(plainText(block.text[locale]))}
                    className="mt-12 scroll-mt-24 text-2xl font-semibold sm:text-3xl"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    <Inline text={block.text[locale]} locale={locale} />
                </h2>
            );
        case "p":
            return (
                <p className="mt-5 text-[17px] leading-8 text-white/80">
                    <Inline text={block.text[locale]} locale={locale} />
                </p>
            );
        case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return (
                <Tag
                    className={`mt-5 space-y-2 pl-6 text-[17px] leading-8 text-white/80 ${
                        block.ordered ? "list-decimal" : "list-disc"
                    } marker:text-[#D0B078]`}
                >
                    {block.items.map((item, i) => (
                        <li key={i}>
                            <Inline text={item[locale]} locale={locale} />
                        </li>
                    ))}
                </Tag>
            );
        }
        case "callout":
            return (
                <aside className="mt-8 rounded-2xl border border-[#D0B078]/30 bg-[#D0B078]/5 p-6">
                    {block.title && <p className="font-semibold">{block.title[locale]}</p>}
                    <p className={`${block.title ? "mt-2" : ""} leading-7 text-white/85`}>
                        <Inline text={block.text[locale]} locale={locale} />
                    </p>
                </aside>
            );
        case "image":
            return (
                <figure className="mt-8">
                    <Image
                        src={block.src}
                        alt={block.alt[locale]}
                        width={1200}
                        height={800}
                        sizes="(min-width: 768px) 720px, 100vw"
                        className="h-auto w-full rounded-2xl"
                    />
                    {block.caption && <figcaption className="mt-2 text-sm text-white/60">{block.caption[locale]}</figcaption>}
                </figure>
            );
        case "table":
            return (
                <div className="mt-8 overflow-x-auto rounded-2xl border border-[#2C355E]" key={index}>
                    <table className="w-full min-w-[480px] text-left text-sm">
                        <thead className="bg-[#151B3A] text-[#D0B078]">
                            <tr>
                                {block.head.map((h, i) => (
                                    <th key={i} className="px-4 py-3 font-semibold">
                                        {h[locale]}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {block.rows.map((row, r) => (
                                <tr key={r} className="border-t border-[#2C355E] text-white/80">
                                    {row.map((cell, c) => (
                                        <td key={c} className="px-4 py-3 align-top">
                                            <Inline text={cell[locale]} locale={locale} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
    }
}

export default async function BlogPostPage({ params }: PageProps) {
    const { lang, slug } = await params;
    const locale = toLocale(lang);
    const es = locale === "es";

    const post = getPostBySlug(locale, slug);
    if (!post) {
        // Someone changed /en/ to /es/ (or the other way around) by hand: send them to the right address.
        const other = getPostByAnySlug(slug);
        if (other) permanentRedirect(postPath(other, locale));
        notFound();
    }

    const title = plainText(post.title[locale]);
    const url = `${APP_URL}${postPath(post, locale)}`;
    const headings = post.body.filter((b): b is Extract<Block, { type: "h2" }> => b.type === "h2");
    const related = getRelatedPosts(post);
    const minutes = readMinutes(post, locale);
    const readLabel = `${minutes} ${es ? "min de lectura" : "min read"}`;

    const blogPosting = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title,
        description: plainText(post.description[locale]),
        inLanguage: locale,
        datePublished: post.published,
        dateModified: post.updated ?? post.published,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        author: { "@type": "Organization", name: SITE_NAME, "@id": `${APP_URL}/#organization` },
        publisher: { "@type": "Organization", name: SITE_NAME, "@id": `${APP_URL}/#organization` },
        ...(post.cover ? { image: [`${APP_URL}${post.cover.src}`] } : {}),
    };
    const schemas: Record<string, unknown>[] = [
        blogPosting,
        getBreadcrumbSchema(
            [
                { name: es ? "Inicio" : "Home", path: "" },
                { name: "Blog", path: "/blog" },
                { name: title, path: `/blog/${post.slug[locale]}` },
            ],
            locale,
        ),
    ];
    if (post.faqs && post.faqs.length > 0) {
        schemas.push(getFaqSchema(post.faqs.map((f) => ({ q: plainText(f.q[locale]), a: plainText(f.a[locale]) }))));
    }

    return (
        <BlogShell locale={locale} switchHref={postPath(post, es ? "en" : "es")}>
            <JsonLd data={schemas} />

            <article className="mx-auto max-w-3xl px-6 pb-16 pt-10">
                <nav aria-label="Breadcrumb" className="text-sm text-white/55">
                    <Link href={`/${locale}`} className="hover:text-white">
                        {es ? "Inicio" : "Home"}
                    </Link>
                    <span aria-hidden="true"> › </span>
                    <Link href={`/${locale}/blog`} className="hover:text-white">
                        Blog
                    </Link>
                </nav>

                <span className="mt-5 inline-block rounded-full border border-[#D0B078]/30 bg-[#D0B078]/10 px-3 py-0.5 text-xs font-semibold text-[#D0B078]">
                    {CATEGORIES[post.category][locale]}
                </span>
                <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                    <Inline text={post.title[locale]} locale={locale} />
                </h1>
                <p className="mt-4 text-sm text-white/60">
                    <span className="font-semibold text-white/80">{SITE_NAME}</span> · {formatDate(post.published, locale)} ·{" "}
                    {readLabel}
                    {post.updated && post.updated !== post.published && (
                        <>
                            {" "}
                            · {es ? "Actualizado" : "Updated"} {formatDate(post.updated, locale)}
                        </>
                    )}
                </p>

                {post.cover && (
                    <div className="relative mt-8 aspect-[16/8] overflow-hidden rounded-2xl">
                        <Image
                            src={post.cover.src}
                            alt={post.cover.alt[locale]}
                            fill
                            priority
                            sizes="(min-width: 768px) 720px, 100vw"
                            className="object-cover"
                            style={post.cover.position ? { objectPosition: post.cover.position } : undefined}
                        />
                    </div>
                )}

                <div className="mt-8 rounded-2xl border border-[#D0B078]/30 bg-[#D0B078]/5 p-6">
                    <h2 className="text-lg font-semibold">{es ? "Respuesta rápida" : "Quick answer"}</h2>
                    <p className="mt-2 leading-7 text-white/85">
                        <Inline text={post.quickAnswer[locale]} locale={locale} />
                    </p>
                </div>

                {headings.length >= 3 && (
                    <nav aria-label={es ? "En este artículo" : "In this article"} className="mt-6 rounded-2xl border border-[#2C355E] bg-[#151B3A] p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#D0B078]">
                            {es ? "En este artículo" : "In this article"}
                        </p>
                        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-white/80">
                            {headings.map((h, i) => (
                                <li key={i}>
                                    <a
                                        href={`#${slugify(plainText(h.text[locale]))}`}
                                        className={`rounded hover:text-[#D0B078] ${focusRing}`}
                                    >
                                        {plainText(h.text[locale])}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}

                <div>
                    {post.body.map((block, i) => (
                        <BlockView key={i} block={block} locale={locale} index={i} />
                    ))}
                </div>

                {post.cta && (
                    <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#2C355E] bg-[#151B3A] p-6 sm:flex-row sm:items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-[#D0B078]">{post.cta.title[locale]}</h3>
                            <p className="mt-1 text-sm text-white/70">{post.cta.text[locale]}</p>
                        </div>
                        <Link
                            href={post.cta.href[locale]}
                            className={`shrink-0 rounded-full bg-[#D0B078] px-6 py-2.5 text-sm font-semibold text-[#131835] hover:bg-[#dcc08d] ${focusRing}`}
                        >
                            {post.cta.label[locale]} →
                        </Link>
                    </div>
                )}

                {post.faqs && post.faqs.length > 0 && (
                    <section className="mt-14">
                        <h2 className="text-2xl font-semibold sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                            {es ? "Preguntas frecuentes" : "Frequently asked questions"}
                        </h2>
                        <div className="mt-6 space-y-3">
                            {post.faqs.map((faq, i) => (
                                <details
                                    key={i}
                                    className="group rounded-xl border border-[#2C355E] bg-[#131835] open:border-[#D0B078]/50"
                                >
                                    <summary
                                        className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 font-medium [&::-webkit-details-marker]:hidden ${focusRing}`}
                                    >
                                        <span>{plainText(faq.q[locale])}</span>
                                        <ChevronDown
                                            aria-hidden="true"
                                            className="h-5 w-5 shrink-0 text-[#D0B078] transition-transform group-open:rotate-180"
                                        />
                                    </summary>
                                    <p className="max-w-2xl px-5 pb-5 text-white/75">
                                        <Inline text={faq.a[locale]} locale={locale} />
                                    </p>
                                </details>
                            ))}
                        </div>
                    </section>
                )}

                {related.length > 0 && (
                    <section className="mt-14">
                        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                            {es ? "Sigue leyendo" : "Keep reading"}
                        </h2>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            {related.map((p) => (
                                <Link
                                    key={p.id}
                                    href={postPath(p, locale)}
                                    className={`group rounded-2xl border border-[#2C355E] bg-[#151B3A] p-5 ${focusRing}`}
                                >
                                    <span className="rounded-full border border-[#D0B078]/30 bg-[#D0B078]/10 px-3 py-0.5 text-xs font-semibold text-[#D0B078]">
                                        {CATEGORIES[p.category][locale]}
                                    </span>
                                    <h3 className="mt-3 font-semibold leading-snug group-hover:text-[#D0B078]">
                                        {plainText(p.title[locale])}
                                    </h3>
                                    <p className="mt-2 text-xs text-white/50">
                                        {readMinutes(p, locale)} {es ? "min de lectura" : "min read"}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </article>
        </BlogShell>
    );
}
