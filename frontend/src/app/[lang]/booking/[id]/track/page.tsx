'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingStatus =
    | 'pending_assignment'
    | 'confirmed'
    | 'en_route'
    | 'in_progress'
    | 'pending_approval'
    | 'completed'
    | 'cancelled';

interface ContractorProfile {
    full_name: string | null;
}

interface Booking {
    id: number;
    document_id: string | null;
    status: string | null;
    payment_status: string | null;
    contractor_id: string | null;
    date: string;
    time_window: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    total_amount: string | number;
    service_name: string | null;
    confirmation_code: string | null;
    profiles: ContractorProfile | null;
}

// ── Step config ───────────────────────────────────────────────────────────────

type StepKey = 'confirmed' | 'assigned' | 'enRoute' | 'inProgress' | 'complete';

interface Step {
    key: StepKey;
    labelEn: string;
    labelEs: string;
    icon: 'check' | 'truck' | 'wrench' | 'star';
}

const STEPS: Step[] = [
    { key: 'confirmed', labelEn: 'Booking Confirmed', labelEs: 'Reserva Confirmada', icon: 'check' },
    { key: 'assigned', labelEn: 'Contractor Assigned', labelEs: 'Técnico Asignado', icon: 'check' },
    { key: 'enRoute', labelEn: 'On The Way', labelEs: 'En Camino', icon: 'truck' },
    { key: 'inProgress', labelEn: 'Service In Progress', labelEs: 'Servicio en Progreso', icon: 'wrench' },
    { key: 'complete', labelEn: 'Service Complete', labelEs: 'Servicio Completado', icon: 'star' },
];

// Returns index of the CURRENT (active/pulsing) step (0-based)
function getActiveStepIndex(status: BookingStatus): number {
    switch (status) {
        case 'pending_assignment': return 1; // step 2 active
        case 'confirmed':          return 2; // step 3 active
        case 'en_route':           return 2; // step 3 pulsing
        case 'in_progress':        return 3; // step 4 active
        case 'pending_approval':
        case 'completed':          return 4; // step 5 complete
        default:                   return 0;
    }
}

// Steps that are fully complete (green checkmark) vs active vs upcoming
function getStepState(
    stepIdx: number,
    activeIdx: number,
    status: BookingStatus,
): 'complete' | 'active' | 'upcoming' {
    if (stepIdx < activeIdx) return 'complete';
    if (stepIdx === activeIdx) {
        // step 5 (idx 4) is fully complete for pending_approval / completed
        if (status === 'pending_approval' || status === 'completed') return 'complete';
        return 'active';
    }
    return 'upcoming';
}

// ── Icon components ───────────────────────────────────────────────────────────

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
    );
}

function TruckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h10l2-2zM13 7h3l3 3v3h-6V7z" />
        </svg>
    );
}

function WrenchIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function StarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
    );
}

function StepIcon({ icon, state }: { icon: Step['icon']; state: 'complete' | 'active' | 'upcoming' }) {
    const iconClass = `w-5 h-5 ${state === 'upcoming' ? 'text-gray-600' : 'text-white'}`;
    if (state === 'complete' && icon === 'check') return <CheckIcon className={iconClass} />;
    if (state === 'complete') return <CheckIcon className={iconClass} />;
    switch (icon) {
        case 'truck':   return <TruckIcon className={iconClass} />;
        case 'wrench':  return <WrenchIcon className={iconClass} />;
        case 'star':    return <StarIcon className={iconClass} />;
        default:        return <CheckIcon className={iconClass} />;
    }
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TrackBookingPage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = (params.id as string).replace('%3A', ':');
    const lang = (params.lang as string) || 'en';

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchBooking = useCallback(async () => {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
            .from('bookings')
            .select('*, profiles:contractor_id(full_name)')
            .or(`id.eq.${bookingId},document_id.eq.${bookingId}`)
            .single();

        if (fetchError || !data) {
            setError(lang === 'es' ? 'Reserva no encontrada.' : 'Booking not found.');
        } else {
            setBooking(data as Booking);
        }
        setLoading(false);
    }, [bookingId, lang]);

    // Initial fetch + realtime subscription
    useEffect(() => {
        fetchBooking();

        const supabase = createClient();
        let channel: RealtimeChannel;

        // Resolve the numeric id first so we can filter correctly
        const numericId = Number(bookingId);
        if (!isNaN(numericId)) {
            channel = supabase
                .channel(`booking-track-${bookingId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'bookings',
                        filter: `id=eq.${numericId}`,
                    },
                    () => {
                        // Re-fetch to get the joined contractor profile too
                        fetchBooking();
                    },
                )
                .subscribe();
        }

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [bookingId, fetchBooking]);

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                    <p className="mt-4 text-gray-400 text-sm">
                        {lang === 'es' ? 'Cargando seguimiento...' : 'Loading tracking...'}
                    </p>
                </div>
            </div>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────
    if (error || !booking) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center max-w-md w-full">
                    <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2">
                        {lang === 'es' ? 'No Encontrado' : 'Not Found'}
                    </h2>
                    <p className="text-gray-400 text-sm mb-6">{error}</p>
                    <button
                        onClick={() => router.push(`/${lang}`)}
                        className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-500 transition-colors"
                    >
                        {lang === 'es' ? 'Volver al Inicio' : 'Return to Home'}
                    </button>
                </div>
            </div>
        );
    }

    const status = (booking.status ?? 'pending_assignment') as BookingStatus;
    const activeIdx = getActiveStepIndex(status);
    const contractorName = booking.profiles?.full_name ?? null;
    const showContractor = status !== 'pending_assignment' && contractorName;
    const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '';

    return (
        <div className="min-h-screen bg-gray-950 text-white pb-24">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="bg-gray-900 border-b border-gray-800 px-4 py-5">
                <div className="max-w-lg mx-auto">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                        {lang === 'es' ? 'Seguimiento de Reserva' : 'Booking Tracking'}
                    </p>
                    <h1 className="text-xl font-bold text-white truncate">
                        {booking.service_name ?? (lang === 'es' ? 'Servicio de Detallado' : 'Detail Service')}
                    </h1>
                    {booking.confirmation_code && (
                        <p className="text-sm text-gray-400 mt-1">
                            {lang === 'es' ? 'Código: ' : 'Code: '}
                            <span className="font-mono text-blue-400 font-semibold">
                                {booking.confirmation_code}
                            </span>
                        </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        {booking.date}
                        {booking.time_window ? ` · ${booking.time_window}` : ''}
                    </p>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
                {/* ── Timeline ────────────────────────────────────────────── */}
                <div className="relative">
                    {/* Vertical connector line */}
                    <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-800" aria-hidden="true" />

                    <ol className="space-y-0">
                        {STEPS.map((step, idx) => {
                            const state = getStepState(idx, activeIdx, status);
                            const isLast = idx === STEPS.length - 1;

                            return (
                                <li key={step.key} className={`relative flex items-start gap-4 ${isLast ? '' : 'pb-8'}`}>
                                    {/* Circle */}
                                    <div className="relative z-10 flex-shrink-0">
                                        {state === 'complete' && (
                                            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center ring-4 ring-gray-950">
                                                <StepIcon icon={step.icon} state="complete" />
                                            </div>
                                        )}
                                        {state === 'active' && (
                                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center ring-4 ring-gray-950 animate-pulse">
                                                <StepIcon icon={step.icon} state="active" />
                                            </div>
                                        )}
                                        {state === 'upcoming' && (
                                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center ring-4 ring-gray-950 border border-gray-700">
                                                <StepIcon icon={step.icon} state="upcoming" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Label */}
                                    <div className="pt-2 min-w-0">
                                        <p className={`text-sm font-semibold leading-tight ${
                                            state === 'complete' ? 'text-green-400' :
                                            state === 'active'   ? 'text-white' :
                                                                   'text-gray-600'
                                        }`}>
                                            {lang === 'es' ? step.labelEs : step.labelEn}
                                        </p>
                                        {state === 'active' && (
                                            <p className="text-xs text-blue-400 mt-0.5">
                                                {lang === 'es' ? 'En curso...' : 'In progress...'}
                                            </p>
                                        )}
                                        {state === 'complete' && (
                                            <p className="text-xs text-green-600 mt-0.5">
                                                {lang === 'es' ? 'Completado' : 'Done'}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </div>

                {/* ── Contractor card ──────────────────────────────────────── */}
                {showContractor && (
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                                {lang === 'es' ? 'Tu Técnico' : 'Your Technician'}
                            </p>
                            <p className="font-semibold text-white truncate">{contractorName}</p>
                            {/* Rating placeholder */}
                            <div className="flex items-center gap-1 mt-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <svg key={s} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                                <span className="text-xs text-gray-500 ml-1">5.0</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Booking info ─────────────────────────────────────────── */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-gray-300">
                        {lang === 'es' ? 'Detalles de la Reserva' : 'Booking Details'}
                    </h2>
                    {[
                        {
                            label: lang === 'es' ? 'Dirección' : 'Address',
                            value: [booking.address, booking.city, booking.state, booking.zip_code]
                                .filter(Boolean).join(', ') || '—',
                        },
                        {
                            label: lang === 'es' ? 'Total' : 'Total',
                            value: `$${Number(booking.total_amount).toFixed(2)}`,
                            highlight: true,
                        },
                    ].map(({ label, value, highlight }) => (
                        <div key={label} className="flex justify-between items-start gap-3 text-sm">
                            <span className="text-gray-500 flex-shrink-0">{label}</span>
                            <span className={`text-right font-medium ${highlight ? 'text-green-400' : 'text-white'}`}>
                                {value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ── Approve CTA (when pending_approval) ─────────────────── */}
                {status === 'pending_approval' && (
                    <button
                        onClick={() => router.push(`/${lang}/booking/${bookingId}/approve`)}
                        className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-500 transition-colors text-base"
                    >
                        {lang === 'es' ? 'Aprobar Servicio ✓' : 'Approve Service ✓'}
                    </button>
                )}
            </div>

            {/* ── Sticky support CTA ──────────────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur border-t border-gray-800 px-4 py-4">
                <div className="max-w-lg mx-auto">
                    {supportPhone ? (
                        <a
                            href={`tel:${supportPhone}`}
                            className="flex items-center justify-center gap-2 w-full bg-gray-800 text-white font-semibold py-3.5 rounded-xl hover:bg-gray-700 transition-colors border border-gray-700"
                        >
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {lang === 'es' ? '¿Necesitas Ayuda? Llama a Soporte' : 'Need Help? Call Support'}
                        </a>
                    ) : (
                        <p className="text-center text-gray-600 text-sm">
                            {lang === 'es' ? 'Soporte disponible durante el servicio.' : 'Support available during service.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
