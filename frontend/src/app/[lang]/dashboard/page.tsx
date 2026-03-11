"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Plus, ArrowRight, Sparkles } from "lucide-react";
import Header from "@/components/dashboard/Header";
import ServiceCarousel from "@/components/dashboard/ServiceCarousel";
import { BookingCard } from "@/components/dashboard/BookingCard";
import { VehicleCard } from "@/components/dashboard/VehicleCard";
import BottomSheetModal from "@/components/ui/BottomSheetModal";
import { Vehicle } from "@/contexts/BookingStatusContext";

import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/types/database";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];

export default function DashboardPage() {
    const { user, profile, isLoading: authLoading } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const [isLoadingBookings, setIsLoadingBookings] = useState(true);
    const [selectedService, setSelectedService] = useState<number | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchBookings() {
            if (!user?.email) return;

            try {
                const { data, error } = await supabase
                    .from("bookings")
                    .select("*, services(*)")
                    .eq("customer_email", user.email)
                    .order("date", { ascending: false })
                    .limit(5);

                if (error) throw error;

                const mappedBookings = (data || []).map(b => ({
                    id: b.id.toString(),
                    serviceName: (b as any).services?.name || "Service",
                    date: b.date,
                    time: "Scheduled", // Placeholder if time not specific in schema
                    status: (b.status as any) || "pending",
                    price: Number(b.total_amount),
                    providerName: "Ruben's Team"
                }));

                setBookings(mappedBookings);
            } catch (error) {
                console.error("Error fetching bookings:", error);
            } finally {
                setIsLoadingBookings(false);
            }
        }

        async function fetchVehicles() {
            if (!profile?.id) return;

            try {
                const { data, error } = await supabase
                    .from("vehicles")
                    .select("*")
                    .eq("user_id", profile.id);

                if (error) throw error;

                // Map DB schema to Vehicle interface if necessary
                const mappedVehicles: Vehicle[] = (data || []).map(v => ({
                    id: v.id,
                    make: v.make,
                    model: v.model,
                    year: v.year.toString(),
                    color: v.color || "",
                    type: (v.type as any) || "sedan",
                    licensePlate: v.license_plate || ""
                }));

                setVehicles(mappedVehicles);
            } catch (error) {
                console.error("Error fetching vehicles:", error);
            } finally {
                setIsLoadingVehicles(false);
            }
        }

        if (profile) {
            fetchVehicles();
            fetchBookings();
        }
    }, [profile, supabase]);

    const handleServiceSelect = (id: number) => {
        setSelectedService(id);
    };

    const handleCloseModal = () => {
        setSelectedService(null);
    };

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="px-6">
                <Header profileName={profile?.full_name || 'Guest'} />
            </div>

            <main className="space-y-6 md:space-y-8 pb-8">
                {/* Special Offer Banner */}
                <section className="px-6">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[var(--accent)] to-purple-600 p-6 text-white shadow-lg">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-5 h-5 text-yellow-300" />
                                <span className="text-sm font-bold uppercase tracking-wider text-yellow-300">Limited Offer</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-1">Get 20% Off Ceramic</h3>
                            <p className="text-white/90 mb-4 text-sm max-w-[80%]">Protect your car for the rainy season. Valid until Friday.</p>
                            <button className="bg-white text-[var(--accent)] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
                                Claim Offer
                            </button>
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute -right-4 -bottom-16 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    </div>
                </section>

                {/* Service Selection */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-6">
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">
                            Book a Service
                        </h2>
                        <Link href="/en/booking/select" className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors flex items-center">
                            See All <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                    <ServiceCarousel onSelectService={handleServiceSelect} />
                </section>

                {/* Recent Activity / Current Booking */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-6">
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">
                            Recent Activity
                        </h2>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 px-6 -mx-0 scrollbar-hide snap-x snap-mandatory">
                        {isLoadingBookings ? (
                            Array.from({ length: 1 }).map((_, i) => (
                                <div key={i} className="min-w-[85vw] md:min-w-[400px] animate-pulse">
                                    <div className="h-32 bg-gray-200 rounded-2xl"></div>
                                </div>
                            ))
                        ) : bookings.length > 0 ? (
                            bookings.map((booking, index) => (
                                <div key={booking.id} className="min-w-[85vw] md:min-w-[400px] snap-center">
                                    <BookingCard {...booking} index={index} />
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-6 text-center text-[var(--text-secondary)] bg-[var(--card)] rounded-2xl border border-dashed border-[var(--divider)] flex-1 min-w-[85vw]">
                                <p className="text-sm">No recent bookings found</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* My Vehicles */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-6">
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">
                            My Garage
                        </h2>
                        <button className="w-8 h-8 rounded-full bg-[var(--card)] border border-[var(--divider)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 px-6 -mx-0 scrollbar-hide snap-x snap-mandatory">
                        {isLoadingVehicles ? (
                            Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="min-w-[80vw] md:min-w-[350px] animate-pulse">
                                    <div className="h-40 bg-gray-200 rounded-2xl"></div>
                                </div>
                            ))
                        ) : vehicles.length > 0 ? (
                            vehicles.map((vehicle) => (
                                <div key={vehicle.id} className="min-w-[80vw] md:min-w-[350px] snap-center">
                                    <VehicleCard
                                        vehicle={vehicle}
                                        onDelete={() => { }}
                                        onEdit={() => { }}
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-8 text-center text-[var(--text-secondary)] bg-[var(--card)] rounded-2xl border border-dashed border-[var(--divider)] flex-1 min-w-[80vw] mx-6">
                                <p className="text-sm">No vehicles added yet</p>
                            </div>
                        )}
                        {/* Add Vehicle Card Placeholder */}
                        <div className="min-w-[100px] flex items-center justify-center">
                            <button className="w-12 h-12 rounded-full bg-[var(--card)] border border-[var(--divider)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] shadow-sm">
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Location Card (Compact) */}
                <section className="px-6">
                    <div className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--divider)] shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5 text-[var(--accent)]" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                                    Current Location
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    123 Biscayne Blvd, Miami
                                </p>
                            </div>
                        </div>
                        <button className="text-xs font-bold text-[var(--accent)] px-3 py-1.5 rounded-lg bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 transition-colors">
                            Change
                        </button>
                    </div>
                </section>
            </main>

            {/* Service Detail Modal */}
            <BottomSheetModal
                isOpen={!!selectedService}
                onClose={handleCloseModal}
                title="Premium Gloss"
                footer={
                    <Link href="/en/booking/location" className="block w-full text-center py-4 rounded-xl bg-[var(--accent)] text-white font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all">
                        Continue - $140
                    </Link>
                }
            >
                <div className="space-y-6">
                    {/* Image Slider Placeholder */}
                    <div className="w-full h-48 bg-gray-200 rounded-xl animate-pulse"></div>

                    <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                        <span>⏱ 2.5 Hours</span>
                        <span>⭐️ 4.9 (120 reviews)</span>
                    </div>

                    <p className="text-[var(--text-secondary)] leading-relaxed">
                        Our signature maintenance detail. Includes full exterior hand wash, clay bar treatment, premium wax application, deep wheel cleaning, and comprehensive interior vacuum and wipe down.
                    </p>

                    <div>
                        <h3 className="font-semibold mb-3 text-[var(--text-primary)]">Add-ons</h3>
                        <div className="space-y-2">
                            <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--divider)]">
                                <span className="text-sm">Engine Bay Detail</span>
                                <input type="checkbox" className="w-5 h-5 accent-[var(--accent)]" />
                            </label>
                            <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--divider)]">
                                <span className="text-sm">Pet Hair Removal</span>
                                <input type="checkbox" className="w-5 h-5 accent-[var(--accent)]" />
                            </label>
                        </div>
                    </div>
                </div>
            </BottomSheetModal>
        </div>
    );
}
