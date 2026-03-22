"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Plus, ArrowRight, Sparkles, Clock, Check } from "lucide-react";
import Header from "@/components/dashboard/Header";
import ServiceCarousel from "@/components/dashboard/ServiceCarousel";
import { BookingCard } from "@/components/dashboard/BookingCard";
import { VehicleCard } from "@/components/dashboard/VehicleCard";
import BottomSheetModal from "@/components/ui/BottomSheetModal";
import { Vehicle } from "@/contexts/BookingStatusContext";

import { createClient } from "@/lib/supabase/client";

import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/contexts/BookingContext";
import { Database } from "@/types/database";

type DbService = Database["public"]["Tables"]["services"]["Row"];
type DbAddOn = Database["public"]["Tables"]["add_ons"]["Row"];

export default function DashboardPage() {
    const params = useParams();
    const locale = (params?.lang as string) || 'en';
    const router = useRouter();
    const { user, profile, isLoading: authLoading } = useAuth();
    const { setService, addAddOn, removeAddOn, selectedAddOns, resetBooking } = useBooking();
    const isEs = locale === 'es';

    // Auth guard — redirect to login if not authenticated
    useEffect(() => {
        if (authLoading) return;
        if (!user) router.replace(`/${locale}/login`);
    }, [authLoading, user, locale, router]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const [isLoadingBookings, setIsLoadingBookings] = useState(true);
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
    const [allServices, setAllServices] = useState<DbService[]>([]);
    const [allAddOns, setAllAddOns] = useState<DbAddOn[]>([]);
    const supabase = createClient();
    const userEmailRef = useRef<string | undefined>(undefined);

    const fetchBookings = async (email: string, userId?: string) => {
        try {
            // Match by customer_email OR user_id — covers cases where the
            // email typed in the booking form differs from the auth email.
            const orFilter = userId
                ? `customer_email.eq.${email},user_id.eq.${userId}`
                : `customer_email.eq.${email}`;
            const { data, error } = await supabase
                .from("bookings")
                .select("*")
                .or(orFilter)
                .order("date", { ascending: false })
                .limit(5);

            if (error) throw error;

            setBookings((data || []).map(b => ({
                id: b.id.toString(),
                confirmationCode: (b as any).confirmation_code ?? undefined,
                serviceName: (b as any).service_name || "Service",
                date: b.date,
                time: (b as any).time_window || "Scheduled",
                status: (b.status as any) || "pending",
                price: parseFloat(String(b.total_amount ?? '0')) || 0,
                providerName: "Ruben's Team"
            })));
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setIsLoadingBookings(false);
        }
    };

    useEffect(() => {
        async function fetchVehicles() {
            if (!profile?.id) return;
            try {
                const { data, error } = await supabase
                    .from("vehicles")
                    .select("*")
                    .eq("user_id", profile.id);

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
            } catch (error) {
                console.error("Error fetching vehicles:", error);
            } finally {
                setIsLoadingVehicles(false);
            }
        }

        if (profile) {
            userEmailRef.current = user?.email;
            fetchVehicles();
            if (user?.email) fetchBookings(user.email, user.id);
        }
    }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

    // Realtime: refresh bookings when their status changes
    useEffect(() => {
        if (!user?.email) return;
        const email = user.email;

        const channel = supabase
            .channel("customer-bookings")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "bookings" },
                (payload) => {
                    const updated = payload.new as { customer_email?: string; user_id?: string };
                    if (updated.customer_email === email || updated.user_id === user?.id) {
                        fetchBookings(email, user?.id);
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch services and add-ons for the modal
    useEffect(() => {
        async function fetchCatalog() {
            const [{ data: svc }, { data: addons }] = await Promise.all([
                supabase.from("services").select("*").eq("is_active", true).order("sort_order"),
                supabase.from("add_ons").select("*").eq("is_active", true).order("sort_order"),
            ]);
            setAllServices(svc || []);
            setAllAddOns(addons || []);
        }
        fetchCatalog();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedServiceData = allServices.find(s => s.id === selectedServiceId);

    const handleServiceSelect = (id: number) => {
        setSelectedServiceId(id);
    };

    const handleCloseModal = () => {
        setSelectedServiceId(null);
    };

    const isAddOnSelected = (addOnId: number) =>
        selectedAddOns.some(a => String(a.id) === String(addOnId));

    const toggleAddOn = (addOn: DbAddOn) => {
        if (isAddOnSelected(addOn.id)) {
            removeAddOn(addOn.id);
        } else {
            addAddOn({
                id: addOn.id,
                documentId: String(addOn.id),
                name: (locale === 'es' && addOn.name_es) ? addOn.name_es : addOn.name,
                price: Number(addOn.price),
                description: addOn.description || '',
            });
        }
    };

    const handleContinueBooking = () => {
        if (!selectedServiceData) return;
        // Capture current add-on selections before reset clears them
        const currentAddOns = [...selectedAddOns];
        resetBooking();
        setService({
            id: selectedServiceData.id,
            documentId: String(selectedServiceData.id),
            name: (locale === 'es' && selectedServiceData.name_es) ? selectedServiceData.name_es : selectedServiceData.name,
            description: selectedServiceData.description || '',
            basePrice: Number(selectedServiceData.base_price),
            duration: selectedServiceData.duration_minutes || 60,
        });
        // Re-add the add-ons the user selected in the modal
        currentAddOns.forEach(a => addAddOn(a));
        setSelectedServiceId(null);
        router.push(`/${locale}/booking/location`);
    };

    const modalTotal = selectedServiceData
        ? Number(selectedServiceData.base_price) + selectedAddOns.reduce((sum, a) => sum + a.price, 0)
        : 0;

    return (
        <div className="min-h-screen bg-[#131835]">
            <div className="px-6">
                <Header profileName={profile?.full_name || (isEs ? 'Invitado' : 'Guest')} />
            </div>

            <main className="space-y-6 md:space-y-8 pb-8">
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
                                href={`/${locale}/booking/select`}
                                className="inline-block bg-white text-[#D0B078] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                            >
                                {isEs ? 'Reservar Ahora' : 'Book Now'}
                            </Link>
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute -right-4 -bottom-16 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    </div>
                </section>

                {/* Service Selection */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-6">
                        <h2 className="text-lg font-bold text-white">
                            {isEs ? 'Reservar Servicio' : 'Book a Service'}
                        </h2>
                        <Link href={`/${locale}/booking/select`} className="text-sm font-medium text-[#D0B078] hover:text-[#D0B078]/80 transition-colors flex items-center">
                            {isEs ? 'Ver Todos' : 'See All'} <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                    <ServiceCarousel onSelectService={handleServiceSelect} />
                </section>

                {/* Recent Activity / Current Booking */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-6">
                        <h2 className="text-lg font-bold text-white">
                            {isEs ? 'Actividad Reciente' : 'Recent Activity'}
                        </h2>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 px-6 -mx-0 scrollbar-hide snap-x snap-mandatory">
                        {isLoadingBookings ? (
                            Array.from({ length: 1 }).map((_, i) => (
                                <div key={i} className="min-w-[85vw] md:min-w-[400px] animate-pulse">
                                    <div className="h-32 bg-white/10 rounded-2xl"></div>
                                </div>
                            ))
                        ) : bookings.length > 0 ? (
                            bookings.map((booking, index) => (
                                <div key={booking.id} className="min-w-[85vw] md:min-w-[400px] snap-center">
                                    <BookingCard
                                        {...booking}
                                        index={index}
                                        onRefresh={() => user?.email && fetchBookings(user.email, user.id)}
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-6 text-center text-[#A5B0D1] bg-[#1A2142] rounded-2xl border border-dashed border-[#2C355E] flex-1 min-w-[85vw]">
                                <p className="text-sm">{isEs ? 'No hay reservas recientes' : 'No recent bookings found'}</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* My Vehicles */}
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

                    <div className="flex gap-4 overflow-x-auto pb-4 px-6 -mx-0 scrollbar-hide snap-x snap-mandatory">
                        {isLoadingVehicles ? (
                            Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="min-w-[80vw] md:min-w-[350px] animate-pulse">
                                    <div className="h-40 bg-white/10 rounded-2xl"></div>
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
                            <div className="px-6 py-8 text-center text-[#A5B0D1] bg-[#1A2142] rounded-2xl border border-dashed border-[#2C355E] flex-1 min-w-[80vw] mx-6">
                                <p className="text-sm">{isEs ? 'Aún no has añadido vehículos' : 'No vehicles added yet'}</p>
                            </div>
                        )}
                        {/* Add Vehicle Card */}
                        <div className="min-w-[100px] flex items-center justify-center">
                            <Link
                                href={`/${locale}/dashboard/vehicles`}
                                className="w-12 h-12 rounded-full bg-[#1A2142] border border-[#2C355E] flex items-center justify-center text-[#A5B0D1] hover:text-[#D0B078] shadow-sm"
                            >
                                <Plus className="w-6 h-6" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Quick Action Card */}
                <section className="px-6">
                    <div className="bg-[#1A2142] rounded-2xl p-4 border border-[#2C355E] shadow-sm flex items-center justify-between">
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
                        <Link
                            href={`/${locale}/booking/select`}
                            className="text-xs font-bold text-[#D0B078] px-3 py-1.5 rounded-lg bg-[#D0B078]/5 hover:bg-[#D0B078]/10 transition-colors"
                        >
                            {isEs ? 'Reservar' : 'Book'}
                        </Link>
                    </div>
                </section>
            </main>

            {/* Service Detail Modal */}
            <BottomSheetModal
                isOpen={!!selectedServiceData}
                onClose={handleCloseModal}
                title={(locale === 'es' && selectedServiceData?.name_es) ? selectedServiceData.name_es : (selectedServiceData?.name || '')}
                footer={
                    <button
                        onClick={handleContinueBooking}
                        className="block w-full text-center py-4 rounded-xl bg-[#D0B078] text-[#131835] font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                        {isEs ? 'Continuar' : 'Continue'} — ${modalTotal.toFixed(2)}
                    </button>
                }
            >
                {selectedServiceData && (
                    <div className="space-y-5">
                        {/* Service info */}
                        <div className="flex items-center gap-3 text-sm text-[#A5B0D1]">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {selectedServiceData.duration_minutes || 60} min
                            </span>
                            <span className="text-[#D0B078] font-bold text-lg ml-auto">
                                ${Number(selectedServiceData.base_price).toFixed(2)}
                            </span>
                        </div>

                        {selectedServiceData.description && (
                            <p className="text-[#A5B0D1] text-sm leading-relaxed">
                                {(locale === 'es' && selectedServiceData.description_es) ? selectedServiceData.description_es : selectedServiceData.description}
                            </p>
                        )}

                        {/* Add-ons */}
                        {allAddOns.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-3 text-white">
                                    {locale === 'es' ? 'Extras' : 'Add-ons'}
                                </h3>
                                <div className="space-y-2">
                                    {allAddOns.map((addOn) => {
                                        const selected = isAddOnSelected(addOn.id);
                                        return (
                                            <button
                                                key={addOn.id}
                                                type="button"
                                                onClick={() => toggleAddOn(addOn)}
                                                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                                                    selected
                                                        ? 'border-[#D0B078] bg-[#D0B078]/5'
                                                        : 'border-[#2C355E] hover:border-[#D0B078]/30'
                                                }`}
                                            >
                                                <div className="text-left">
                                                    <span className="text-sm font-medium text-white">
                                                        {(locale === 'es' && addOn.name_es) ? addOn.name_es : addOn.name}
                                                    </span>
                                                    {addOn.description && (
                                                        <p className="text-xs text-[#A5B0D1] mt-0.5">
                                                            {(locale === 'es' && addOn.description_es) ? addOn.description_es : addOn.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 ml-3 shrink-0">
                                                    <span className="text-sm font-semibold text-white">
                                                        +${Number(addOn.price).toFixed(2)}
                                                    </span>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                        selected
                                                            ? 'bg-[#D0B078] border-[#D0B078]'
                                                            : 'border-[#2C355E]'
                                                    }`}>
                                                        {selected && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </BottomSheetModal>
        </div>
    );
}
