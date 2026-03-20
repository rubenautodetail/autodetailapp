"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Plus, Car, Settings, HelpCircle, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { UserCircle2 } from 'lucide-react';

export default function Sidebar({ lang }: { lang: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout, profile, user } = useAuth();

    const handleSignOut = async () => {
        try {
            await logout();
            router.replace(`/${lang}/login`);
        } catch (err) {
            console.error('Sign out error:', err);
        }
    };

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
                <Image 
                    src="/dtailwash_logo_final.png" 
                    alt="DetailWash" 
                    width={150} 
                    height={40} 
                    className="w-auto h-8 brightness-0 invert" 
                />
            </div>

            {/* User Identity */}
            <div className="px-4 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent-gold/10 flex items-center justify-center flex-shrink-0">
                        <UserCircle2 className="w-5 h-5 text-accent-gold" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {profile?.full_name || user?.email?.split('@')[0] || '—'}
                        </p>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent-gold/15 text-accent-gold uppercase tracking-wider">
                            Customer
                        </span>
                    </div>
                </div>
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
                    href="mailto:support@dtailwash.com"
                    className="flex items-center px-4 py-3 rounded-xl text-text-secondary hover:text-white hover:bg-white/5 transition-all"
                >
                    <HelpCircle className="w-5 h-5 mr-3" />
                    <span className="font-medium">Support</span>
                </a>
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
                    <LogOut className="w-5 h-5 mr-3" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}

// Mobile Menu Component (Overlay) can be added here or separately.
// For now, focusing on the desktop Sidebar structure.
