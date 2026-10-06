'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { GalleryCategory, GalleryPhoto } from '@/lib/gallery';

const PAGE_SIZE = 6;

const TEXT = {
    en: {
        all: 'All',
        showMore: 'Show more',
        of: 'of',
        showing: 'Showing',
        close: 'Close',
        prev: 'Previous photo',
        next: 'Next photo',
        viewer: 'Photo viewer',
        open: 'Open photo',
        filters: 'Filter by service',
    },
    es: {
        all: 'Todas',
        showMore: 'Ver más',
        of: 'de',
        showing: 'Mostrando',
        close: 'Cerrar',
        prev: 'Foto anterior',
        next: 'Foto siguiente',
        viewer: 'Visor de fotos',
        open: 'Abrir foto',
        filters: 'Filtrar por servicio',
    },
} as const;

interface Props {
    photos: GalleryPhoto[];
    categories: GalleryCategory[];
    locale: 'en' | 'es';
}

const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131835]';

export default function GalleryGrid({ photos, categories, locale }: Props) {
    const text = TEXT[locale];
    const [active, setActive] = useState('all');
    const [visible, setVisible] = useState(PAGE_SIZE);
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const triggerRef = useRef<HTMLElement | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    const labelById = useMemo(() => new Map(categories.map((c) => [c.id, c.label])), [categories]);
    const filtered = useMemo(
        () => (active === 'all' ? photos : photos.filter((p) => p.category === active)),
        [photos, active]
    );
    const shown = filtered.slice(0, visible);
    const isOpen = openIndex !== null;

    const selectCategory = (id: string) => {
        setActive(id);
        setVisible(PAGE_SIZE);
    };

    const close = useCallback(() => {
        setOpenIndex(null);
        triggerRef.current?.focus();
    }, []);

    const step = useCallback(
        (direction: 1 | -1) =>
            setOpenIndex((i) => (i === null ? i : (i + direction + filtered.length) % filtered.length)),
        [filtered.length]
    );

    // While the viewer is open: lock page scroll, move focus into it, keep Tab inside
    // it, and support Escape and the arrow keys.
    useEffect(() => {
        if (!isOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeRef.current?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                close();
            } else if (e.key === 'ArrowLeft') {
                step(-1);
            } else if (e.key === 'ArrowRight') {
                step(1);
            } else if (e.key === 'Tab' && dialogRef.current) {
                const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button'));
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKey);
        };
    }, [isOpen, close, step]);

    const current = openIndex !== null ? filtered[openIndex] : null;

    return (
        <>
            <div role="group" aria-label={text.filters} className="flex flex-wrap justify-center gap-2">
                <button
                    type="button"
                    aria-pressed={active === 'all'}
                    onClick={() => selectCategory('all')}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${focusRing} ${
                        active === 'all'
                            ? 'border-[#D0B078] bg-[#D0B078] font-semibold text-[#131835]'
                            : 'border-[#2C355E] text-white/80 hover:border-[#D0B078]/60 hover:text-white'
                    }`}
                >
                    {text.all} <span className={active === 'all' ? 'text-[#131835]/70' : 'text-white/45'}>{photos.length}</span>
                </button>
                {categories.map((c) => (
                    <button
                        key={c.id}
                        type="button"
                        aria-pressed={active === c.id}
                        onClick={() => selectCategory(c.id)}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${focusRing} ${
                            active === c.id
                                ? 'border-[#D0B078] bg-[#D0B078] font-semibold text-[#131835]'
                                : 'border-[#2C355E] text-white/80 hover:border-[#D0B078]/60 hover:text-white'
                        }`}
                    >
                        {c.label}{' '}
                        <span className={active === c.id ? 'text-[#131835]/70' : 'text-white/45'}>{c.count}</span>
                    </button>
                ))}
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {shown.map((photo, i) => (
                    <li key={photo.src}>
                        <button
                            type="button"
                            aria-label={`${text.open}: ${photo.alt}`}
                            onClick={(e) => {
                                triggerRef.current = e.currentTarget;
                                setOpenIndex(i);
                            }}
                            className={`group relative block aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/5 bg-[#1C2350] ${focusRing}`}
                        >
                            <Image
                                src={photo.src}
                                alt={photo.alt}
                                fill
                                sizes="(min-width: 1024px) 330px, (min-width: 640px) 33vw, 50vw"
                                priority={i < 3}
                                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8 text-left text-[11px] text-white/85">
                                {labelById.get(photo.category)}
                            </span>
                        </button>
                    </li>
                ))}
            </ul>

            {visible < filtered.length && (
                <div className="mt-8 text-center">
                    <button
                        type="button"
                        onClick={() => setVisible((v) => v + PAGE_SIZE)}
                        className={`rounded-full border border-[#2C355E] px-6 py-2.5 text-sm text-white/85 transition-colors hover:border-[#D0B078]/60 hover:text-white ${focusRing}`}
                    >
                        {text.showMore} · {shown.length} {text.of} {filtered.length}
                    </button>
                </div>
            )}

            <p className="sr-only" aria-live="polite">
                {text.showing} {shown.length} {text.of} {filtered.length}
            </p>

            {current && (
                <div
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label={text.viewer}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={close}
                >
                    <button
                        ref={closeRef}
                        type="button"
                        aria-label={text.close}
                        onClick={close}
                        className={`absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 ${focusRing}`}
                    >
                        <X aria-hidden="true" className="h-5 w-5" />
                    </button>

                    {filtered.length > 1 && (
                        <button
                            type="button"
                            aria-label={text.prev}
                            onClick={(e) => {
                                e.stopPropagation();
                                step(-1);
                            }}
                            className={`absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 sm:left-6 ${focusRing}`}
                        >
                            <ChevronLeft aria-hidden="true" className="h-6 w-6" />
                        </button>
                    )}

                    <div className="relative h-[80vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                        <Image
                            key={current.src}
                            src={current.src}
                            alt={current.alt}
                            fill
                            sizes="(min-width: 1024px) 900px, 100vw"
                            className="object-contain"
                            priority
                        />
                    </div>

                    {filtered.length > 1 && (
                        <button
                            type="button"
                            aria-label={text.next}
                            onClick={(e) => {
                                e.stopPropagation();
                                step(1);
                            }}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 sm:right-6 ${focusRing}`}
                        >
                            <ChevronRight aria-hidden="true" className="h-6 w-6" />
                        </button>
                    )}

                    <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70" aria-live="polite">
                        {(openIndex ?? 0) + 1} / {filtered.length}
                    </p>
                </div>
            )}
        </>
    );
}
