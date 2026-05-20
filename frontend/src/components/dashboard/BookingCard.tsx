"use client";

import React, { useState, useCallback } from 'react';
import { fmtDate, hoursFromNow } from '@/lib/dateUtils';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Clock, ShieldCheck, ChevronRight, CheckCircle, Truck, Wrench, XCircle, CreditCard, Star, AlertTriangle, CalendarClock, Info, ChevronDown } from 'lucide-react';
import { BookingStatus } from './StatusTimeline';

interface BookingCardProps {
    id: string;
    confirmationCode?: string;
    serviceName: string;
    date: string;
    time: string;
    status: BookingStatus;
    price: number;
    providerName?: string;
    index?: number;
    onRefresh?: () => void;
}

/** Format time_window for display — legacy words get translated, HH:MM gets 12h format */
function formatTimeWindow(raw: string, isEs: boolean): string {
    const map: Record<string, { en: string; es: string }> = {
        morning:   { en: 'Morning',   es: 'Mañana' },
        afternoon: { en: 'Afternoon', es: 'Tarde' },
        evening:   { en: 'Evening',   es: 'Noche' },
    };
    const hit = map[raw.toLowerCase().trim()];
    if (hit) return isEs ? hit.es : hit.en;
    const m = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (m) {
        const h = parseInt(m[1], 10);
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${h12}:${m[2]} ${period}`;
    }
    return raw;
}

const statusConfig: Record<string, {
    color: string;
    bg: string;
    icon: React.ComponentType<{ className?: string }>;
    en: string;
    es: string;
}> = {
    pending_payment: { color: 'text-amber-400', bg: 'bg-amber-400/10', icon: CreditCard, en: 'Payment Pending', es: 'Pago Pendiente' },
    pending: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Clock, en: 'Requested', es: 'Solicitado' },
    pending_assignment: { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: Clock, en: 'Finding Detailer', es: 'Buscando Técnico' },
    confirmed: { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: CheckCircle, en: 'Confirmed', es: 'Confirmado' },
    en_route: { color: 'text-indigo-500', bg: 'bg-indigo-500/10', icon: Truck, en: 'En Route', es: 'En Camino' },
    working: { color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Wrench, en: 'In Progress', es: 'En Progreso' },
    in_progress: { color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Wrench, en: 'In Progress', es: 'En Progreso' },
    pending_approval: { color: 'text-amber-400', bg: 'bg-amber-400/10', icon: ShieldCheck, en: 'Awaiting Approval', es: 'Esperando Aprobación' },
    completed: { color: 'text-green-500', bg: 'bg-green-500/10', icon: ShieldCheck, en: 'Completed', es: 'Completado' },
    cancelled: { color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle, en: 'Cancelled', es: 'Cancelado' },
};

export function BookingCardSkeleton() {
    return (
        <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
            <div className="p-6">
                {/* Header row */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-white/5" />
                        <div className="space-y-2">
                            <div className="h-2.5 w-16 bg-white/5 rounded" />
                            <div className="h-5 w-36 bg-white/10 rounded" />
                        </div>
                    </div>
                    <div className="h-7 w-16 bg-white/10 rounded" />
                </div>
                {/* Detail rows */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-white/5" />
                        <div className="h-3 w-40 bg-white/5 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-white/5" />
                        <div className="h-3 w-24 bg-white/5 rounded" />
                    </div>
                </div>
                {/* Footer */}
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <div className="h-3 w-20 bg-white/5 rounded" />
                    <div className="h-8 w-28 bg-white/10 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export function BookingCard({
    id,
    confirmationCode,
    serviceName,
    date,
    time,
    status,
    price,
    providerName,
    index = 0,
    onRefresh,
}: BookingCardProps) {
    const params = useParams();
    const lang = (params?.lang as string) || 'en';
    const isEs = lang === 'es';
    const config = statusConfig[status] || statusConfig.pending;
    const StatusIcon = config.icon;

    const [cancelStep, setCancelStep] = useState<null | 'recommend' | 'confirm'>(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState('');
    const [showPolicy, setShowPolicy] = useState(false);

    // Safe price: guard against NaN/undefined so .toFixed() never crashes
    const safePrice = Number.isFinite(price) ? price : 0;

    const hoursUntil = hoursFromNow(date, time);
    const within4h = hoursUntil < 4;
    const within2h = hoursUntil < 2;
    const isPast = hoursUntil < 0;

    const displayTime = formatTimeWindow(time, isEs);

    const handleCancel = useCallback(async () => {
        setCancelling(true);
        setCancelError('');
        try {
            const res = await fetch('/api/booking/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: id }),
            });
            const data: { error?: string; success?: boolean } = await res.json();
            if (!res.ok) {
                setCancelError(data.error || (isEs ? 'Error al cancelar' : 'Failed to cancel'));
            } else {
                setCancelStep(null);
                onRefresh?.();
            }
        } catch {
            setCancelError(isEs ? 'Error de conexión' : 'Network error');
        } finally {
            setCancelling(false);
        }
    }, [id, isEs, onRefresh]);

    // Statuses where cancel/reschedule are available
    const canCancel = ['pending_payment', 'pending', 'pending_assignment', 'confirmed'].includes(status) && !isPast;
    const canReschedule = ['pending', 'pending_assignment', 'confirmed'].includes(status) && !within2h && !isPast;
    // Late cancellation (<4h) incurs 25% penalty, but is always allowed
    const hasLatePenalty = status !== 'pending_payment' && status !== 'pending' && within4h && !isPast;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="glass-card rounded-2xl overflow-hidden group hover:border-accent-gold/30 transition-all duration-300"
        >
            {isPast && !['completed', 'cancelled'].includes(status) && (
                <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                        {isEs ? 'Fecha pasada' : 'Past Due'}
                    </span>
                </div>
            )}
            {status === 'completed' && (
                <div className="bg-accent-gold/10 border-b border-accent-gold/20 px-6 py-2 flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-accent-gold fill-current" />
                    <span className="text-xs font-bold text-accent-gold uppercase tracking-wider">
                        {isEs ? 'Calificación Pendiente' : 'Review Pending'}
                    </span>
                </div>
            )}
            <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start gap-3 mb-4">
                    <div className="flex items-center space-x-3 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${config.bg}`}>
                            <StatusIcon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div className="min-w-0">
                            <span className={`text-xs font-medium uppercase tracking-wider ${config.color}`}>
                                {isEs ? config.es : config.en}
                            </span>
                            <h3 className="text-base sm:text-xl font-bold text-white mt-1 group-hover:text-accent-gold transition-colors truncate">
                                {serviceName || (isEs ? 'Servicio de Detallado' : 'Auto Detail')}
                            </h3>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <span className="text-lg sm:text-2xl font-bold text-accent-gold">${safePrice.toFixed(2)}</span>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center text-text-secondary text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-text-muted" />
                        {fmtDate(date, lang, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="flex items-center text-text-secondary text-sm">
                        <Clock className="w-4 h-4 mr-2 text-text-muted" />
                        {displayTime}
                    </div>
                    {providerName && (
                        <div className="flex items-center text-text-secondary text-sm">
                            <ShieldCheck className="w-4 h-4 mr-2 text-text-muted" />
                            {isEs ? 'Detallador:' : 'Detailer:'} <span className="text-white ml-1">{providerName}</span>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-text-muted font-mono">
                            {confirmationCode ?? `#${id.slice(0, 8)}`}
                        </span>
                        {status === 'pending_payment' ? (
                            <Link
                                href={`/${lang}/booking/${id}/pay`}
                                className="flex items-center gap-1.5 text-sm font-bold text-amber-400 hover:text-white bg-amber-400/10 hover:bg-amber-400/20 px-3 py-1.5 rounded-lg transition-all group/link"
                            >
                                <CreditCard className="w-4 h-4" />
                                {isEs ? 'Completar Pago' : 'Complete Payment'}
                                <ChevronRight className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        ) : status === 'pending_approval' ? (
                            <Link
                                href={`/${lang}/booking/${id}/approve${confirmationCode ? `?code=${confirmationCode}` : ''}`}
                                className="flex items-center gap-1.5 text-sm font-bold text-amber-400 hover:text-white bg-amber-400/10 hover:bg-amber-400/20 px-3 py-1.5 rounded-lg transition-all group/link"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                {isEs ? 'Aprobar Trabajo' : 'Approve & Pay'}
                                <ChevronRight className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        ) : status === 'completed' ? (
                            <div className="flex items-center gap-3">
                                <Link
                                    href={`/${lang}/booking/${id}/review`}
                                    className="text-xs text-text-secondary hover:text-accent-gold transition-colors"
                                >
                                    {isEs ? 'Calificar' : 'Rate'}
                                </Link>
                                <Link
                                    href={`/${lang}/booking/select?service=${encodeURIComponent(serviceName)}`}
                                    className="flex items-center gap-1.5 text-sm font-bold text-accent-gold hover:text-white bg-accent-gold/10 hover:bg-accent-gold/20 px-3 py-1.5 rounded-lg transition-all group/link"
                                >
                                    {isEs ? 'Reservar de nuevo' : 'Book Again'}
                                    <ChevronRight className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        ) : status === 'cancelled' ? null : (
                            <Link
                                href={`/${lang}/booking/${id}/track`}
                                className="flex items-center text-sm font-semibold text-white hover:text-accent-gold transition-colors group/link"
                            >
                                {isEs ? 'Ver Estado' : 'Track Status'}
                                <ChevronRight className="w-4 h-4 ml-1 transform group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        )}
                    </div>

                    {/* Cancel / Reschedule actions */}
                    {canCancel && !['cancelled', 'completed'].includes(status) && (
                        <div className="space-y-2">
                            {/* Policy info toggle */}
                            {!cancelStep && (
                                <>
                                    <button
                                        onClick={() => setShowPolicy(!showPolicy)}
                                        className="flex items-center gap-1.5 text-xs text-[#A5B0D1]/70 hover:text-[#A5B0D1] transition-colors"
                                    >
                                        <Info className="w-3.5 h-3.5" />
                                        {isEs ? 'Políticas de cancelación y reprogramación' : 'Cancellation & reschedule policy'}
                                        <ChevronDown className={`w-3 h-3 transition-transform ${showPolicy ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showPolicy && (
                                        <div className="bg-[#1A2142] border border-[#2C355E] rounded-xl p-3 space-y-2 text-xs text-[#A5B0D1]/80">
                                            <div className="flex items-start gap-2">
                                                <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                                <p>
                                                    {isEs
                                                        ? 'Cancelación gratuita hasta 4 horas antes de la cita. Cancelaciones con menos de 4 horas incurren un cargo del 25% del servicio.'
                                                        : 'Free cancellation up to 4 hours before your appointment. Cancellations within 4 hours incur a 25% service fee.'}
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <CalendarClock className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                                                <p>
                                                    {isEs
                                                        ? 'Reprogramación gratuita hasta 2 horas antes de la cita. No se permite reprogramar con menos de 2 horas de anticipación.'
                                                        : 'Free rescheduling up to 2 hours before your appointment. Rescheduling is not available less than 2 hours before.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        {canReschedule && (
                                            <Link
                                                href={`/${lang}/booking/${id}/reschedule`}
                                                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#A5B0D1] hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2.5 min-h-[44px] rounded-lg transition-all"
                                            >
                                                <CalendarClock className="w-3.5 h-3.5" />
                                                {isEs ? 'Reprogramar' : 'Reschedule'}
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => setCancelStep(canReschedule ? 'recommend' : 'confirm')}
                                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 px-3 py-2.5 min-h-[44px] rounded-lg transition-all"
                                        >
                                            <XCircle className="w-3.5 h-3.5" />
                                            {isEs ? 'Cancelar Servicio' : 'Cancel Service'}
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Step 1: Recommend rescheduling instead */}
                            {cancelStep === 'recommend' && (
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <CalendarClock className="w-5 h-5 text-blue-400" />
                                        <p className="text-sm font-bold text-blue-300">
                                            {isEs ? '¿Prefieres reprogramar?' : 'Would you rather reschedule?'}
                                        </p>
                                    </div>
                                    <p className="text-xs text-blue-200/80 leading-relaxed">
                                        {isEs
                                            ? hasLatePenalty
                                                ? `Reprogramar es gratis y no pierdes tu dinero. Cancelar aplicará un cargo del 25% ($${(safePrice * 0.25).toFixed(2)}).`
                                                : 'Reprogramar es gratis y mantienes tu lugar. Si cancelas, tendrás que reservar de nuevo.'
                                            : hasLatePenalty
                                                ? `Rescheduling is free and you keep your money. Cancelling will cost you a 25% fee ($${(safePrice * 0.25).toFixed(2)}).`
                                                : 'Rescheduling is free and you keep your spot. If you cancel, you\'ll need to book again.'}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Link
                                            href={`/${lang}/booking/${id}/reschedule`}
                                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 py-2.5 px-3 min-h-[44px] rounded-lg transition-all"
                                        >
                                            <CalendarClock className="w-3.5 h-3.5" />
                                            {isEs ? 'Sí, reprogramar' : 'Yes, reschedule'}
                                        </Link>
                                        <button
                                            onClick={() => setCancelStep('confirm')}
                                            className="flex-1 text-xs font-semibold text-red-400 hover:text-red-300 bg-white/5 hover:bg-white/10 py-2.5 px-3 min-h-[44px] rounded-lg transition-all"
                                        >
                                            {isEs ? 'No, quiero cancelar' : 'No, I want to cancel'}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => { setCancelStep(null); setCancelError(''); }}
                                        className="w-full text-xs text-[#A5B0D1]/60 hover:text-[#A5B0D1] transition-colors"
                                    >
                                        {isEs ? 'Volver' : 'Go back'}
                                    </button>
                                </div>
                            )}

                            {/* Step 2: Final cancellation confirmation */}
                            {cancelStep === 'confirm' && (
                                <div className={`${hasLatePenalty ? 'bg-red-500/15 border-red-500/30' : 'bg-red-500/10 border-red-500/20'} border rounded-xl p-3 space-y-2`}>
                                    {hasLatePenalty ? (
                                        <>
                                            <div className="flex items-center gap-1.5">
                                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                                <p className="text-xs font-bold text-red-300">
                                                    {isEs ? 'Penalidad del 25%' : '25% penalty applies'}
                                                </p>
                                            </div>
                                            <p className="text-xs text-red-300/90">
                                                {isEs
                                                    ? `Se te cobrará $${(safePrice * 0.25).toFixed(2)} (25% de $${safePrice.toFixed(2)}) por cancelar con menos de 4 horas de anticipación. Se reembolsará el 75% restante.`
                                                    : `You will be charged $${(safePrice * 0.25).toFixed(2)} (25% of $${safePrice.toFixed(2)}) for cancelling less than 4 hours before your appointment. The remaining 75% will be refunded.`}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-red-300 font-medium">
                                            {isEs
                                                ? '¿Seguro que deseas cancelar? El horario quedará disponible y recibirás un reembolso completo.'
                                                : 'Are you sure? The time slot will be released and you will receive a full refund.'}
                                        </p>
                                    )}
                                    {cancelError && (
                                        <p className="text-xs text-red-400">{cancelError}</p>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setCancelStep(null); setCancelError(''); }}
                                            className="flex-1 text-xs font-semibold text-[#A5B0D1] bg-white/5 hover:bg-white/10 py-2.5 px-3 min-h-[44px] rounded-lg transition-all whitespace-nowrap"
                                        >
                                            {isEs ? 'No, volver' : 'No, go back'}
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            disabled={cancelling}
                                            className="flex-1 text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 py-2.5 px-3 min-h-[44px] rounded-lg transition-all whitespace-nowrap min-w-0"
                                        >
                                            {cancelling
                                                ? (isEs ? 'Cancelando…' : 'Cancelling…')
                                                : (isEs
                                                    ? (hasLatePenalty ? 'Sí, cancelar (25%)' : 'Sí, cancelar')
                                                    : (hasLatePenalty ? 'Yes, cancel (25%)' : 'Yes, cancel'))}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
