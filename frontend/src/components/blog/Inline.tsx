import Link from "next/link";
import type { ReactNode } from "react";

const TOKEN = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g;

/** Turns [text](url) into links and **text** into bold. {lang} in a url becomes the current language. */
export default function Inline({ text, locale }: { text: string; locale: "en" | "es" }) {
    const parts = text.split(TOKEN).filter((p) => p !== "");
    const nodes: ReactNode[] = parts.map((part, i) => {
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
            const href = link[2].split("{lang}").join(locale);
            const className = "font-medium text-[#D0B078] underline underline-offset-2 hover:text-[#dcc08d]";
            return /^https?:\/\//.test(href) ? (
                <a key={i} href={href} className={className} rel="noopener noreferrer">
                    {link[1]}
                </a>
            ) : (
                <Link key={i} href={href} className={className}>
                    {link[1]}
                </Link>
            );
        }
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        if (bold) return <strong key={i} className="font-semibold text-white">{bold[1]}</strong>;
        return <span key={i}>{part}</span>;
    });
    return <>{nodes}</>;
}

/** Same marks, as plain text (for Google data and meta tags). */
export function plainText(text: string): string {
    return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1");
}
