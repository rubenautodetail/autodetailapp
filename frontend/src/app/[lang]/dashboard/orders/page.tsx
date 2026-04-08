"use client";

import { useState, useEffect } from "react";
import { Loader2, Star, ChevronRight, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface Booking {
    id: string;
    service_name: string | null;
    date: string;
    time_window: string | null;
    status: string;
    total_amount: string | number | null;
    address: string | null;
    confirmation_code: string | null;
    review_rating: number | null;
}

/** Format raw time_window values for display. */
function formatTimeWindow(raw: string, isEs: boolean): string {
    const legacyMap: Record<string, { en: string; es: string }> = {
        morning:   { en: 'Morning',   es: 'Mañana' },
        afternoon: { en: 'Afternoon', es: 'Tarde' },
        evening:   { en: 'Evening',   es: 'Noche' },
    };
    const legacy = legacyMap[raw.toLowerCase()];
    if (legacy) return isEs ? legacy.es : legacy.en;

    const match = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
        const h = parseInt(match[1], 10);
        const m = match[2];
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${h12}:${m} ${period}`;
    }

    return raw;
}

const STATUS_META: Record<string, { bg: string; text: string; dot: string; en: string; es: string }> = {
    pending_payment:   { bg: 'bg-gray-500/10',          text: 'text-gray-400',       dot: 'bg-gray-400',       en: 'Processing',          es: 'Procesando' },
    pending:           { bg: 'bg-yellow-500/10',         text: 'text-yellow-400',     dot: 'bg-yellow-400',     en: 'Pending',             es: 'Pendiente' },
    pending_assignment:{ bg: 'bg-yellow-500/10',         text: 'text-yellow-400',     dot: 'bg-yellow-400',     en: 'Assigning Tech',      es: 'Asignando Técnico' },
    confirmed:         { bg: 'bg-blue-500/10',           text: 'text-blue-400',       dot: 'bg-blue-400',       en: 'Confirmed',           es: 'Confirmado' },
    in_progress:       { bg: 'bg-[#D0B078]/10',          text: 'text-[#D0B078]',      dot: 'bg-[#D0B078]',      en: 'In Progress',         es: 'En Progreso' },
    completed:         { bg: 'bg-green-500/10',          text: 'text-green-400',      dot: 'bg-green-400',      en: 'Completed',           es: 'Completado' },
    cancelled:         { bg: 'bg-red-500/10',            text: 'text-red-400',        dot: 'bg-red-400',        en: 'Cancelled',           es: 'Cancelado' },
};

const DEFAULT_META = { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400', en: 'Unknown', es: 'Desconocido' };

export default function MyOrdersPage() {
    const params = useParams();
    const locale = (params?.lang as string) || 'en';
    const isEs = locale === 'es';
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.replace(`/${locale}/login`); return; }
        if (!user?.email) { setIsLoading(false); return; }

        const fetchBookings = async () => {
            const orFilter = user.id
                ? `customer_email.eq.${user.email},user_id.eq.${user.id}`
                : `customer_email.eq.${user.email}`;
            const { data, error } = await supabase
                .from("bookings")
                .select("id, service_name, date, time_window, status, total_amount, address, confirmation_code, review_rating")
                .or(orFilter)
                .order("date", { ascending: false });

            if (!error && data) setBookings(data as Booking[]);
            setIsLoading(false);
        };

        fetchBookings();
    }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    const active = bookings.filter(b => !['completed', 'cancelled'].includes(b.status));
    const past = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    const BookingRow = ({ b }: { b: Booking }) => {
        const meta = STATUS_META[b.status] ?? DEFAULT_META;
        const label = isEs ? meta.es : meta.en;
        const canReview = b.status === 'completed' && !b.review_rating;
        const reviewed = b.status === 'completed' && !!b.review_rating;

        return (
            <div className="bg-[#1A2142] border border-[#2C355E] rounded-2xl p-4 space-y-3">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">
                            {b.service_name || (isEs ? 'Servicio' : 'Service')}
                        </p>
                        {b.confirmation_code && (
                            <p className="text-[10px] text-[#D0B078] font-mono mt-0.5">{b.confirmation_code}</p>
                        )}
                    </div>
                    <span className="text-white font-bold text-sm shrink-0">
                        ${parseFloat(String(b.total_amount ?? '0')).toFixed(2)}
                    </span>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.bg} ${meta.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {label}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[#A5B0D1]">
                        <CalendarDays className="w-3 h-3" />
                        {formatDate(b.date)}
                        {b.time_window && ` · ${formatTimeWindow(b.time_window, isEs)}`}
                    </span>
                    {b.address && (
                        <span className="flex items-center gap-1 text-[11px] text-[#A5B0D1] truncate max-w-[140px]">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {b.address}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {canReview && (
                        <Link
                            href={`/${locale}/booking/${b.id}/review`}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#D0B078] bg-[#D0B078]/10 px-3 py-1.5 rounded-lg hover:bg-[#D0B078]/20 transition-colors"
                        >
                            <Star className="w-3 h-3" />
                            {isEs ? 'Dejar Reseña' : 'Leave a Review'}
                        </Link>
                    )}
                    {reviewed && (
                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg">
                            <Star className="w-3 h-3 fill-green-400" />
                            {isEs ? 'Reseña enviada' : 'Review submitted'}
                        </span>
                    )}
                    <Link
                        href={`/${locale}/booking/${b.id}/track`}
                        className="ml-auto flex items-center gap-1 text-xs text-[#A5B0D1] hover:text-white transition-colors"
                    >
                        {isEs ? 'Ver detalles' : 'View details'}
                        <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#131835] pb-28 md:pb-10">
            <div className="px-6 pt-8 pb-4">
                <h1 className="text-2xl font-bold text-white">
                    {isEs ? 'Mis Reservas' : 'My Orders'}
                </h1>
                <p className="text-[#A5B0D1] text-sm mt-1">
                    {isEs ? 'Historial completo de tus servicios' : 'Your full service history'}
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-7 h-7 animate-spin text-[#D0B078]" />
                </div>
            ) : bookings.length === 0 ? (
                <div className="mx-6 py-12 text-center bg-[#1A2142] rounded-2xl border border-dashed border-[#2C355E]">
                    <p className="text-[#A5B0D1] text-sm">{isEs ? 'No tienes reservas aún' : 'No bookings yet'}</p>
                    <Link
                        href={`/${locale}/dashboard/services`}
                        className="inline-block mt-4 text-sm font-bold text-[#D0B078] px-4 py-2 bg-[#D0B078]/10 rounded-xl hover:bg-[#D0B078]/20 transition-colors"
                    >
                        {isEs ? 'Reservar un Servicio' : 'Book a Service'}
                    </Link>
                </div>
            ) : (
                <div className="px-6 space-y-6">
                    {active.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold text-[#A5B0D1] uppercase tracking-wider mb-3">
                                {isEs ? 'Activas' : 'Active'}
                            </h2>
                            <div className="space-y-3">
                                {active.map(b => <BookingRow key={b.id} b={b} />)}
                            </div>
                        </section>
                    )}
                    {past.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold text-[#A5B0D1] uppercase tracking-wider mb-3">
                                {isEs ? 'Historial' : 'History'}
                            </h2>
                            <div className="space-y-3">
                                {past.map(b => <BookingRow key={b.id} b={b} />)}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
