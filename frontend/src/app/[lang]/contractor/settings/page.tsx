"use client";

import { useState } from 'react';
import { ToggleLeft, ToggleRight, User, LogOut, Bell, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import StripeConnectButton from '@/components/contractor/StripeConnectButton';

export default function SettingsPage() {
    const router = useRouter();
    const [isAvailable, setIsAvailable] = useState(true);
    const [notifications, setNotifications] = useState(true);

    const handleLogout = () => {
        // Implement logout logic here
        router.push('/en/login');
    };

    return (
        <div className="px-6 pt-6 pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Settings</h1>
                <div className="flex items-center space-x-3 bg-[var(--card)]/80 p-4 rounded-xl border border-[var(--divider)]">
                    <div className="w-12 h-12 rounded-full bg-[var(--surface-variant)] flex items-center justify-center text-xl font-bold text-[var(--text-primary)]">
                        JD
                    </div>
                    <div>
                        <h3 className="text-[var(--text-primary)] font-bold">John Doe</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Contractor</p>
                    </div>
                </div>
            </header>

            <div className="mb-6">
                <StripeConnectButton />
            </div>

            <div className="space-y-6">
                {/* Availability Toggle */}
                <section className="bg-[var(--card)]/80 rounded-xl p-4 border border-[var(--divider)]">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-[var(--text-primary)] font-medium">Availability Status</span>
                        </div>
                        <button onClick={() => setIsAvailable(!isAvailable)} className="text-accent-gold">
                            {isAvailable ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-gray-500" />}
                        </button>
                    </div>
                    <p className="text-xs text-text-secondary mt-2">
                        {isAvailable ? "You are appearing online for new jobs." : "You are offline and won't receive new requests."}
                    </p>
                </section>

                {/* Notifications */}
                <section className="bg-[var(--card)]/80 rounded-xl p-4 border border-[var(--divider)]">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3">
                            <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
                            <span className="text-[var(--text-primary)] font-medium">Push Notifications</span>
                        </div>
                        <button onClick={() => setNotifications(!notifications)} className="text-accent-gold">
                            {notifications ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-gray-500" />}
                        </button>
                    </div>
                    <div className="flex items-center space-x-3 text-text-secondary">
                        <Shield className="w-5 h-5" />
                        <span className="font-medium">Privacy & Security</span>
                    </div>
                </section>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full py-4 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center space-x-2"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
}
