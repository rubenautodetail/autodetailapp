"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface Booking {
    id: string;
    service_name: string | null;
    date: string;
    status: string;
    total_amount: string | number | null;
    address: string | null;
    confirmation_code: string | null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pending_payment: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
    pending_assignment: { bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
    confirmed: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
    in_progress: { bg: 'bg-[var(--accent)]/10', text: 'text-[var(--accent)]' },
    completed: { bg: 'bg-green-500/10', text: 'text-green-500' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-500' },
};

export default function MyOrdersPage() {
    const router = useRouter();
    const params = useParams();
    const locale = (params?.lang as string) || 'en';
    const isEs = locale === 'es';
    const { user, isLoading: authLoading } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (authLoading) return;
        if (!user?.email) {
            setIsLoading(false);
            return;
        }

        const fetchBookings = async () => {
            const { data, error } = await supabase
                .from("bookings")
                .select("id, service_name, date, status, total_amount, address, confirmation_code")
                .eq("customer_email", user.email!)
                .order("date", { ascending: false });

            if (!error && data) {
                setBookings(data as Booking[]);
            }
            setIsLoading(false);
        };

        fetchBookings();
    }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    const statusLabel = (status: string) => {
        const labels: Record<string, { en: string; es: string }> = {
            pending_payment: { en: 'Processing Payment', es: 'Procesando Pago' },
            pending: { en: 'Pending', es: 'Pendiente' },
            pending_assignment: { en: 'Confirmed – Assigning Technician', es: 'Confirmado – Asignando Técnico' },
            confirmed: { en: 'Confirmed', es: 'Confirmado' },
            in_progress: { en: 'In Progress', es: 'En Progreso' },
            completed: { en: 'Completed', es: 'Completado' },
            cancelled: { en: 'Cancelled', es: 'Cancelado' },
        };
        const l = labels[status] || { en: status, es: status };
        return isEs ? l.es : l.en;
    };

    return (
        <div className="min-h-screen bg-[var(--background)] p-6">
            <header className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm border border-[var(--divider)]"
                >
                    <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
                </button>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{isEs ? 'Mis Reservas' : 'My Orders'}</h1>
            </header>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
                </div>
            ) : bookings.length === 0 ? (
                <div className="text-center py-12 bg-[var(--card)] rounded-2xl border border-dashed border-[var(--divider)]">
                    <p className="text-[var(--text-secondary)]">
                        {isEs ? 'No tienes reservas aún' : 'No bookings yet'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map((b) => {
                        const colors = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
                        return (
                            <div key={b.id} className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--divider)] shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className={`px-2 py-1 rounded-md ${colors.bg} ${colors.text} text-xs font-bold uppercase`}>
                                            {statusLabel(b.status)}
                                        </span>
                                        <h3 className="font-semibold text-[var(--text-primary)] mt-2">
                                            {b.service_name || (isEs ? 'Servicio' : 'Service')}
                                        </h3>
                                    </div>
                                    <span className="font-bold text-[var(--text-primary)]">
                                        ${parseFloat(String(b.total_amount ?? '0')).toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] mb-1">
                                    {new Date(b.date).toLocaleDateString(locale, {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </p>
                                {b.confirmation_code && (
                                    <p className="text-xs text-[var(--accent)] font-mono">
                                        {b.confirmation_code}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
