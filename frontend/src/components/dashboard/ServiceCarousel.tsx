"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import ServiceCard from "../ui/ServiceCard";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";

type Service = Database["public"]["Tables"]["services"]["Row"];

export default function ServiceCarousel({ onSelectService }: { onSelectService: (serviceId: number) => void }) {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();
    const params = useParams();
    const locale = (params?.lang as string) || 'en';

    useEffect(() => {
        async function fetchServices() {
            try {
                const { data, error } = await supabase
                    .from("services")
                    .select("*")
                    .eq("is_active", true)
                    .order("sort_order", { ascending: true });

                if (error) throw error;
                setServices(data || []);
            } catch (error) {
                console.error("Error fetching services:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchServices();
    }, [supabase]);

    return (
        <div className="relative w-full">
            <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-8 pt-2 px-6 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollBehavior: "smooth" }}
            >
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="min-w-[280px] h-64 animate-pulse bg-white/10 rounded-3xl" />
                    ))
                ) : services.map((service) => (
                    <ServiceCard
                        key={service.id}
                        title={(locale === 'es' && service.name_es) ? service.name_es : service.name}
                        price={`$${service.base_price}`}
                        description={(locale === 'es' && service.description_es) ? service.description_es : (service.description || "")}
                        onClick={() => onSelectService(service.id)}
                    />
                ))}
                {/* Padding element for end of list */}
                <div className="w-2 shrink-0" />
            </div>
        </div>
    );
}
