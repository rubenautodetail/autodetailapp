"use client";

import { Check, X, Loader2, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type RequestStatus = "pending" | "confirmed" | "declined";

export default function RequestPage() {
    const router = useRouter();
    const params = useParams();
    const lang = (params?.lang as string) || 'en';
    const [status, setStatus] = useState<RequestStatus | "review">("review");
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setStatus("pending");
        }, 1500);
    };

    // Mock real-time updates for MVP demo
    useEffect(() => {
        if (status === "pending") {
            const timer = setTimeout(() => {
                setStatus("confirmed");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    if (status === "review") {
        return (
            <div className="min-h-screen bg-[var(--background)] p-6 pb-24 flex flex-col">
                <header className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm border border-[var(--divider)]"
                    >
                        <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
                    </button>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Review Request</h1>
                </header>

                <div className="flex-1 space-y-6">
                    <div className="bg-[var(--card)] rounded-2xl p-6 shadow-sm border border-[var(--divider)] space-y-4">
                        <div className="flex justify-between items-start pb-4 border-b border-[var(--divider)]">
                            <div>
                                <h3 className="font-semibold text-[var(--text-primary)]">Premium Gloss</h3>
                                <p className="text-sm text-[var(--text-secondary)]">2.5 Hours</p>
                            </div>
                            <span className="font-bold text-[var(--text-primary)]">$140</span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-[var(--text-secondary)]">Location</span>
                                <span className="text-sm font-medium text-[var(--text-primary)] text-right">123 Biscayne Blvd</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-[var(--text-secondary)]">Vehicle</span>
                                <span className="text-sm font-medium text-[var(--text-primary)]">Tesla Model 3</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-[var(--divider)] flex justify-between items-center">
                            <span className="font-bold text-[var(--text-primary)]">Total</span>
                            <span className="text-xl font-bold text-[var(--text-primary)]">$140</span>
                        </div>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-[var(--accent)] text-white font-bold text-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "Confirm Request"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] p-6 flex flex-col items-center justify-center text-center">

            {status === "pending" && (
                <div className="space-y-6">
                    <div className="w-24 h-24 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto relative">
                        <div className="absolute inset-0 rounded-full border-4 border-[var(--accent)]/30 animate-ping"></div>
                        <Loader2 className="w-10 h-10 text-[var(--accent)] animate-spin" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Request Sent</h2>
                        <p className="text-[var(--text-secondary)]">Waiting for detailer confirmation...</p>
                    </div>
                    <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--divider)] max-w-xs mx-auto">
                        <p className="text-sm text-[var(--text-secondary)]">Estimated arrival: <span className="text-[var(--text-primary)] font-semibold">2:30 PM</span></p>
                    </div>
                    <button className="text-[var(--error)] font-medium hover:underline text-sm mt-8">Cancel Request</button>
                </div>
            )}

            {status === "confirmed" && (
                <div className="space-y-6">
                    <div className="w-24 h-24 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto">
                        <Check className="w-12 h-12 text-[var(--success)]" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Confirmed! ✅</h2>
                        <p className="text-[var(--text-secondary)]">Your technician is on the way.</p>
                    </div>

                    {/* Status Tracker */}
                    <div className="w-full max-w-xs mx-auto space-y-4 text-left mt-8">
                        <div className="flex gap-4 items-center">
                            <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs">✓</div>
                            <span className="text-[var(--text-primary)] font-medium">Request Accepted</span>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] bg-[var(--background)] flex items-center justify-center text-[var(--accent)] animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-[var(--accent)]"></div>
                            </div>
                            <span className="text-[var(--text-primary)] font-medium">On The Way</span>
                        </div>
                        <div className="flex gap-4 items-center opacity-50">
                            <div className="w-6 h-6 rounded-full border-2 border-[var(--divider)]"></div>
                            <span className="text-[var(--text-secondary)]">Arrived</span>
                        </div>
                    </div>

                    <Link href={`/${lang}/dashboard`} className="inline-block mt-12 text-[var(--accent)] font-medium hover:underline">
                        Back to Dashboard
                    </Link>
                </div>
            )}
        </div>
    );
}
