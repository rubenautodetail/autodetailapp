"use client";

import { use } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Calendar, User, Car } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}

export default function DashboardLayout({
    children,
    params,
}: DashboardLayoutProps) {
    const { lang } = use(params);
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/dashboard' && pathname === `/${lang}/dashboard`) return true;
        return pathname?.includes(path) && path !== '/dashboard';
    };

    const navItems = [
        { icon: Home, label: 'Home', path: '/dashboard' },
        { icon: Calendar, label: 'Book', path: '/booking/select' },
        { icon: Car, label: 'My Garage', path: '/dashboard/vehicles' },
        { icon: User, label: 'Profile', path: '/dashboard/profile' },
    ];

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10 z-50 md:hidden pb-safe">
                <div className="flex justify-around items-center p-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                href={`/${lang}${item.path}`}
                                className={`flex flex-col items-center space-y-1 transition-colors duration-200 ${active ? 'text-accent-gold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            >
                                <Icon className="w-6 h-6" />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Content Area */}
            <div className="pb-24 md:pb-0">
                {children}
            </div>
        </div>
    );
}
