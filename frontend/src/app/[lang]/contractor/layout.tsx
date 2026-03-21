"use client";

import { use, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ContractorProvider } from '@/contexts/ContractorContext';
import { Toaster } from 'react-hot-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationToast } from '@/components/dashboard/NotificationToast';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

interface ContractorLayoutProps {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}

export default function ContractorLayout({
    children,
    params,
}: ContractorLayoutProps) {
    const { lang } = use(params);
    const pathname = usePathname();
    const router = useRouter();
    const { profile, isLoading: authLoading, logout } = useAuth();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await logout();
        } catch { /* ignore */ }
        router.replace(`/${lang}/contractor/login`);
    };

    // Auth guard — contractor or admin only; pending contractors go to pending page
    useEffect(() => {
        if (authLoading) return;
        // Skip redirect if already on the contractor login page
        if (pathname?.endsWith('/contractor/login')) return;
        if (!profile || (profile.role !== 'contractor' && profile.role !== 'admin')) {
            router.replace(`/${lang}/contractor/login`);
            return;
        }
        if (profile.role === 'contractor' && profile.approval_status !== 'approved') {
            router.replace(`/${lang}/contractor/pending`);
        }
    }, [authLoading, profile, lang, router]);

    // Red dot on Jobs tab when there are pending incoming jobs
    const [hasIncoming, setHasIncoming] = useState(false);
    useEffect(() => {
        const check = () => {
            try {
                const raw = localStorage.getItem('contractor_incoming_count');
                setHasIncoming(raw !== null && raw !== '0');
            } catch {
                // localStorage unavailable — non-fatal
            }
        };
        check();
        // Re-check whenever the tab becomes visible (e.g. user navigates back)
        window.addEventListener('focus', check);
        return () => window.removeEventListener('focus', check);
    }, []);

    // Notifications Hook — must be before any early return
    const { notifications, dismissToast } = useNotifications();

    // Login and pending pages render without the nav shell
    const isLoginPage = pathname?.endsWith('/contractor/login');
    const isPendingPage = pathname?.endsWith('/contractor/pending');
    if (isLoginPage || isPendingPage) return <>{children}</>;

    if (authLoading || !profile || (profile.role !== 'contractor' && profile.role !== 'admin') ||
        (profile.role === 'contractor' && profile.approval_status !== 'approved')) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#131835]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
            </div>
        );
    }

    const isActive = (path: string) => pathname?.includes(path);

    const navLinks = [
        {
            label: lang === 'es' ? 'Panel' : 'Dashboard',
            path: `/${lang}/contractor/dashboard`,
        },
        {
            label: lang === 'es' ? 'Historial' : 'History',
            path: `/${lang}/contractor/history`,
        },
        {
            label: lang === 'es' ? 'Ajustes' : 'Settings',
            path: `/${lang}/contractor/settings`,
        },
    ];

    return (
        <ContractorProvider>
            <Toaster position="top-center" />
            <NotificationToast notifications={notifications.filter(n => !n.is_read)} onDismiss={dismissToast} />

            <div className="min-h-screen bg-[#131835]">
                {/* Top Navigation Bar */}
                <nav className="bg-[#0d1128] border-b border-white/10 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Brand */}
                            <Link
                                href={`/${lang}/contractor/dashboard`}
                                className="flex items-center space-x-2 text-white font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
                            >
                                <span className="text-yellow-400">✦</span>
                                <span>Rubens Detail</span>
                            </Link>

                            {/* Role identity badge */}
                            <div className="hidden sm:flex items-center gap-2 mr-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                                <div className="w-6 h-6 rounded-full bg-yellow-400/10 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div className="leading-none">
                                    <p className="text-xs font-medium text-white truncate max-w-[120px]">
                                        {profile?.full_name || '—'}
                                    </p>
                                    <span className="text-[10px] font-semibold text-yellow-400 uppercase tracking-wider">
                                        {lang === 'es' ? 'Técnico' : 'Technician'}
                                    </span>
                                </div>
                            </div>

                            {/* Nav Links — hidden on mobile (bottom nav handles it) */}
                            <div className="hidden sm:flex items-center space-x-1">
                                {navLinks.map((link) => {
                                    const active = isActive(link.path.replace(`/${lang}`, ''));
                                    return (
                                        <Link
                                            key={link.path}
                                            href={link.path}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                                                active
                                                    ? 'bg-white/10 text-white'
                                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            {link.label}
                                        </Link>
                                    );
                                })}
                                <button
                                    onClick={handleLogout}
                                    disabled={loggingOut}
                                    className="ml-2 px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors duration-200 flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <LogOut className="w-4 h-4" />
                                    {lang === 'es' ? 'Salir' : 'Log out'}
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Content Area — pad bottom on mobile for bottom nav */}
                <div className="pb-20 sm:pb-0">
                    {children}
                </div>

                {/* Mobile Bottom Navigation */}
                <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#0d1128] border-t border-white/10 z-50">
                    <div className="flex h-16">
                        {/* Jobs tab */}
                        <Link
                            href={`/${lang}/contractor/dashboard`}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                                isActive('/contractor/dashboard')
                                    ? 'text-[#D0B078]'
                                    : 'text-white/40 hover:text-white/70'
                            }`}
                        >
                            {/* Icon wrapper — relative so we can position the red dot */}
                            <span className="relative">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/contractor/dashboard') ? 2 : 1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                {/* Red dot — shown when there are incoming jobs */}
                                {hasIncoming && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full ring-1 ring-[#0d1128]" />
                                )}
                            </span>
                            {lang === 'es' ? 'Trabajos' : 'Jobs'}
                        </Link>
                        {/* History tab */}
                        <Link
                            href={`/${lang}/contractor/history`}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                                isActive('/contractor/history')
                                    ? 'text-[#D0B078]'
                                    : 'text-white/40 hover:text-white/70'
                            }`}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/contractor/history') ? 2 : 1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {lang === 'es' ? 'Historial' : 'History'}
                        </Link>
                        {/* Settings tab */}
                        <Link
                            href={`/${lang}/contractor/settings`}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                                isActive('/contractor/settings')
                                    ? 'text-[#D0B078]'
                                    : 'text-white/40 hover:text-white/70'
                            }`}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/contractor/settings') ? 2 : 1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {lang === 'es' ? 'Ajustes' : 'Settings'}
                        </Link>
                        {/* Logout tab */}
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                            <LogOut className="w-6 h-6" />
                            {lang === 'es' ? 'Salir' : 'Log out'}
                        </button>
                    </div>
                </nav>
            </div>
        </ContractorProvider>
    );
}
