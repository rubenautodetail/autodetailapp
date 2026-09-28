"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CarouselPhoto {
    src: string;
    alt: string;
}

interface PhotoCarouselProps {
    photos: CarouselPhoto[];
    /** Accessible name of the carousel, e.g. "Recent work". */
    label: string;
    prevLabel: string;
    nextLabel: string;
}

const arrowClass =
    "absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#0f1430]/85 text-white backdrop-blur transition-colors hover:border-[#D0B078] hover:text-[#D0B078] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] sm:flex";

/**
 * Horizontal photo carousel built on native scroll snapping.
 * - Touch: swipe. The next photo peeks in at the edge to show there is more.
 * - Desktop: previous / next arrows.
 * - Keyboard: focus the strip and use the arrow keys, or tab to the buttons.
 */
export default function PhotoCarousel({ photos, label, prevLabel, nextLabel }: PhotoCarouselProps) {
    const track = useRef<HTMLDivElement>(null);

    const scrollPage = (direction: 1 | -1) => {
        const el = track.current;
        if (!el) return;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: reduceMotion ? "auto" : "smooth" });
    };

    return (
        <div className="relative" role="group" aria-roledescription="carousel" aria-label={label}>
            <div
                ref={track}
                tabIndex={0}
                className="flex snap-x snap-mandatory gap-3 overflow-x-auto rounded-xl pb-1 [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] [&::-webkit-scrollbar]:hidden"
            >
                {photos.map((photo, i) => (
                    <div
                        key={photo.src}
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${i + 1} / ${photos.length}`}
                        className="relative aspect-[4/3] shrink-0 basis-[85%] snap-start overflow-hidden rounded-xl sm:basis-[48%] lg:basis-[32%]"
                    >
                        <Image
                            src={photo.src}
                            alt={photo.alt}
                            fill
                            sizes="(min-width: 1024px) 32vw, (min-width: 640px) 48vw, 85vw"
                            className="object-cover"
                        />
                    </div>
                ))}
            </div>

            <button type="button" onClick={() => scrollPage(-1)} aria-label={prevLabel} className={`${arrowClass} left-2`}>
                <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => scrollPage(1)} aria-label={nextLabel} className={`${arrowClass} right-2`}>
                <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
        </div>
    );
}
