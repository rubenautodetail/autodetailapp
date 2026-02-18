"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, Car, Settings, HelpCircle, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar({ lang }: { lang: string }) {
    const pathname = usePathname();

    const menuItems = [
        { icon: Home, label: 'Dashboard', href: `/${lang}/customer` },
        { icon: Plus, label: 'Book Service', href: `/${lang}/booking/select` },
        { icon: Car, label: 'My Garage', href: `/${lang}/customer/vehicles` },
        { icon: Settings, label: 'Account Settings', href: `/${lang}/customer/settings` },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-black/90 backdrop-blur-xl border-r border-white/5 flex flex-col z-50 hidden lg:flex">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-white/5">
                <span className="text-xl font-bold font-display tracking-tight text-white">
                    RUBENS <span className="text-accent-gold">AUTO</span>
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== `/${lang}/customer` && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                                ${isActive ? 'text-white' : 'text-text-secondary hover:text-white hover:bg-white/5'}
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-accent-gold/10 border-l-2 border-accent-gold"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            <Icon className={`w-5 h-5 mr-3 relative z-10 ${isActive ? 'text-accent-gold' : 'group-hover:text-accent-gold transition-colors'}`} />
                            <span className="font-medium relative z-10">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-white/5 space-y-2">
                <a
                    href="mailto:support@rubensautodetail.com"
                    className="flex items-center px-4 py-3 rounded-xl text-text-secondary hover:text-white hover:bg-white/5 transition-all"
                >
                    <HelpCircle className="w-5 h-5 mr-3" />
                    <span className="font-medium">Support</span>
                </a>
                <button className="w-full flex items-center px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
                    <LogOut className="w-5 h-5 mr-3" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}

// Mobile Menu Component (Overlay) can be added here or separately.
// For now, focusing on the desktop Sidebar structure.
