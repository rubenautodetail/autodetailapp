"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Armchair, Car, Lightbulb, Sparkles, type LucideIcon } from "lucide-react";
import type { CategoryKey } from "@/lib/blog/types";

export interface CardPost {
    id: string;
    href: string;
    title: string;
    description: string;
    category: CategoryKey;
    categoryLabel: string;
    meta: string; // "Nov 3, 2026 · 5 min read"
    cover?: { src: string; alt: string; position?: string };
}

const ICONS: Record<CategoryKey, LucideIcon> = {
    interior: Armchair,
    exterior: Car,
    paint: Sparkles,
    tips: Lightbulb,
};

const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131835]";

function Cover({ post, sizes, className }: { post: CardPost; sizes: string; className: string }) {
    const Icon = ICONS[post.category];
    return (
        <div className={`relative overflow-hidden ${className}`}>
            {post.cover ? (
                <Image
                    src={post.cover.src}
                    alt={post.cover.alt}
                    fill
                    sizes={sizes}
                    className="object-cover"
                    style={post.cover.position ? { objectPosition: post.cover.position } : undefined}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1c2350] to-[#151B3A]">
                    <Icon aria-hidden="true" className="h-12 w-12 text-[#D0B078]/70" />
                </div>
            )}
        </div>
    );
}

const tagClass =
    "inline-block rounded-full border border-[#D0B078]/30 bg-[#D0B078]/10 px-3 py-0.5 text-xs font-semibold text-[#D0B078]";

/** Featured article, category filters (only when there are 2+ categories) and the grid of cards. */
export default function BlogIndexClient({
    posts,
    allLabel,
    readLabel,
}: {
    posts: CardPost[];
    allLabel: string;
    readLabel: string;
}) {
    const [featured, ...rest] = posts;
    const categories = Array.from(new Map(posts.map((p) => [p.category, p.categoryLabel])).entries());
    const [active, setActive] = useState<CategoryKey | "all">("all");
    const shown = active === "all" ? rest : rest.filter((p) => p.category === active);

    return (
        <>
            {featured && (
                <Link
                    href={featured.href}
                    className={`group mt-8 grid overflow-hidden rounded-2xl border border-[#2C355E] bg-[#151B3A] md:grid-cols-[1.15fr_1fr] ${focusRing}`}
                >
                    <Cover post={featured} sizes="(min-width: 768px) 55vw, 100vw" className="min-h-[220px] md:min-h-[300px]" />
                    <div className="flex flex-col justify-center gap-3 p-6 md:p-8">
                        <span className={`${tagClass} self-start`}>{featured.categoryLabel}</span>
                        <h2 className="text-2xl font-semibold leading-snug group-hover:text-[#D0B078] md:text-3xl">
                            {featured.title}
                        </h2>
                        <p className="text-white/75">{featured.description}</p>
                        <p className="text-sm text-white/55">{featured.meta}</p>
                        <span className="font-semibold text-[#D0B078]">{readLabel} →</span>
                    </div>
                </Link>
            )}

            {categories.length >= 2 && rest.length > 0 && (
                <div className="mb-6 mt-10 flex flex-wrap gap-2" role="group">
                    {[["all", allLabel] as const, ...categories].map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={active === key}
                            onClick={() => setActive(key as CategoryKey | "all")}
                            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${focusRing} ${
                                active === key
                                    ? "border-[#D0B078] bg-[#D0B078] font-semibold text-[#131835]"
                                    : "border-[#2C355E] text-white/80 hover:border-[#D0B078]/60"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {shown.length > 0 && (
                <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${categories.length >= 2 ? "" : "mt-10"}`}>
                    {shown.map((post) => (
                        <Link
                            key={post.id}
                            href={post.href}
                            className={`group flex flex-col overflow-hidden rounded-2xl border border-[#2C355E] bg-[#151B3A] ${focusRing}`}
                        >
                            <Cover post={post} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="aspect-video" />
                            <div className="flex flex-1 flex-col gap-2.5 p-5">
                                <span className={`${tagClass} self-start`}>{post.categoryLabel}</span>
                                <h3 className="text-lg font-semibold leading-snug group-hover:text-[#D0B078]">{post.title}</h3>
                                <p className="text-sm text-white/70">{post.description}</p>
                                <p className="mt-auto pt-1 text-xs text-white/50">{post.meta}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </>
    );
}
