"use client";

import { useAuth } from "@/contexts/AuthContext";
import { User } from "lucide-react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function Header({ profileName }: { profileName?: string }) {
    const { user, logout } = useAuth();
    const params = useParams();
    const router = useRouter();
    const locale = (params?.lang as string) || 'en';
    const isEs = locale === 'es';
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const firstName = profileName?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || (isEs ? 'Invitado' : 'Guest');

    const getGreeting = () => {
        const hour = parseInt(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }), 10);
        if (isEs) {
            if (hour < 12) return "Buenos Días";
            if (hour < 18) return "Buenas Tardes";
            return "Buenas Noches";
        }
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    const menuItems = [
        { label: isEs ? 'Mis Vehículos' : 'My Vehicles', href: `/${locale}/dashboard/vehicles` },
        { label: isEs ? 'Mis Reservas' : 'My Orders', href: `/${locale}/dashboard/orders` },
        { label: isEs ? 'Perfil' : 'Profile', href: `/${locale}/dashboard/profile` },
    ];

    return (
        <header className="flex items-center justify-between py-6">
            <div>
                <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">
                    {getGreeting()}, {firstName}
                </h1>
                <p className="text-sm text-[#A5B0D1]">
                    {isEs ? '¿Listo para un brillo hoy?' : 'Ready for a shine today?'}
                </p>
            </div>

            <button
                onClick={() => setIsDrawerOpen(true)}
                className="w-10 h-10 rounded-full bg-[#1A2142] border border-[#2C355E] flex items-center justify-center shadow-sm hover:bg-[#131835] transition-colors relative profile-button"
                aria-label={isEs ? 'Abrir menú' : 'Open menu'}
            >
                {user?.user_metadata?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                    <User className="w-5 h-5 text-[#A5B0D1]" />
                )}
            </button>

            {/* Drawer */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)}>
                    <div className="absolute top-0 right-0 h-full w-3/4 max-w-xs bg-[#1A2142] shadow-2xl p-6 transform transition-transform" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold text-white">{isEs ? 'Menú' : 'Menu'}</h2>
                            <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-[#A5B0D1] hover:text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <nav className="space-y-1">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="block py-3 px-2 text-[#A5B0D1] hover:text-white hover:bg-white/5 rounded-lg transition-colors border-b border-[#2C355E]"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <button
                                disabled={loggingOut}
                                onClick={async () => {
                                    setLoggingOut(true);
                                    try {
                                        await logout();
                                        router.push(`/${locale}/login`);
                                    } catch {
                                        router.push(`/${locale}/login`);
                                    }
                                }}
                                className="block w-full text-left py-3 text-red-400 hover:bg-red-400/10 px-2 rounded-lg mt-4"
                            >
                                {loggingOut
                                    ? (isEs ? "Cerrando sesión..." : "Logging out...")
                                    : (isEs ? "Cerrar Sesión" : "Logout")}
                            </button>
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
}
