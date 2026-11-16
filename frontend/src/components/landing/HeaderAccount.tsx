'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Desktop header: "Book now" + a round account button.
 * Guests: person icon -> login. Signed in: the person's initial -> My Account.
 */
export function HeaderAccount({ locale }: { locale: 'en' | 'es' }) {
    const { isAuthenticated, profile, user } = useAuth();
    const es = locale === 'es';
    const initial = (profile?.full_name || user?.email || '?').trim().charAt(0).toUpperCase();
    const label = isAuthenticated ? (es ? 'Mi Cuenta' : 'My Account') : (es ? 'Iniciar sesión' : 'Log in');
    return (
        <div className="hidden lg:flex lg:items-center lg:gap-3">
            <Link href={`/${locale}/booking/select`} className="btn-primary text-sm px-6 py-2.5">
                {es ? 'Reservar ahora' : 'Book now'}
            </Link>
            <Link
                href={isAuthenticated ? `/${locale}/customer` : `/${locale}/login`}
                aria-label={label}
                title={label}
                className={
                    isAuthenticated
                        ? 'flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#D0B078] bg-[#2740A1] text-sm font-bold text-white transition-transform hover:scale-105'
                        : 'flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-black/20 text-white backdrop-blur-sm transition-colors hover:border-[#D0B078] hover:text-[#D0B078]'
                }
            >
                {isAuthenticated ? initial : (
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                )}
            </Link>
        </div>
    );
}

/** Footer: "Log in" for guests, "My Account" when signed in. */
export function FooterAccountLink({ locale }: { locale: 'en' | 'es' }) {
    const { isAuthenticated } = useAuth();
    const es = locale === 'es';
    return (
        <Link href={isAuthenticated ? `/${locale}/customer` : `/${locale}/login`} className="hover:text-white/60 transition-colors">
            {isAuthenticated ? (es ? 'Mi Cuenta' : 'My Account') : (es ? 'Iniciar sesión' : 'Log in')}
        </Link>
    );
}
