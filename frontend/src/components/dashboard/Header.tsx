"use client";

import { useAuth } from "@/contexts/AuthContext";
import { User, Menu } from "lucide-react";
import { useState } from "react";

export default function Header({ profileName }: { profileName?: string }) {
    const { user } = useAuth();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Extract first name from prop or metadata or use default
    const firstName = profileName || user?.user_metadata?.full_name?.split(" ")[0] || "Guest";

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <header className="flex items-center justify-between py-6">
            <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-display)]">
                    {getGreeting()}, {firstName} 👋
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                    Ready for a shine today?
                </p>
            </div>

            <button
                onClick={() => setIsDrawerOpen(true)}
                className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--divider)] flex items-center justify-center shadow-sm hover:bg-[var(--background)] transition-colors relative profile-button"
                aria-label="Open menu"
            >
                {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                    <User className="w-5 h-5 text-[var(--text-secondary)]" />
                )}
            </button>

            {/* Drawer Overlay (Placeholder for now) */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)}>
                    <div className="absolute top-0 right-0 h-full w-3/4 max-w-xs bg-[var(--card)] shadow-2xl p-6 transform transition-transform" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold">Menu</h2>
                            <button onClick={() => setIsDrawerOpen(false)} className="p-2">✕</button>
                        </div>
                        <nav className="space-y-4">
                            <a href="/dashboard/vehicles" className="block py-2 text-[var(--text-primary)] border-b border-[var(--divider)]">My Vehicles</a>
                            <a href="/dashboard/orders" className="block py-2 text-[var(--text-primary)] border-b border-[var(--divider)]">My Orders</a>
                            <a href="#" className="block py-2 text-[var(--text-primary)] border-b border-[var(--divider)]">Payment Methods</a>
                            <button className="block w-full text-left py-2 text-[var(--error)] hover:bg-[var(--error)]/10 px-2 -ml-2 rounded">Logout</button>
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
}
