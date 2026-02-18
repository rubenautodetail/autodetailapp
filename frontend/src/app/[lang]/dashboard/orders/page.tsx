"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MyOrdersPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[var(--background)] p-6">
            <header className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm border border-[var(--divider)]"
                >
                    <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
                </button>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Orders</h1>
            </header>

            <div className="space-y-4">
                {/* Active Order */}
                <div className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--divider)] shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="px-2 py-1 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold uppercase">In Progress</span>
                            <h3 className="font-semibold text-[var(--text-primary)] mt-2">Premium Gloss</h3>
                        </div>
                        <span className="font-bold text-[var(--text-primary)]">$140</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">Today, 2:30 PM</p>
                    <p className="text-sm text-[var(--text-secondary)]">Tesla Model 3 • 123 Biscayne Blvd</p>
                </div>

                {/* Past Order */}
                <div className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--divider)] shadow-sm opacity-60">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="px-2 py-1 rounded-md bg-[var(--success)]/10 text-[var(--success)] text-xs font-bold uppercase">Completed</span>
                            <h3 className="font-semibold text-[var(--text-primary)] mt-2">Maintenance Wash</h3>
                        </div>
                        <span className="font-bold text-[var(--text-primary)]">$65</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">Feb 10, 2026</p>
                    <p className="text-sm text-[var(--text-secondary)]">Tesla Model 3 • 123 Biscayne Blvd</p>
                </div>
            </div>
        </div>
    );
}
