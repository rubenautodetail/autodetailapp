'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';

interface HeroPhotoProps {
    src: string;
    alt: string;
    /** corner chip (Antes/Después); omit for plain photos */
    label?: string;
    chip?: string;
    /** wrapper classes: size, shape and grid placement */
    className: string;
    priority?: boolean;
    sizes: string;
    closeLabel: string;
    zoomLabel: string;
}

/** Hero before/after photo. Click opens the full photo in a viewer; the original file is served as-is (no image-optimizer cost). */
export default function HeroPhoto({ src, alt, label, chip, className, priority, sizes, closeLabel, zoomLabel }: HeroPhotoProps) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open]);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={`${zoomLabel}: ${alt}`}
                className="group absolute inset-0 block h-full w-full cursor-zoom-in"
            >
                <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                <span className="absolute bottom-2 right-2 rounded-full bg-black/55 p-1.5 text-white">
                    <ZoomIn className="h-4 w-4" aria-hidden="true" />
                </span>
            </button>
            {label && (
                <span className={`pointer-events-none absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white ${chip}`}>
                    {label}
                </span>
            )}

            {open && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={alt}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label={closeLabel}
                        className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
                    >
                        <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={alt} className="max-h-[92vh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
                    {label && (
                        <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white ${chip}`}>{label}</span>
                    )}
                </div>
            )}
        </div>
    );
}
