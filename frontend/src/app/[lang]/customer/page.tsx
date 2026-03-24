"use client";

import React, { useState } from 'react';
import { useBookingStatus } from '@/contexts/BookingStatusContext';
import { BookingCard, BookingCardSkeleton } from '@/components/dashboard/BookingCard';
import { NotificationToast } from '@/components/dashboard/NotificationToast';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { motion } from 'framer-motion';
import { Plus, Car, Settings, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const ACTIVE_STATUSES = new Set(['pending_payment', 'pending', 'pending_assignment', 'confirmed', 'en_route', 'working']);

export default function CustomerDashboardPage() {
    const params = useParams();
    const lang = (params?.lang as string) || 'en';
    const isEs = lang === 'es';
    const { bookings, notifications, dismissNotification, userProfile, isLoading } = useBookingStatus();
    const [tab, setTab] = useState<'active' | 'history'>('active');

    const sorted = [...bookings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const activeBookings = sorted.filter(b => ACTIVE_STATUSES.has(b.status));
    const historyBookings = sorted.filter(b => !ACTIVE_STATUSES.has(b.status));
    const displayed = tab === 'active' ? activeBookings : historyBookings;

    const RESCHEDULE_ELIGIBLE = new Set(['pending', 'pending_assignment', 'confirmed']);
    const reschedulable = activeBookings.filter(b =>
        RESCHEDULE_ELIGIBLE.has(b.status) &&
        (new Date(b.date).getTime() - Date.now()) / (1000 * 60 * 60) >= 24
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
                <DashboardHero userName={userProfile?.name} />

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

                            {displayed.length === 0 ? (
                                <div className="glass-card rounded-2xl p-12 text-center text-text-secondary">
                                    <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg">
                                        {tab === 'active'
                                            ? (isEs ? 'No tienes servicios activos.' : 'No active bookings.')
                                            : (isEs ? 'No tienes historial de servicios.' : 'No past bookings yet.')}
                                    </p>
                                    {tab === 'active' && (
                                        <Link href={`/${lang}/booking/select`} className="mt-4 text-accent-gold font-bold hover:text-white transition-colors block">
                                            {isEs ? 'Reservar un servicio' : 'Book your first service'}
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {displayed.map((booking, index) => (
                                        <BookingCard
                                            key={booking.id}
                                            {...booking}
                                            index={index}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.section>
                    </div>

                    {/* Sidebar: Quick Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="glass-card p-6 rounded-2xl"
                        >
                            <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-wider text-text-muted">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link
                                    href={`/${params.lang}/booking/select`}
                                    className="w-full py-3 px-4 btn-primary rounded-xl font-bold flex items-center justify-center gap-2 group text-center"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                    Book New Service
                                </Link>
                                <Link
                                    href={`/${params.lang}/customer/vehicles`}
                                    className="w-full py-3 px-4 glass-card hover:bg-white/5 text-text-secondary hover:text-white rounded-xl transition-all flex items-center justify-start gap-3"
                                >
                                    <Car className="w-5 h-5" />
                                    Manage Vehicles
                                </Link>
                                <Link
                                    href={`/${params.lang}/customer/settings`}
                                    className="w-full py-3 px-4 glass-card hover:bg-white/5 text-text-secondary hover:text-white rounded-xl transition-all flex items-center justify-start gap-3"
                                >
                                    <Settings className="w-5 h-5" />
                                    Account Settings
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
                                        ? 'No tienes citas disponibles para reprogramar. Solo se puede reprogramar con 24+ horas de anticipación.'
                                        : 'No upcoming appointments available to reschedule. Rescheduling requires 24+ hours notice.'}
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
                                            <p className="text-text-secondary text-xs mt-0.5">{b.date} · {b.time}</p>
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
