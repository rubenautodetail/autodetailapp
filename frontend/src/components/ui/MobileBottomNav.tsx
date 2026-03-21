"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Sparkles, ClipboardList, User } from "lucide-react";

interface MobileBottomNavProps {
    lang: string;
}

export default function MobileBottomNav({ lang }: MobileBottomNavProps) {
    const pathname = usePathname();

    // Hide on landing page — it's a storefront, not the app
    if (pathname === `/${lang}` || pathname === `/${lang}/`) return null;

    // Hide on contractor and admin sections — they have their own navs
    if (pathname?.includes("/contractor/") || pathname?.includes("/admin/") || pathname?.includes("/admin")) {
        return null;
    }

    const navItems = [
        { icon: Home, label: "Home", labelEs: "Inicio", path: "/dashboard" },
        { icon: Sparkles, label: "Book", labelEs: "Reservar", path: "/booking/select" },
        { icon: ClipboardList, label: "Orders", labelEs: "Reservas", path: "/dashboard/orders" },
        { icon: User, label: "Account", labelEs: "Cuenta", path: "/dashboard/profile" },
    ];

    const isActive = (itemPath: string) => {
        const fullPath = `/${lang}${itemPath}`;
        // Home = exact dashboard match
        if (itemPath === "/dashboard") return pathname === `/${lang}/dashboard`;
        // Booking section — active for any /booking/* page
        if (itemPath === "/booking/select") return pathname?.startsWith(`/${lang}/booking`);
        // Orders
        if (itemPath === "/dashboard/orders") return pathname?.startsWith(`/${lang}/dashboard/orders`);
        // Profile
        if (itemPath === "/dashboard/profile") return pathname?.startsWith(`/${lang}/dashboard/profile`);
        return pathname === fullPath;
    };

    const locale = lang === "es" ? "es" : "en";

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            {/* Top edge glow line */}
            <div className="h-px bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent" />

            <div className="bg-[#0D1229]/90 backdrop-blur-xl border-t border-white/[0.06]">
                <div className="flex justify-around items-center px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        const label = locale === "es" ? item.labelEs : item.label;
                        return (
                            <Link
                                key={item.path}
                                href={`/${lang}${item.path}`}
                                className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 group"
                            >
                                {/* Active indicator dot */}
                                {active && (
                                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-gold shadow-[0_0_6px_rgba(208,176,120,0.6)]" />
                                )}
                                <Icon
                                    className={`w-[22px] h-[22px] transition-all duration-300 ${
                                        active
                                            ? "text-accent-gold drop-shadow-[0_0_8px_rgba(208,176,120,0.4)]"
                                            : "text-white/30 group-hover:text-white/50"
                                    }`}
                                    strokeWidth={active ? 2.2 : 1.5}
                                />
                                <span
                                    className={`text-[10px] font-medium tracking-wide transition-all duration-300 ${
                                        active ? "text-accent-gold" : "text-white/30 group-hover:text-white/50"
                                    }`}
                                >
                                    {label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
