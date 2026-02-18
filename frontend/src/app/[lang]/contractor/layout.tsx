"use client";

import { use } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, List, Settings, MessageSquare } from 'lucide-react';
import { ContractorProvider } from '@/contexts/ContractorContext';
import { Toaster } from 'react-hot-toast';

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

    const isActive = (path: string) => pathname?.includes(path);

    const navItems = [
        { icon: Home, label: 'Inbox', path: '/contractor/inbox' },
        { icon: List, label: 'Active', path: '/contractor/active' },
        { icon: MessageSquare, label: 'History', path: '/contractor/history' },
        { icon: Settings, label: 'Settings', path: '/contractor/settings' },
    ];

    return (
        <ContractorProvider>
            <Toaster position="top-center" />
            <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0 md:pl-64">
                {/* Desktop Sidebar (Future Implementation) */}

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
                <div className="md:p-8">
                    {children}
                </div>
            </div>
        </ContractorProvider>
    );
}
