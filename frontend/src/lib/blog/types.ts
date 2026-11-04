import type { L } from "@/lib/seo/serviceGuides";

/**
 * Blog content model. One article = one file in src/lib/blog/articles/, written in both languages.
 *
 * Inside any text you can use two small marks:
 *   [link text](/{lang}/services/interior-detail)   a link; {lang} becomes "en" or "es"
 *   **bold text**                                    bold
 */

export type CategoryKey = "interior" | "exterior" | "paint" | "tips";

export const CATEGORIES: Record<CategoryKey, L> = {
    interior: { en: "Interior", es: "Interior" },
    exterior: { en: "Exterior", es: "Exterior" },
    paint: { en: "Paint & ceramic", es: "Pintura y cerámica" },
    tips: { en: "Prices & tips", es: "Precios y consejos" },
};

export type Block =
    | { type: "h2"; text: L }
    | { type: "p"; text: L }
    | { type: "list"; items: L[]; ordered?: boolean }
    | { type: "callout"; title?: L; text: L }
    | { type: "image"; src: string; alt: L; caption?: L }
    | { type: "table"; head: L[]; rows: L[][] };

export interface BlogPost {
    /** Internal name, used to link related articles. Never shown. */
    id: string;
    /** Address of the article in each language. Do NOT change after publishing. */
    slug: L;
    title: L;
    /** Title shown in Google (optional; defaults to the title). Keep it near 60 characters. */
    seoTitle?: L;
    /** Meta description and card text. Keep it near 155 characters. */
    description: L;
    category: CategoryKey;
    /** YYYY-MM-DD. An article with a future date stays hidden until that day. */
    published: string;
    /** YYYY-MM-DD, only if the article was meaningfully updated. */
    updated?: string;
    /** true = not shown anywhere yet. */
    draft?: boolean;
    /** Minutes to read. If missing, it is estimated from the text. */
    readMinutes?: number;
    /** Optional. Without a cover the article uses a plain background with an icon. */
    cover?: { src: string; alt: L; position?: string };
    /** Short direct answer shown right under the title. */
    quickAnswer: L;
    body: Block[];
    faqs?: { q: L; a: L }[];
    /** Card with a button to a service, shown after the text. */
    cta?: { title: L; text: L; href: L; label: L };
    /** ids of related articles (optional; otherwise same-category articles are used). */
    related?: string[];
}
