"use client";

import { ArrowLeft, CreditCard, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentMethodsPage() {
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
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Payment Methods</h1>
            </header>

            <div className="space-y-4">
                {/* Existing Card */}
                <div className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--divider)] shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--text-primary)] flex items-center justify-center text-white">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[var(--text-primary)]">•••• 4242</h3>
                            <p className="text-sm text-[var(--text-secondary)]">Expires 12/26</p>
                        </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-md">Default</span>
                </div>

                {/* Add New Method */}
                <button className="w-full py-4 rounded-xl border-2 border-dashed border-[var(--divider)] text-[var(--text-secondary)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--card)] transition-colors">
                    <Plus className="w-5 h-5" />
                    Add Payment Method
                </button>
            </div>
        </div>
    );
}
