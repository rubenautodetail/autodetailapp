"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Star, Clock, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/contexts/BookingContext";
import { Database } from "@/types/database";

type DbService = Database["public"]["Tables"]["services"]["Row"];

export default function ServicesPage() {
    const params = useParams();
    const locale = (params?.lang as string) || "en";
    const isEs = locale === "es";
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { resetBooking, setService } = useBooking();

    const [services, setServices] = useState<DbService[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (authLoading) return;
        if (!user) router.replace(`/${locale}/login`);
    }, [authLoading, user, locale, router]);

    useEffect(() => {
        async function fetchServices() {
            const { data } = await supabase
                .from("services")
                .select("*")
                .eq("is_active", true)
                .order("sort_order", { ascending: true });
            setServices(data || []);
            setIsLoading(false);
        }
        fetchServices();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleBook = (service: DbService) => {
        resetBooking();
        setService({
            id: service.id,
            documentId: String(service.id),
            name: (isEs && service.name_es) ? service.name_es : service.name,
            description: service.description || "",
            basePrice: Number(service.base_price),
            duration: service.duration_minutes || 60,
        });
        router.push(`/${locale}/booking/location`);
    };

    return (
        <div className="min-h-screen bg-[#131835] pb-28">
            {/* Header */}
            <div className="px-6 pt-8 pb-4">
                <h1 className="text-2xl font-bold text-white">
                    {isEs ? "Servicios" : "Services"}
                </h1>
                <p className="text-white/50 text-sm mt-1">
                    {isEs ? "Elige el servicio perfecto para tu auto" : "Choose the perfect service for your car"}
                </p>
            </div>

            {/* Services List */}
            <div className="px-6 space-y-3">
                {isLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 animate-pulse bg-white/10 rounded-2xl" />
                    ))
                    : services.map((service) => {
                        const name = (isEs && service.name_es) ? service.name_es : service.name;
                        const desc = (isEs && service.description_es) ? service.description_es : (service.description || "");
                        return (
                            <button
                                key={service.id}
                                onClick={() => handleBook(service)}
                                className="w-full text-left bg-[#1A2142] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-4 hover:border-[#D0B078]/40 hover:bg-[#1F2850] transition-all duration-200 active:scale-[0.98]"
                            >
                                {/* Price badge */}
                                <div className="shrink-0 w-16 text-center">
                                    <span className="text-[#D0B078] font-bold text-lg">
                                        ${service.base_price}
                                    </span>
                                    <p className="text-white/30 text-[10px]">{isEs ? "desde" : "from"}</p>
                                </div>

                                {/* Divider */}
                                <div className="w-px h-10 bg-white/10 shrink-0" />

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold text-sm truncate">{name}</p>
                                    <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{desc}</p>
                                    {service.duration_minutes && (
                                        <div className="flex items-center gap-1 mt-1.5">
                                            <Clock className="w-3 h-3 text-white/30" />
                                            <span className="text-white/30 text-[10px]">
                                                {service.duration_minutes} {isEs ? "min" : "min"}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
                            </button>
                        );
                    })
                }
            </div>

            {/* Book Now CTA */}
            {!isLoading && services.length > 0 && (
                <div className="px-6 mt-6">
                    <Link
                        href={`/${locale}/booking/select`}
                        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#D0B078] to-[#b8924a] text-[#131835] font-bold py-3.5 rounded-2xl hover:opacity-90 transition-opacity"
                    >
                        {isEs ? "Ver Todos los Servicios" : "View Full Service Menu"}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}
        </div>
    );
}
