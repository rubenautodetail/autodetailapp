"use client";

import LocationMap from "@/components/maps/LocationMap";
import { ArrowLeft, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LocationPage() {
    const router = useRouter();
    const [address, setAddress] = useState("123 Biscayne Blvd, Miami, FL");
    const [apartment, setApartment] = useState("");
    const [notes, setNotes] = useState("");

    const handleConfirm = () => {
        router.push("/dashboard/request");
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col relative">
            {/* Top Bar (Absolute) */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-12 flex items-center gap-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-lg pointer-events-auto active:scale-90 transition-transform"
                >
                    <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
                </button>
                <h1 className="text-lg font-bold text-white drop-shadow-md">Confirm Location</h1>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                <LocationMap />

                {/* Use My Location FAB */}
                <button className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-[var(--card)] flex items-center justify-center shadow-lg border border-[var(--divider)] active:scale-95 transition-transform hover:text-[var(--accent)]">
                    <Navigation className="w-6 h-6" />
                </button>
            </div>

            {/* Bottom Sheet Form */}
            <div className="bg-[var(--card)] rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.2)] -mt-6 relative z-20 p-6 pb-8 space-y-6">
                <div className="w-12 h-1.5 bg-[var(--divider)] rounded-full mx-auto opacity-50 mb-2" />

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase">Address</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full p-3 bg-[var(--background)] border border-[var(--divider)] rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase">Apt / Gate Code</label>
                            <input
                                type="text"
                                value={apartment}
                                onChange={(e) => setApartment(e.target.value)}
                                placeholder="Optional"
                                className="w-full p-3 bg-[var(--background)] border border-[var(--divider)] rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all placeholder:text-[var(--text-secondary)]/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase">Notes</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Gate helper?"
                                className="w-full p-3 bg-[var(--background)] border border-[var(--divider)] rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all placeholder:text-[var(--text-secondary)]/50"
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleConfirm}
                    className="w-full py-4 rounded-xl bg-[var(--accent)] text-white font-bold text-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                >
                    Confirm Location
                </button>
            </div>
        </div>
    );
}
