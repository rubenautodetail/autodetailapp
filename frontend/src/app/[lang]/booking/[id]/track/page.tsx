'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/** Format raw time_window values for display. */
function formatTrackTimeWindow(raw: string, isEs: boolean): string {
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

interface CatalogItem {
    id: number;
    name: string;
    name_es: string | null;
    description: string | null;
    duration_minutes: number | null;
    price: number; // normalised — base_price for services, price for add-ons
    itemType: 'service' | 'addon';
}

// ── Step config ───────────────────────────────────────────────────────────────

type StepKey = 'reserved' | 'confirmed' | 'enRoute' | 'inProgress' | 'complete';

interface Step {
    key: StepKey;
    labelEn: string;
    labelEs: string;
    icon: 'check' | 'truck' | 'wrench' | 'star';
}

const STEPS: Step[] = [
    { key: 'reserved',    labelEn: 'Booked',               labelEs: 'Reservado',             icon: 'check'  },
    { key: 'confirmed',   labelEn: 'Confirmed',            labelEs: 'Confirmado',            icon: 'check'  },
    { key: 'enRoute',     labelEn: 'On The Way',           labelEs: 'En Camino',             icon: 'truck'  },
    { key: 'inProgress',  labelEn: 'In Progress',          labelEs: 'En Progreso',           icon: 'wrench' },
    { key: 'complete',    labelEn: 'Completed',            labelEs: 'Completado',            icon: 'star'   },
];

const ACTIVE_STATUSES: BookingStatus[] = ['confirmed', 'en_route', 'in_progress'];

/**
 * Maps booking status to the 0-based step index that is currently active.
 * Steps: 0=reserved, 1=confirmed, 2=enRoute, 3=inProgress, 4=complete
 */
function getActiveStepIndex(status: BookingStatus): number {
    switch (status) {
        case 'pending_assignment': return 0;
        case 'confirmed':          return 1;
        case 'en_route':           return 2;
        case 'in_progress':        return 3;
        case 'pending_approval':   return 4;
        case 'completed':          return 4;
        default:                   return 0;
    }
}

function getStepState(
    stepIdx: number,
    activeIdx: number,
    status: BookingStatus,
): 'complete' | 'active' | 'upcoming' {
    if (stepIdx < activeIdx) return 'complete';
    if (stepIdx === activeIdx) {
        // All steps lit when fully completed or pending_approval (work is done)
        if (status === 'completed') return 'complete';
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

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}

function StepIcon({ icon, state }: { icon: Step['icon']; state: 'complete' | 'active' | 'upcoming' }) {
    const iconClass = `w-5 h-5 ${state === 'upcoming' ? 'text-gray-600' : 'text-gray-950'}`;
    if (state === 'complete') return <CheckIcon className={iconClass} />;
    switch (icon) {
        case 'truck':  return <TruckIcon className={iconClass} />;
        case 'wrench': return <WrenchIcon className={iconClass} />;
        case 'star':   return <StarIcon className={iconClass} />;
        default:       return <CheckIcon className={iconClass} />;
    }
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TrackBookingPage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = (params.id as string).replace('%3A', ':');
    const lang = (params.lang as string) || 'en';
    const isEs = lang === 'es';

    const [booking, setBooking]     = useState<Booking | null>(null);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');

    // Add-service state
    const [catalog, setCatalog]                 = useState<{ services: CatalogItem[]; addOns: CatalogItem[] } | null>(null);
    const [showAddService, setShowAddService]   = useState(false);
    const [catalogTab, setCatalogTab]           = useState<'services' | 'addons'>('addons');
    const [selectedItems, setSelectedItems]     = useState<CatalogItem[]>([]);
    const [addLoading, setAddLoading]           = useState(false);
    const [addSuccess, setAddSuccess]           = useState(false);
    const [addError, setAddError]               = useState('');

    const fetchBooking = useCallback(async () => {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
            .from('bookings')
            .select('*, profiles:contractor_id(full_name)')
            .eq('id', bookingId)
            .single();

        if (fetchError || !data) {
            console.error('Track fetch error:', fetchError);
            setError(isEs ? 'Reserva no encontrada.' : 'Booking not found.');
        } else {
            setBooking(data as Booking);
        }
        setLoading(false);
    }, [bookingId, isEs]);

    // Fetch catalog when booking is active
    const fetchCatalog = useCallback(async () => {
        try {
            const res = await fetch('/api/services/available');
            if (!res.ok) return;
            const json = await res.json();
            setCatalog({
                services: (json.services ?? []).map((s: Record<string, unknown>) => ({
                    id: s.id,
                    name: s.name,
                    name_es: s.name_es ?? null,
                    description: s.description ?? null,
                    duration_minutes: s.duration_minutes ?? null,
                    price: Number(s.base_price),
                    itemType: 'service' as const,
                })),
                addOns: (json.addOns ?? []).map((a: Record<string, unknown>) => ({
                    id: a.id,
                    name: a.name,
                    name_es: a.name_es ?? null,
                    description: a.description ?? null,
                    duration_minutes: a.duration_minutes ?? null,
                    price: Number(a.price),
                    itemType: 'addon' as const,
                })),
            });
        } catch {
            // Non-fatal — catalog just won't show
        }
    }, []);

    useEffect(() => {
        fetchBooking();

        const supabase = createClient();
        let channel: RealtimeChannel;

        const numericId = Number(bookingId);
        if (!isNaN(numericId)) {
            channel = supabase
                .channel(`booking-track-${bookingId}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${numericId}` },
                    () => { fetchBooking(); },
                )
                .subscribe();
        }

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [bookingId, fetchBooking]);

    // Load catalog once booking status is known and active
    useEffect(() => {
        if (!booking) return;
        if (ACTIVE_STATUSES.includes(booking.status as BookingStatus)) {
            fetchCatalog();
        }
    }, [booking?.status, fetchCatalog]);

    const toggleItem = (item: CatalogItem) => {
        setSelectedItems((prev) => {
            const exists = prev.some((s) => s.id === item.id && s.itemType === item.itemType);
            return exists
                ? prev.filter((s) => !(s.id === item.id && s.itemType === item.itemType))
                : [...prev, item];
        });
    };

    const closeModal = () => {
        setShowAddService(false);
        setSelectedItems([]);
        setAddError('');
    };

    const handleAddService = async () => {
        if (!booking || selectedItems.length === 0) return;
        setAddLoading(true);
        setAddError('');
        try {
            const res = await fetch('/api/booking/add-service', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId,
                    confirmationCode: booking.confirmation_code,
                    items: selectedItems.map((i) => ({
                        id: i.id,
                        type: i.itemType,
                        name: i.name,
                        name_es: i.name_es,
                        price: i.price,
                    })),
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to add services');
            closeModal();
            setAddSuccess(true);
            await fetchBooking();
        } catch (err) {
            setAddError((err as Error).message);
        } finally {
            setAddLoading(false);
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                    <p className="mt-4 text-gray-400 text-sm">
                        {isEs ? 'Cargando seguimiento...' : 'Loading tracking...'}
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
                        {isEs ? 'No Encontrado' : 'Not Found'}
                    </h2>
                    <p className="text-gray-400 text-sm mb-6">{error}</p>
                    <button
                        onClick={() => router.push(`/${lang}`)}
                        className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-500 transition-colors"
                    >
                        {isEs ? 'Volver al Inicio' : 'Return to Home'}
                    </button>
                </div>
            </div>
        );
    }

    const status = (booking.status ?? 'pending_assignment') as BookingStatus;

    // ── Cancelled — show a clear end-state, no timeline ──────────────────────
    if (status === 'cancelled') {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
                <div className="bg-gray-900 rounded-2xl border border-red-500/20 p-8 text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <p className="text-xs text-red-400 font-semibold uppercase tracking-widest mb-2">
                        {isEs ? 'Cancelada' : 'Cancelled'}
                    </p>
                    <h2 className="text-xl font-bold text-white mb-1">
                        {booking.service_name ?? (isEs ? 'Servicio' : 'Service')}
                    </h2>
                    {booking.confirmation_code && (
                        <p className="text-sm text-gray-500 font-mono mb-6">{booking.confirmation_code}</p>
                    )}
                    <p className="text-gray-400 text-sm mb-8">
                        {isEs
                            ? 'Esta reserva fue cancelada. Puedes hacer una nueva reserva cuando quieras.'
                            : 'This booking was cancelled. You can place a new booking whenever you\'re ready.'}
                    </p>
                    <button
                        onClick={() => router.push(`/${lang}/booking/select`)}
                        className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-500 transition-colors"
                    >
                        {isEs ? 'Reservar de nuevo' : 'Book Again'}
                    </button>
                    <button
                        onClick={() => router.push(`/${lang}/customer`)}
                        className="mt-3 w-full text-gray-400 text-sm hover:text-white transition-colors py-2"
                    >
                        {isEs ? 'Ir al inicio' : 'Go to Dashboard'}
                    </button>
                </div>
            </div>
        );
    }

    const [approving, setApproving] = useState(false);
    const [approveError, setApproveError] = useState('');

    const handleApprove = async () => {
        if (!booking) return;
        setApproving(true);
        setApproveError('');
        try {
            const res = await fetch('/api/booking/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: String(booking.id),
                    confirmationCode: booking.confirmation_code,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Approval failed');
            await fetchBooking();
        } catch (err) {
            setApproveError((err as Error).message);
        } finally {
            setApproving(false);
        }
    };

    const activeIdx = getActiveStepIndex(status);
    const contractorName = booking.profiles?.full_name ?? null;
    const showContractor = status !== 'pending_assignment' && contractorName;
    const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '';
    const canAddServices = ACTIVE_STATUSES.includes(status) && catalog !== null;
    const selectedTotal = selectedItems.reduce((s, i) => s + i.price, 0);

    return (
        <div className="min-h-screen bg-gray-950 text-white pb-24">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="bg-gray-900 border-b border-gray-800 px-4 py-5">
                <div className="max-w-lg mx-auto">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                        {isEs ? 'Seguimiento de Reserva' : 'Booking Tracking'}
                    </p>
                    <h1 className="text-xl font-bold text-white truncate">
                        {booking.service_name ?? (isEs ? 'Servicio de Detallado' : 'Detail Service')}
                    </h1>
                    {booking.confirmation_code && (
                        <p className="text-sm text-gray-400 mt-1">
                            {isEs ? 'Codigo: ' : 'Code: '}
                            <span className="font-mono text-yellow-400 font-semibold">
                                {booking.confirmation_code}
                            </span>
                        </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        {booking.date}
                        {booking.time_window ? ` · ${formatTrackTimeWindow(booking.time_window, isEs)}` : ''}
                    </p>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
                {/* ── Timeline ────────────────────────────────────────────── */}
                <div className="relative">
                    <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-800" aria-hidden="true" />
                    <ol className="space-y-0">
                        {STEPS.map((step, idx) => {
                            const state = getStepState(idx, activeIdx, status);
                            const isLast = idx === STEPS.length - 1;
                            return (
                                <li key={step.key} className={`relative flex items-start gap-4 ${isLast ? '' : 'pb-8'}`}>
                                    <div className="relative z-10 flex-shrink-0">
                                        {state === 'complete' && (
                                            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center ring-4 ring-gray-950">
                                                <StepIcon icon={step.icon} state="complete" />
                                            </div>
                                        )}
                                        {state === 'active' && (
                                            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center ring-4 ring-gray-950 shadow-[0_0_12px_rgba(250,204,21,0.5)] animate-pulse">
                                                <StepIcon icon={step.icon} state="active" />
                                            </div>
                                        )}
                                        {state === 'upcoming' && (
                                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center ring-4 ring-gray-950 border border-gray-700">
                                                <StepIcon icon={step.icon} state="upcoming" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-2 min-w-0">
                                        <p className={`text-sm font-semibold leading-tight ${
                                            state === 'complete' ? 'text-yellow-400' :
                                            state === 'active'   ? 'text-white' :
                                                                   'text-gray-600'
                                        }`}>
                                            {isEs ? step.labelEs : step.labelEn}
                                        </p>
                                        {state === 'active' && (
                                            <p className="text-xs text-yellow-500 mt-0.5">
                                                {isEs ? 'En curso...' : 'In progress...'}
                                            </p>
                                        )}
                                        {state === 'complete' && (
                                            <p className="text-xs text-yellow-600 mt-0.5">
                                                {isEs ? 'Completado' : 'Done'}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </div>

                {/* ── Contextual Status Content ───────────────────────────── */}
                {(status === 'pending_assignment' || status === 'confirmed') && (
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-400/15 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">
                                    {isEs ? 'Tu tecnico esta programado' : 'Your technician is scheduled'}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {contractorName
                                        ? (isEs
                                            ? `${contractorName} llegara en la fecha programada.`
                                            : `${contractorName} will arrive on the scheduled date.`)
                                        : (isEs
                                            ? 'Un tecnico sera asignado pronto.'
                                            : 'A technician will be assigned shortly.')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'en_route' && (
                    <div className="bg-gray-900 rounded-2xl border border-yellow-500/30 p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-400/15 flex items-center justify-center flex-shrink-0 animate-pulse">
                                <TruckIcon className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">
                                    {isEs ? 'Tu tecnico va en camino' : 'Your technician is on the way'}
                                </p>
                                {contractorName && (
                                    <p className="text-xs text-yellow-500 mt-0.5">
                                        {contractorName}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {status === 'in_progress' && (
                    <div className="bg-gray-900 rounded-2xl border border-yellow-500/30 p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-400/15 flex items-center justify-center flex-shrink-0">
                                <WrenchIcon className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">
                                    {isEs ? 'Trabajo en progreso' : 'Work in progress'}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {isEs
                                        ? 'Tu vehiculo esta siendo atendido. Te notificaremos cuando termine.'
                                        : 'Your vehicle is being serviced. We will notify you when it is done.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'pending_approval' && (
                    <div className="bg-gray-900 rounded-2xl border border-green-500/30 p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                                <CheckIcon className="w-5 h-5 text-green-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">
                                    {isEs ? 'Trabajo terminado — aprueba tu servicio' : 'Work finished — approve your service'}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {isEs
                                        ? 'Revisa el trabajo y aprueba para completar el pago.'
                                        : 'Review the work and approve to finalize payment.'}
                                </p>
                            </div>
                        </div>
                        {approveError && (
                            <p className="text-red-400 text-xs">{approveError}</p>
                        )}
                        <button
                            onClick={handleApprove}
                            disabled={approving}
                            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-500 transition-colors text-base disabled:opacity-60"
                        >
                            {approving
                                ? (isEs ? 'Aprobando...' : 'Approving...')
                                : (isEs ? 'Aprobar Trabajo' : 'Approve Job')}
                        </button>
                    </div>
                )}

                {status === 'completed' && (
                    <div className="bg-gray-900 rounded-2xl border border-yellow-400/30 p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-400/15 flex items-center justify-center flex-shrink-0">
                                <StarIcon className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">
                                    {isEs ? 'Servicio completado' : 'Service completed'}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {isEs
                                        ? 'Gracias por tu confianza. Total cobrado:'
                                        : 'Thank you for your business. Total charged:'}
                                    {' '}
                                    <span className="text-green-400 font-semibold">
                                        ${(Number(booking.total_amount) || 0).toFixed(2)}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

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
                                {isEs ? 'Tu Técnico' : 'Your Technician'}
                            </p>
                            <p className="font-semibold text-white truncate">{contractorName}</p>
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
                        {isEs ? 'Detalles de la Reserva' : 'Booking Details'}
                    </h2>
                    {[
                        {
                            label: isEs ? 'Dirección' : 'Address',
                            value: [booking.address, booking.city, booking.state, booking.zip_code]
                                .filter(Boolean).join(', ') || '—',
                        },
                        {
                            label: isEs ? 'Total' : 'Total',
                            value: `$${(Number(booking.total_amount) || 0).toFixed(2)}`,
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

                {/* ── Add Service / Add-on ─────────────────────────────────── */}
                {canAddServices && (
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-9 h-9 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <PlusIcon className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">
                                    {isEs ? 'Añadir Servicios' : 'Add to Your Service'}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {isEs
                                        ? 'Agrega servicios o complementos mientras trabajamos en tu auto.'
                                        : 'Request extra services or add-ons while we work on your car.'}
                                </p>
                            </div>
                        </div>

                        {addSuccess ? (
                            <div className="flex items-center gap-2 text-green-400 text-sm py-1">
                                <CheckIcon className="w-4 h-4 flex-shrink-0" />
                                <span>
                                    {isEs
                                        ? '¡Servicios agregados! Tu técnico fue notificado.'
                                        : 'Services added! Your technician was notified.'}
                                </span>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAddService(true)}
                                className="w-full py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <PlusIcon className="w-4 h-4" />
                                {isEs ? 'Agregar Servicio / Complemento' : 'Add Service / Add-on'}
                            </button>
                        )}
                    </div>
                )}

                {/* Approve CTA is now rendered inline in the contextual status content above */}
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
                            {isEs ? '¿Necesitas Ayuda? Llama a Soporte' : 'Need Help? Call Support'}
                        </a>
                    ) : (
                        <p className="text-center text-gray-600 text-sm">
                            {isEs ? 'Soporte disponible durante el servicio.' : 'Support available during service.'}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Add Service Modal ────────────────────────────────────────── */}
            {showAddService && catalog && (
                <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-gray-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl border border-gray-800 max-h-[85vh] flex flex-col">

                        {/* Modal header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
                            <h3 className="font-semibold text-white">
                                {isEs ? 'Agregar a Tu Servicio' : 'Add to Your Service'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-800 px-5 flex-shrink-0">
                            {(['addons', 'services'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setCatalogTab(t)}
                                    className={`py-3 text-sm font-medium mr-6 border-b-2 transition-colors ${
                                        catalogTab === t
                                            ? 'border-blue-500 text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    {t === 'services'
                                        ? (isEs ? 'Servicios' : 'Services')
                                        : (isEs ? 'Complementos' : 'Add-ons')}
                                </button>
                            ))}
                        </div>

                        {/* Items list */}
                        <div className="overflow-y-auto flex-1 p-5 space-y-3">
                            {(catalogTab === 'services' ? catalog.services : catalog.addOns).length === 0 ? (
                                <p className="text-center text-gray-600 text-sm py-8">
                                    {isEs ? 'No hay opciones disponibles.' : 'No options available.'}
                                </p>
                            ) : (
                                (catalogTab === 'services' ? catalog.services : catalog.addOns).map((item) => {
                                    const displayName = (isEs && item.name_es) ? item.name_es : item.name;
                                    const isSelected = selectedItems.some(
                                        (s) => s.id === item.id && s.itemType === item.itemType,
                                    );
                                    return (
                                        <button
                                            key={`${item.itemType}-${item.id}`}
                                            onClick={() => toggleItem(item)}
                                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-500/10'
                                                    : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-white">{displayName}</p>
                                                    {item.duration_minutes && (
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {item.duration_minutes} min
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <span className="text-sm font-semibold text-green-400">
                                                        +${(Number(item.price) || 0).toFixed(2)}
                                                    </span>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                        isSelected
                                                            ? 'border-blue-500 bg-blue-500'
                                                            : 'border-gray-600'
                                                    }`}>
                                                        {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer — shown when items are selected */}
                        {selectedItems.length > 0 && (
                            <div className="border-t border-gray-800 px-5 py-4 flex-shrink-0">
                                {addError && (
                                    <p className="text-red-400 text-xs mb-3">{addError}</p>
                                )}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-gray-400">
                                        {selectedItems.length}{' '}
                                        {isEs ? 'seleccionado(s)' : `item${selectedItems.length > 1 ? 's' : ''} selected`}
                                    </span>
                                    <span className="text-lg font-bold text-white">
                                        +${(Number(selectedTotal) || 0).toFixed(2)}
                                    </span>
                                </div>
                                <button
                                    onClick={handleAddService}
                                    disabled={addLoading}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-500 transition-colors disabled:opacity-60"
                                >
                                    {addLoading
                                        ? (isEs ? 'Procesando...' : 'Processing...')
                                        : (isEs ? 'Confirmar y Agregar' : 'Confirm & Add')}
                                </button>
                                <p className="text-xs text-gray-600 text-center mt-2">
                                    {isEs
                                        ? 'El monto adicional se cobrará al aprobar el servicio.'
                                        : 'Additional amount will be collected when you approve the service.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
