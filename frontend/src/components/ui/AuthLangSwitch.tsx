"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * ES/EN pill for the login / register / password pages.
 * Swaps the language in the URL and keeps the rest (including ?next=...).
 * Uses the page theme colours, so it works in light and dark mode.
 */
function Inner() {
    const pathname = usePathname() || "/en";
    const search = useSearchParams();
    const parts = pathname.split("/");
    const current = parts[1] === "es" ? "es" : "en";
    const other = current === "es" ? "en" : "es";
    parts[1] = other;
    const qs = search?.toString();
    const href = parts.join("/") + (qs ? `?${qs}` : "");
    return (
        <Link
            href={href}
            hrefLang={other}
            lang={other}
            aria-label={other === "es" ? "Ver esta página en español" : "View this page in English"}
            className="fixed right-4 top-4 z-20 flex h-9 items-center rounded-full border border-[var(--divider)] bg-[var(--card)] px-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)] shadow-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
            {other.toUpperCase()}
        </Link>
    );
}

export default function AuthLangSwitch() {
    return (
        <Suspense fallback={null}>
            <Inner />
        </Suspense>
    );
}
