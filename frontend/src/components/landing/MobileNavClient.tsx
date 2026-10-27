'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import type { NavService } from './NavMenuClient';

interface MobileNavClientProps {
    locale: 'en' | 'es';
    services: NavService[];
    waHref: string | null;
    accountHref: string;
    accountLabel: string;
}

/** Hamburger menu for phones and tablets (the desktop menu takes over from lg up). */
export default function MobileNavClient({ locale, services, waHref, accountHref, accountLabel }: MobileNavClientProps) {
    const es = locale === 'es';
    const [open, setOpen] = useState(false);
    const [servicesOpen, setServicesOpen] = useState(true);

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

    const close = () => setOpen(false);
    const rowClass = 'block border-t border-white/10 py-4 text-2xl font-semibold text-white';

    return (
        <div className="lg:hidden">
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={es ? 'Abrir menú' : 'Open menu'}
                aria-expanded={open}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D0B078] text-[#131835]"
            >
                <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            {open &&
                createPortal(
                <div role="dialog" aria-modal="true" aria-label={es ? 'Menú' : 'Menu'} className="fixed inset-0 z-[100] overflow-y-auto bg-[#131835]">
                    <div className="mx-auto flex max-w-md flex-col px-6 pb-10 pt-5">
                        <div className="mb-6 flex items-center justify-between gap-3">
                            <Link
                                href={accountHref}
                                onClick={close}
                                className="flex h-11 items-center rounded-full border-2 border-[#D0B078] px-5 text-base font-semibold text-[#D0B078]"
                            >
                                {accountLabel}
                            </Link>
                            <button
                                type="button"
                                onClick={close}
                                aria-label={es ? 'Cerrar menú' : 'Close menu'}
                                className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D0B078] text-[#131835]"
                            >
                                <X className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setServicesOpen((o) => !o)}
                            aria-expanded={servicesOpen}
                            className="flex w-full items-center justify-between py-3 text-left text-2xl font-semibold text-white"
                        >
                            {es ? 'Servicios' : 'Services'}
                            <ChevronDown aria-hidden="true" className={`h-6 w-6 text-[#D0B078] transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={servicesOpen ? 'pb-3' : 'hidden'}>
                            {services.map((s) => (
                                <Link key={s.href} href={s.href} onClick={close} className="block py-2.5 pl-4 text-lg text-white/75 hover:text-white">
                                    {s.name}
                                </Link>
                            ))}
                        </div>

                        <Link href={es ? '/es/galeria' : '/en/gallery'} onClick={close} className={rowClass}>
                            {es ? 'Galería' : 'Gallery'}
                        </Link>
                        <Link href={`/${locale}/about`} onClick={close} className={rowClass}>
                            {es ? 'Nosotros' : 'About'}
                        </Link>

                        <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-8">
                            {waHref && (
                                <a href={waHref} className="rounded-full bg-[#25D366] py-3 text-center text-base font-semibold text-white">
                                    WhatsApp
                                </a>
                            )}
                            <a
                                href="tel:+13059884449"
                                className={`rounded-full border-2 border-[#D0B078] py-3 text-center text-base font-semibold text-[#D0B078] ${waHref ? '' : 'col-span-2'}`}
                            >
                                {es ? 'Llamar' : 'Call'}
                            </a>
                        </div>
                    </div>
                </div>,
                    document.body
                )}
        </div>
    );
}
