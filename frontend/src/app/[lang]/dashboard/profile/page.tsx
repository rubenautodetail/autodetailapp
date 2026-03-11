"use client";

import { ArrowLeft, User, Car, ShoppingBag, CreditCard, LogOut, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            router.push("/en"); // Redirect to welcome page (hardcoded lang for now)
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const menuItems = [
        { icon: Car, label: "My Vehicles", href: "#", disabled: true },
        { icon: ShoppingBag, label: "My Orders", href: "#", disabled: true },
        { icon: CreditCard, label: "Payment Methods", href: "#", disabled: true },
    ];

    return (
        <div className="min-h-screen bg-[var(--background)] p-6">
            <header className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm border border-[var(--divider)]"
                >
                    <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
                </button>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Profile</h1>
            </header>

            {/* Profile Header */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] mb-4 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {user?.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <User className="w-10 h-10" />
                    )}
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{user?.user_metadata?.full_name || "User"}</h2>
                <p className="text-[var(--text-secondary)]">{user?.email}</p>
            </div>

            {/* Menu Options */}
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--divider)] shadow-sm overflow-hidden">
                {menuItems.map((item, index) => (
                    <div
                        key={index}
                        className={`flex items-center justify-between p-4 ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--background)] cursor-pointer'} transition-colors ${index !== menuItems.length - 1 ? 'border-b border-[var(--divider)]' : ''}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[var(--background)] flex items-center justify-center text-[var(--text-secondary)]">
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-[var(--text-primary)]">{item.label}</span>
                            {item.disabled && <span className="text-xs text-[var(--text-secondary)]">(coming soon)</span>}
                        </div>
                        <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                    </div>
                ))}
            </div>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="w-full mt-8 py-4 rounded-xl bg-[var(--error)]/10 text-[var(--error)] font-bold flex items-center justify-center gap-2 hover:bg-[var(--error)]/20 transition-colors"
            >
                <LogOut className="w-5 h-5" />
                Log Out
            </button>

            <p className="text-center text-xs text-[var(--text-secondary)] mt-8 opacity-50">
                Rubens Auto Detail v1.0.0
            </p>
        </div>
    );
}
