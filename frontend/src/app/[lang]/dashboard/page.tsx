"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Plus, Sparkles, ClipboardList, ChevronRight, Car } from "lucide-react";
import Header from "@/components/dashboard/Header";
import { VehicleCard } from "@/components/dashboard/VehicleCard";
import { Vehicle } from "@/contexts/BookingStatusContext";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
    const params = useParams();
    const locale = (params?.lang as string) || 'en';
    const router = useRouter();
    const { user, profile, isLoading: authLoading } = useAuth();
    const isEs = locale === 'es';

    useEffect(() => {
        if (authLoading) return;
        if (!user) router.replace(`/${locale}/login`);
    }, [authLoading, user, locale, router]);

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [bookingCount, setBookingCount] = useState<number | null>(null);
    const [lastBooking, setLastBooking] = useState<{ service_name: string | null; status: string; date: string } | null>(null);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!profile?.id) return;

        async function fetchVehicles() {
            try {
                const { data, error } = await supabase
                    .from("vehicles")
                    .select("*")
                    .eq("user_id", profile!.id);
                if (error) throw error;
                setVehicles((data || []).map(v => ({
                    id: v.id,
                    make: v.make,
                    model: v.model,
                    year: v.year.toString(),
                    color: v.color || "",
                    type: (v.type as any) || "sedan",
                    licensePlate: v.license_plate || ""
                })));
            } finally {
                setIsLoadingVehicles(false);
            }
        }

        async function fetchBookingSummary() {
            if (!user?.email) return;
            const orFilter = user.id
                ? `customer_email.eq.${user.email},user_id.eq.${user.id}`
                : `customer_email.eq.${user.email}`;
            const { data } = await supabase
                .from("bookings")
                .select("service_name, status, date")
                .or(orFilter)
                .order("date", { ascending: false })
                .limit(10);
            if (data) {
                setBookingCount(data.length);
                setLastBooking(data[0] ?? null);
            }
        }

        fetchVehicles();
        fetchBookingSummary();
    }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

    const firstName = profile?.full_name?.split(' ')[0] || (isEs ? 'allí' : 'there');

    const STATUS_DOT: Record<string, string> = {
        completed: 'bg-green-400',
        confirmed: 'bg-blue-400',
        in_progress: 'bg-[#D0B078]',
        pending_assignment: 'bg-yellow-400',
        pending: 'bg-yellow-400',
        cancelled: 'bg-red-400',
    };
    const STATUS_LABEL: Record<string, { en: string; es: string }> = {
        completed:          { en: 'Completed',        es: 'Completado' },
        confirmed:          { en: 'Confirmed',         es: 'Confirmado' },
        in_progress:        { en: 'In Progress',       es: 'En Progreso' },
        pending_assignment: { en: 'Assigning Tech',    es: 'Asignando Técnico' },
        pending:            { en: 'Pending',           es: 'Pendiente' },
        cancelled:          { en: 'Cancelled',         es: 'Cancelado' },
    };

    return (
        <div className="min-h-screen bg-[#131835]">
            <div className="px-6">
                <Header profileName={profile?.full_name || (isEs ? 'Invitado' : 'Guest')} />
            </div>

            <main className="space-y-6 md:space-y-8 pb-28 md:pb-10">

                {/* Welcome Hero */}
                <section className="px-6">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e1060] via-[#1a1a5e] to-[#0f2460] p-6 shadow-xl border border-white/[0.06]">
                        {/* Glow blobs */}
                        <div className="absolute -right-10 -top-10 w-44 h-44 bg-[#7c3aed]/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-[#2563eb]/20 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10">
                            <p className="text-[#A5B0D1] text-sm mb-1">
                                {isEs ? `¡Hola de nuevo, ${firstName}!` : `Welcome back, ${firstName}!`}
                            </p>
                            <h2 className="text-white text-2xl font-bold leading-tight mb-4">
                                {isEs ? 'Tu auto merece\nlo mejor.' : 'Your car deserves\nthe best.'}
                            </h2>

                            {/* Stats row */}
                            <div className="flex items-center gap-4 mb-5">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-[#D0B078]">
                                        {bookingCount === null ? '–' : bookingCount}
                                    </p>
                                    <p className="text-[10px] text-[#A5B0D1] uppercase tracking-wider">
                                        {isEs ? 'Servicios' : 'Services'}
                                    </p>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-[#D0B078]">{vehicles.length}</p>
                                    <p className="text-[10px] text-[#A5B0D1] uppercase tracking-wider">
                                        {isEs ? 'Vehículos' : 'Vehicles'}
                                    </p>
                                </div>
                                {lastBooking && (
                                    <>
                                        <div className="w-px h-8 bg-white/10" />
                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[lastBooking.status] ?? 'bg-gray-400'}`} />
                                            <div className="min-w-0">
                                                <p className="text-white text-xs font-semibold truncate">
                                                    {lastBooking.service_name || (isEs ? 'Servicio' : 'Service')}
                                                </p>
                                                <p className="text-[10px] text-[#A5B0D1]">
                                                    {(STATUS_LABEL[lastBooking.status] ?? { en: lastBooking.status, es: lastBooking.status })[isEs ? 'es' : 'en']}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <Link
                                    href={`/${locale}/dashboard/services`}
                                    className="flex-1 flex items-center justify-center gap-2 bg-[#D0B078] text-[#131835] px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#c4a46a] transition-colors"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    {isEs ? 'Nuevo Servicio' : 'New Service'}
                                </Link>
                                <Link
                                    href={`/${locale}/dashboard/orders`}
                                    className="flex items-center gap-1.5 text-sm text-[#A5B0D1] px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 transition-colors"
                                >
                                    <ClipboardList className="w-4 h-4" />
                                    {isEs ? 'Mis Reservas' : 'My Orders'}
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Special Offer Banner */}
                <section className="px-6">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#7c3aed] to-[#2563eb] p-6 text-white shadow-lg">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-5 h-5 text-yellow-300" />
                                <span className="text-sm font-bold uppercase tracking-wider text-yellow-300">
                                    {isEs ? 'Oferta Limitada' : 'Limited Offer'}
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold mb-1">
                                {isEs ? '20% de Descuento en Cerámico' : 'Get 20% Off Ceramic'}
                            </h3>
                            <p className="text-white/90 mb-4 text-sm max-w-[80%]">
                                {isEs ? 'Protege tu auto para la temporada de lluvias.' : 'Protect your car for the rainy season.'}
                            </p>
                            <Link
                                href={`/${locale}/dashboard/services`}
                                className="inline-block bg-white text-[#D0B078] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                            >
                                {isEs ? 'Reservar Ahora' : 'Book Now'}
                            </Link>
                        </div>
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -right-4 -bottom-16 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    </div>
                </section>

                {/* My Garage */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-6">
                        <h2 className="text-lg font-bold text-white">
                            {isEs ? 'Mi Garaje' : 'My Garage'}
                        </h2>
                        <Link
                            href={`/${locale}/dashboard/vehicles`}
                            className="w-8 h-8 rounded-full bg-[#1A2142] border border-[#2C355E] flex items-center justify-center text-[#A5B0D1] hover:text-[#D0B078] transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Mobile: horizontal scroll */}
                    <div className="md:hidden flex gap-4 overflow-x-auto pb-4 px-6 scrollbar-hide snap-x snap-mandatory">
                        {isLoadingVehicles ? (
                            Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="min-w-[80vw] animate-pulse snap-center">
                                    <div className="h-40 bg-white/10 rounded-2xl" />
                                </div>
                            ))
                        ) : vehicles.length > 0 ? (
                            vehicles.map((vehicle) => (
                                <div key={vehicle.id} className="min-w-[80vw] snap-center">
                                    <VehicleCard vehicle={vehicle} onDelete={() => {}} onEdit={() => {}} />
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-8 text-center text-[#A5B0D1] bg-[#1A2142] rounded-2xl border border-dashed border-[#2C355E] flex-1 min-w-[80vw]">
                                <Car className="w-8 h-8 mx-auto mb-2 text-[#2C355E]" />
                                <p className="text-sm">{isEs ? 'Aún no has añadido vehículos' : 'No vehicles added yet'}</p>
                            </div>
                        )}
                        <div className="min-w-[100px] flex items-center justify-center">
                            <Link href={`/${locale}/dashboard/vehicles`} className="w-12 h-12 rounded-full bg-[#1A2142] border border-[#2C355E] flex items-center justify-center text-[#A5B0D1] hover:text-[#D0B078] shadow-sm">
                                <Plus className="w-6 h-6" />
                            </Link>
                        </div>
                    </div>

                    {/* Desktop: grid */}
                    <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-6">
                        {isLoadingVehicles ? (
                            Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="h-40 bg-white/10 rounded-2xl" />
                                </div>
                            ))
                        ) : vehicles.length > 0 ? (
                            vehicles.map((vehicle) => (
                                <VehicleCard key={vehicle.id} vehicle={vehicle} onDelete={() => {}} onEdit={() => {}} />
                            ))
                        ) : (
                            <div className="col-span-full py-8 text-center text-[#A5B0D1] bg-[#1A2142] rounded-2xl border border-dashed border-[#2C355E]">
                                <p className="text-sm">{isEs ? 'Aún no has añadido vehículos' : 'No vehicles added yet'}</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Quick Action — Mobile Service */}
                <section className="px-6">
                    <Link
                        href={`/${locale}/dashboard/services`}
                        className="bg-[#1A2142] rounded-2xl p-4 border border-[#2C355E] shadow-sm flex items-center justify-between hover:border-[#D0B078]/30 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#D0B078]/10 flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5 text-[#D0B078]" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">
                                    {isEs ? 'Servicio Móvil' : 'Mobile Service'}
                                </h3>
                                <p className="text-xs text-[#A5B0D1]">
                                    {isEs ? 'Vamos a donde estés en Miami' : 'We come to you anywhere in Miami'}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#A5B0D1]" />
                    </Link>
                </section>
            </main>
        </div>
    );
}
