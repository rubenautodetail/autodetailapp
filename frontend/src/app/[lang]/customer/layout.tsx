'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { BookingStatusProvider } from '@/contexts/BookingStatusContext';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2, Home, Sparkles, ClipboardList, Car, Settings } from 'lucide-react';

function CustomerBottomNav({ lang }: { lang: string }) {
    const pathname = usePathname();
    const isEs = lang === 'es';

    const navItems = [
        { icon: Home, label: isEs ? 'Inicio' : 'Home', path: `/${lang}/customer` },
        { icon: Sparkles, label: isEs ? 'Reservar' : 'Book', path: `/${lang}/booking/select` },
        { icon: Car, label: isEs ? 'Garaje' : 'Garage', path: `/${lang}/customer/vehicles` },
        { icon: Settings, label: isEs ? 'Cuenta' : 'Account', path: `/${lang}/customer/settings` },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent" />
            <div className="bg-[#0D1229]/90 backdrop-blur-xl border-t border-white/[0.06]">
                <div className="flex justify-around items-center px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.path || (item.path !== `/${lang}/customer` && pathname?.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 min-h-[44px] rounded-xl transition-all duration-300 group"
                            >
                                {active && (
                                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-gold shadow-[0_0_6px_rgba(208,176,120,0.6)]" />
                                )}
                                <Icon
                                    className={`w-[22px] h-[22px] transition-all duration-300 ${
                                        active
                                            ? "text-accent-gold drop-shadow-[0_0_8px_rgba(208,176,120,0.4)]"
                                            : "text-white/55 group-hover:text-white/70"
                                    }`}
                                    strokeWidth={active ? 2.2 : 1.5}
                                />
                                <span
                                    className={`text-[10px] font-medium tracking-wide transition-all duration-300 ${
                                        active ? "text-accent-gold" : "text-white/55 group-hover:text-white/70"
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const lang = (params?.lang as string) || 'en';

    // Client-side auth guard (middleware handles server-side)
    useEffect(() => {
        if (!isLoading && !user) {
            router.replace(`/${lang}/login`);
        }
    }, [isLoading, user, lang, router]);

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
            </div>
        );
    }

    return (
        <ErrorBoundary lang={lang}>
            <BookingStatusProvider>
                <div className="min-h-screen bg-bg-primary">
                    <Sidebar lang={lang} />
                    <main className="lg:pl-64 min-h-screen pb-20 lg:pb-0 transition-all duration-300">
                        {children}
                    </main>
                    <CustomerBottomNav lang={lang} />
                </div>
            </BookingStatusProvider>
        </ErrorBoundary>
    );
}

