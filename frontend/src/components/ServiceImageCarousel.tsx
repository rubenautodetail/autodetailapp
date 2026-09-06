'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ServiceImageCarouselProps {
    images: string[];
    alt: string;
    aspect?: string;
}

export default function ServiceImageCarousel({ images, alt, aspect = 'aspect-[4/5]' }: ServiceImageCarouselProps) {
    const [index, setIndex] = useState(0);
    const hasMultiple = images.length > 1;

    const goPrev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
    const goNext = () => setIndex((i) => (i === images.length - 1 ? 0 : i + 1));

    return (
        <div className={`relative ${aspect} w-full overflow-hidden rounded-2xl`}>
            <Image
                src={images[index]}
                alt={alt}
                fill
                priority
                className="object-cover"
            />

            {hasMultiple && (
                <>
                    <button
                        type="button"
                        onClick={goPrev}
                        aria-label="Previous image"
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-[#131835]/70 text-white backdrop-blur-sm transition-colors hover:bg-[#131835]/90"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={goNext}
                        aria-label="Next image"
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-[#131835]/70 text-white backdrop-blur-sm transition-colors hover:bg-[#131835]/90"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setIndex(i)}
                                aria-label={`Go to image ${i + 1}`}
                                className={`h-1.5 rounded-full transition-all ${
                                    i === index ? 'w-5 bg-[#D0B078]' : 'w-1.5 bg-white/50'
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}