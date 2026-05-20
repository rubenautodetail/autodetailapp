"use client";

import React, { useState } from 'react';
import { useBookingStatus } from '@/contexts/BookingStatusContext';
import { hoursFromNow } from '@/lib/dateUtils';
import { BookingCard, BookingCardSkeleton } from '@/components/dashboard/BookingCard';
import { NotificationToast } from '@/components/dashboard/NotificationToast';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { motion } from 'framer-motion';
import { Plus, Car, Settings, CalendarDays, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const ACTIVE_STATUSES = new Set(['pending_payment', 'pending', 'pending_assignment', 'confirmed', 'en_route', 'working']);

/** Format a time_window value for display with locale support */
function formatTimeWindow(tw: string, locale: string): string {
    const isEs = locale === 'es';
    const legacy: Record<string, { en: string; es: string }> = {
        morning:   { en: 'Morning',   es: 'Mañana' },
        afternoon: { en: 'Afternoon', es: 'Tarde' },
        evening:   { en: 'Evening',   es: 'Noche' },
    };
    const key = tw.toLowerCase().trim();
    if (legacy[key]) return isEs ? legacy[key].es : legacy[key].en;
    const match = key.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
        const h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const d = new Date(2000, 0, 1, h, m);
        return d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
    }
    return tw;
}

export default function CustomerDashboardPage() {
    const params = useParams();
    const lang = (params?.lang as string) || 'en';
    const isEs = lang === 'es';
    const { bookings, notifications, dismissNotification, userProfile, isLoading, updateBookingStatus, addNotification } = useBookingStatus();
    const [tab, setTab] = useState<'active' | 'history'>('active');
    const [showAllHistory, setShowAllHistory] = useState(false);

    const sorted = [...bookings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const activeBookings = sorted.filter(b => ACTIVE_STATUSES.has(b.status));
    const historyBookings = sorted.filter(b => !ACTIVE_STATUSES.has(b.status));
    // Non-cancelled first, then cancelled — both by date desc
    const sortedHistory = [
        ...historyBookings.filter(b => b.status !== 'cancelled'),
        ...historyBookings.filter(b => b.status === 'cancelled'),
    ];
    const HISTORY_PREVIEW = 4;
    const visibleHistory = showAllHistory ? sortedHistory : sortedHistory.slice(0, HISTORY_PREVIEW);

    const RESCHEDULE_ELIGIBLE = new Set(['pending', 'pending_assignment', 'confirmed']);
    const reschedulable = activeBookings.filter(b =>
        RESCHEDULE_ELIGIBLE.has(b.status) &&
        hoursFromNow(b.date, b.time) >= 2
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg-primary pb-20 overflow-x-hidden">
                <div className="container mx-auto px-4 pt-8">
                    {/* Hero placeholder */}
                    <div className="mb-8 space-y-2 animate-pulse">
                        <div className="h-4 w-32 bg-white/5 rounded" />
                        <div className="h-9 w-56 bg-white/10 rounded" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-3">
                            {/* Tab bar placeholder */}
                            <div className="h-10 w-48 bg-white/5 rounded-xl mb-6 animate-pulse" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[...Array(4)].map((_, i) => (
                                    <BookingCardSkeleton key={i} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary pb-20 overflow-x-hidden">
            <div className="container mx-auto px-4 pt-8">
                <DashboardHero userName={userProfile?.name?.split(' ')[0]} />

                {/* Mobile Quick Actions — shown only on small screens above bookings */}
                <div className="lg:hidden mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <Link
                        href={`/${params.lang}/booking/select`}
                        className="shrink-0 py-2.5 px-4 btn-primary rounded-xl font-bold flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        {isEs ? 'Reservar' : 'Book Now'}
                    </Link>
                    <Link
                        href={`/${params.lang}/customer/vehicles`}
                        className="shrink-0 py-2.5 px-4 glass-card hover:bg-white/5 text-text-secondary rounded-xl flex items-center gap-2 text-sm"
                    >
                        <Car className="w-4 h-4" />
                        {isEs ? 'Vehículos' : 'Vehicles'}
                    </Link>
                    <Link
                        href={`/${params.lang}/customer/settings`}
                        className="shrink-0 py-2.5 px-4 glass-card hover:bg-white/5 text-text-secondary rounded-xl flex items-center gap-2 text-sm"
                    >
                        <Settings className="w-4 h-4" />
                        {isEs ? 'Configuración' : 'Settings'}
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content: Bookings */}
                    <div className="lg:col-span-3 space-y-8">
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            {/* Tabs */}
                            <div className="flex items-center gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
                                <button
                                    onClick={() => setTab('active')}
                                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                                        tab === 'active'
                                            ? 'bg-accent-gold text-bg-primary'
                                            : 'text-text-secondary hover:text-white'
                                    }`}
                                >
                                    {isEs ? 'Activos' : 'Active'}
                                    {activeBookings.length > 0 && (
                                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === 'active' ? 'bg-black/20' : 'bg-white/10'}`}>
                                            {activeBookings.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setTab('history')}
                                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                                        tab === 'history'
                                            ? 'bg-accent-gold text-bg-primary'
                                            : 'text-text-secondary hover:text-white'
                                    }`}
                                >
                                    {isEs ? 'Historial' : 'History'}
                                    {historyBookings.length > 0 && (
                                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === 'history' ? 'bg-black/20' : 'bg-white/10'}`}>
                                            {historyBookings.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {tab === 'active' ? (
                                activeBookings.length === 0 ? (
                                    <div className="glass-card rounded-2xl p-12 text-center text-text-secondary">
                                        <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg">{isEs ? 'No tienes servicios activos.' : 'No active bookings.'}</p>
                                        <Link href={`/${lang}/booking/select`} className="mt-4 text-accent-gold font-bold hover:text-white transition-colors block">
                                            {isEs ? 'Reservar un servicio' : 'Book your first service'}
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {activeBookings.map((booking, index) => (
                                            <BookingCard
                                                key={booking.id}
                                                {...booking}
                                                index={index}
                                                onRefresh={() => {
                                                    updateBookingStatus(booking.id, 'cancelled');
                                                    addNotification({
                                                        title: isEs ? 'Servicio Cancelado' : 'Service Cancelled',
                                                        message: isEs
                                                            ? 'Tu reserva ha sido cancelada. Recibirás un email de confirmación.'
                                                            : 'Your booking has been cancelled. You will receive a confirmation email.',
                                                        type: 'info',
                                                    });
                                                }}
                                            />
                                        ))}
                                    </div>
                                )
                            ) : (
                                /* History — compact list */
                                sortedHistory.length === 0 ? (
                                    <div className="glass-card rounded-2xl p-12 text-center text-text-secondary">
                                        <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg">{isEs ? 'No tienes historial de servicios.' : 'No past bookings yet.'}</p>
                                    </div>
                                ) : (
                                    <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/5">
                                        {visibleHistory.map((b) => {
                                            const isCancelled = b.status === 'cancelled';
                                            const isCompleted = b.status === 'completed';
                                            const RowIcon = isCompleted ? CheckCircle : isCancelled ? XCircle : Clock;
                                            const iconColor = isCompleted ? 'text-green-500' : isCancelled ? 'text-red-400/60' : 'text-yellow-400';
                                            return (
                                                <Link
                                                    key={b.id}
                                                    href={`/${lang}/booking/${b.id}/track`}
                                                    className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/5 cursor-pointer ${isCancelled ? 'opacity-45' : ''}`}
                                                >
                                                    <RowIcon className={`w-4 h-4 shrink-0 ${iconColor}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-semibold truncate ${isCancelled ? 'text-text-secondary' : 'text-white'}`}>
                                                            {b.serviceName}
                                                        </p>
                                                        <p className="text-xs text-text-muted mt-0.5">
                                                            {(() => { const d = new Date(b.date); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }); })()}
                                                            {b.time ? ` · ${formatTimeWindow(b.time, lang)}` : ''}
                                                        </p>
                                                    </div>
                                                    <span className={`text-sm font-bold shrink-0 ${isCancelled ? 'text-text-muted' : 'text-accent-gold'}`}>
                                                        ${b.price}
                                                    </span>
                                                    {isCompleted && (
                                                        <span
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="shrink-0 flex gap-2"
                                                        >
                                                            {!b.reviewRating && (
                                                                <Link
                                                                    href={`/${lang}/booking/${b.id}/review`}
                                                                    className="text-xs text-white hover:text-accent-gold font-bold px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 transition-all"
                                                                >
                                                                    {isEs ? 'Reseña' : 'Review'}
                                                                </Link>
                                                            )}
                                                            <Link
                                                                href={`/${lang}/booking/select?service=${encodeURIComponent(b.serviceName)}`}
                                                                className="text-xs text-accent-gold hover:text-white font-bold px-2 py-1 rounded-lg bg-accent-gold/10 hover:bg-accent-gold/20 transition-all"
                                                            >
                                                                {isEs ? 'Repetir' : 'Book Again'}
                                                            </Link>
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                        {/* Footer: See more / See all link */}
                                        <div className="px-5 py-3 flex items-center justify-between">
                                            {sortedHistory.length > HISTORY_PREVIEW && (
                                                <button
                                                    onClick={() => setShowAllHistory(v => !v)}
                                                    className="text-xs text-text-secondary hover:text-white transition-colors font-medium"
                                                >
                                                    {showAllHistory
                                                        ? (isEs ? 'Mostrar menos' : 'Show less')
                                                        : (isEs ? `Ver ${sortedHistory.length - HISTORY_PREVIEW} más` : `See ${sortedHistory.length - HISTORY_PREVIEW} more`)}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setShowAllHistory(true)}
                                                className="ml-auto flex items-center gap-1 text-xs text-accent-gold hover:text-white font-bold transition-colors"
                                            >
                                                {isEs ? 'Ver todas las reservas' : 'See all bookings'}
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}
                        </motion.section>
                    </div>

                    {/* Sidebar: Quick Actions — hidden on mobile (shown as inline bar above) */}
                    <div className="hidden lg:block lg:col-span-1 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="glass-card p-6 rounded-2xl"
                        >
                            <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-wider text-text-muted">{isEs ? 'Acciones Rápidas' : 'Quick Actions'}</h3>
                            <div className="space-y-3">
                                <Link
                                    href={`/${params.lang}/booking/select`}
                                    className="w-full py-3 px-4 btn-primary rounded-xl font-bold flex items-center justify-center gap-2 group text-center"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                    {isEs ? 'Reservar Servicio' : 'Book New Service'}
                                </Link>
                                <Link
                                    href={`/${params.lang}/customer/vehicles`}
                                    className="w-full py-3 px-4 glass-card hover:bg-white/5 text-text-secondary hover:text-white rounded-xl transition-all flex items-center justify-start gap-3"
                                >
                                    <Car className="w-5 h-5" />
                                    {isEs ? 'Mis Vehículos' : 'Manage Vehicles'}
                                </Link>
                                <Link
                                    href={`/${params.lang}/customer/settings`}
                                    className="w-full py-3 px-4 glass-card hover:bg-white/5 text-text-secondary hover:text-white rounded-xl transition-all flex items-center justify-start gap-3"
                                >
                                    <Settings className="w-5 h-5" />
                                    {isEs ? 'Configuración' : 'Account Settings'}
                                </Link>
                            </div>
                        </motion.div>

                        {/* Reschedule widget */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="glass-card p-6 rounded-2xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <CalendarDays className="w-5 h-5 text-accent-gold" />
                                <h3 className="font-bold text-white text-sm uppercase tracking-wider text-text-muted">
                                    {isEs ? 'Reprogramar' : 'Reschedule'}
                                </h3>
                            </div>

                            {reschedulable.length === 0 ? (
                                <p className="text-text-secondary text-sm leading-relaxed">
                                    {isEs
                                        ? 'No tienes citas disponibles para reprogramar. Solo se puede reprogramar con 2+ horas de anticipación.'
                                        : 'No upcoming appointments available to reschedule. Rescheduling requires 2+ hours notice.'}
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-text-secondary text-xs mb-3">
                                        {isEs ? 'Selecciona una cita para reprogramar:' : 'Select an appointment to reschedule:'}
                                    </p>
                                    {reschedulable.map(b => (
                                        <Link
                                            key={b.id}
                                            href={`/${lang}/booking/${b.id}/reschedule`}
                                            className="block w-full p-3 rounded-xl border border-white/10 hover:border-accent-gold/40 hover:bg-accent-gold/5 transition-all group"
                                        >
                                            <p className="text-white text-sm font-semibold group-hover:text-accent-gold transition-colors">{b.serviceName}</p>
                                            <p className="text-text-secondary text-xs mt-0.5">{b.date} · {formatTimeWindow(b.time, lang)}</p>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            <NotificationToast notifications={notifications} onDismiss={dismissNotification} />
        </div>
    );
}
