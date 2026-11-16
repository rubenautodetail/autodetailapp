'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

/** Desktop header: "Book now" + "Log in" for guests, "My Account" when signed in. */
export function HeaderAccount({ locale }: { locale: 'en' | 'es' }) {
    const { isAuthenticated } = useAuth();
    const es = locale === 'es';
    return (
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-1">
            <Link
                href={isAuthenticated ? `/${locale}/customer` : `/${locale}/booking/select`}
                className="btn-primary text-sm px-6 py-2.5"
            >
                {isAuthenticated ? (es ? 'Mi Cuenta' : 'My Account') : (es ? 'Reservar ahora' : 'Book now')}
            </Link>
            {!isAuthenticated && (
                <Link
                    href={`/${locale}/login`}
                    className="text-xs text-white/80 underline underline-offset-4 hover:text-white"
                >
                    {es ? 'Iniciar sesión' : 'Log in'}
                </Link>
            )}
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
