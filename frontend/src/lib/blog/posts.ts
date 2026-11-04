import type { Locale } from "@/i18n-config";
import type { BlogPost, Block } from "./types";

/**
 * The list of blog articles.
 *
 * To publish a new article:
 *   1. Create its file in src/lib/blog/articles/ (copy the shape from types.ts).
 *   2. Add one import and one entry below.
 *
 * While the list is empty, the blog shows "coming soon", is hidden from Google,
 * the menu has no "Blog" link and the sitemap has no blog pages.
 */
const ALL_POSTS: BlogPost[] = [];

const todayIso = (): string => new Date().toISOString().slice(0, 10);

/** Published articles only (no drafts, no future dates), newest first. */
export function getPublishedPosts(): BlogPost[] {
    const today = todayIso();
    return ALL_POSTS.filter((p) => !p.draft && p.published <= today).sort((a, b) =>
        a.published < b.published ? 1 : a.published > b.published ? -1 : 0,
    );
}

export const hasPosts = (): boolean => getPublishedPosts().length > 0;

export const postPath = (post: BlogPost, locale: Locale): string => `/${locale}/blog/${post.slug[locale]}`;

export function getPostBySlug(locale: Locale, slug: string): BlogPost | undefined {
    return getPublishedPosts().find((p) => p.slug[locale] === slug);
}

/** Someone typed /en/ instead of /es/ (or the other way around): find the article by its other address. */
export function getPostByAnySlug(slug: string): BlogPost | undefined {
    return getPublishedPosts().find((p) => p.slug.en === slug || p.slug.es === slug);
}

function blockWords(block: Block, locale: Locale): number {
    const count = (s: string) => s.split(/\s+/).filter(Boolean).length;
    switch (block.type) {
        case "h2":
        case "p":
            return count(block.text[locale]);
        case "callout":
            return count(block.text[locale]);
        case "list":
            return block.items.reduce((n, i) => n + count(i[locale]), 0);
        case "table":
            return block.rows.reduce((n, r) => n + r.reduce((m, c) => m + count(c[locale]), 0), 0);
        default:
            return 0;
    }
}

export function readMinutes(post: BlogPost, locale: Locale): number {
    if (post.readMinutes) return post.readMinutes;
    const words = post.body.reduce((n, b) => n + blockWords(b, locale), 0) + post.quickAnswer[locale].split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
}

export function formatDate(iso: string, locale: Locale): string {
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale === "es" ? "es-US" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
}

/** Up to `limit` other articles: the ones chosen in `related`, then the same category, then the newest. */
export function getRelatedPosts(post: BlogPost, limit = 2): BlogPost[] {
    const others = getPublishedPosts().filter((p) => p.id !== post.id);
    const chosen = (post.related ?? []).map((id) => others.find((p) => p.id === id)).filter((p): p is BlogPost => !!p);
    const sameCategory = others.filter((p) => p.category === post.category && !chosen.includes(p));
    const rest = others.filter((p) => !chosen.includes(p) && !sameCategory.includes(p));
    return [...chosen, ...sameCategory, ...rest].slice(0, limit);
}
