'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { SERVICES } from '@/lib/seo/services';

interface NavMenuProps {
    locale: 'en' | 'es';
}

export function NavMenu({ locale }: NavMenuProps) {
    const [servicesOpen, setServicesOpen] = useState(false);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const openServices = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setServicesOpen(true);
    };
    const closeServicesDelayed = () => {
        closeTimer.current = setTimeout(() => setServicesOpen(false), 150);
    };

    const navLinkClass = 'text-base font-semibold text-white/80 hover:text-white transition-colors';

    return (
        <nav className="hidden lg:flex items-center gap-8">
            <div
                className="relative"
                onMouseEnter={openServices}
                onMouseLeave={closeServicesDelayed}
            >
                <button type="button" className={`flex items-center gap-1 ${navLinkClass}`}>
                    {locale === 'es' ? 'Servicios' : 'Services'}
                    <span className="text-[10px] text-white/50">▾</span>
                </button>
                {servicesOpen && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 rounded-2xl border border-white/10 bg-[#151B3A] shadow-xl p-2 z-30">
                        {SERVICES.map((service) => (
                            <Link
                                key={service.id}
                                href={`/${locale}/${service.slug[locale]}/miami`}
                                className="block px-4 py-2.5 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                {service.name[locale]}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <Link href={`/${locale}/locations`} className={navLinkClass}>
                {locale === 'es' ? 'Ciudades' : 'Locations'}
            </Link>
            <Link href={`/${locale}/pricing`} className={navLinkClass}>
                {locale === 'es' ? 'Precios' : 'Pricing'}
            </Link>
            <Link href={`/${locale}/about`} className={navLinkClass}>
                {locale === 'es' ? 'Nosotros' : 'About'}
            </Link>
        </nav>
    );
}