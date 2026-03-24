"use client";

import React, { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useBookingStatus } from '@/contexts/BookingStatusContext';
import { StatusTimeline } from '@/components/dashboard/StatusTimeline';
import { NotificationToast } from '@/components/dashboard/NotificationToast';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Star } from 'lucide-react';
import { fmtDate } from '@/lib/dateUtils';

interface BookingDetailPageProps {
    params: Promise<{
        lang: string;
        id: string;
    }>;
}

export default function BookingDetailPage({ params }: BookingDetailPageProps) {
    const { lang, id } = use(params);
    const { getBooking, notifications, dismissNotification } = useBookingStatus();

    const booking = getBooking(id);

    if (!booking) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-bg-primary pb-20">
            {/* Top Bar */}
            <div className="glass-card border-b border-white/5 sticky top-0 z-40 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center">
                    <Link href={`/${lang}/customer`} className="text-text-secondary hover:text-white flex items-center text-sm font-medium transition-colors">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        {lang === 'es' ? 'Volver al Panel' : 'Back to Dashboard'}
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: Tracking & Map */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Status Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card rounded-3xl p-8 relative overflow-hidden"
                        >
                            {/* Glow Effect */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div>
                                    <h1 className="text-3xl font-display font-bold text-white mb-1">{lang === 'es' ? 'Orden' : 'Order'} {booking.confirmationCode || `#${booking.id}`}</h1>
                                    <p className="text-text-secondary text-lg">{booking.serviceName}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-text-muted uppercase tracking-wider mb-1">{lang === 'es' ? 'Programado' : 'Scheduled For'}</div>
                                    <div className="text-xl font-mono text-accent-gold font-bold">{booking.time}</div>
                                    <div className="text-sm text-text-secondary">{fmtDate(booking.date, lang === 'es' ? 'es-US' : 'en-US')}</div>
                                </div>
                            </div>

                            <StatusTimeline status={booking.status} />

                            {/* Map Visualization */}
                            <div className="mt-10 rounded-2xl h-80 w-full relative overflow-hidden group border border-white/10">
                                <div className="absolute inset-0 bg-gray-900">
                                    {/* Simplified Abstract Map for Mockup */}
                                    <div className="w-full h-full opacity-30 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px]"></div>

                                    {/* Pulse effect for provider location */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 bg-accent-gold rounded-full animate-ping absolute opacity-75"></div>
                                        <div className="w-4 h-4 bg-accent-gold rounded-full relative border-2 border-black"></div>
                                    </div>
                                </div>

                                <div className="absolute bottom-4 left-4 right-4 glass-card p-4 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center text-white">
                                        <MapPin className="w-5 h-5 text-accent-gold mr-3" />
                                        <div>
                                            <p className="text-xs text-text-muted uppercase">{lang === 'es' ? 'Ubicación del Servicio' : 'Service Location'}</p>
                                            <p className="font-medium text-sm">{booking.customerAddress}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Provider Info */}
                        {booking.providerName && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="glass-card p-6 rounded-2xl flex items-center"
                            >
                                <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-black rounded-full flex items-center justify-center text-white font-bold text-2xl mr-6 border-2 border-accent-gold shadow-glow">
                                    {booking.providerName.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-xl text-white">{booking.providerName}</h3>
                                    <div className="flex items-center text-accent-gold text-sm mt-1">
                                        <Star className="w-4 h-4 fill-current mr-1" />
                                        {booking.providerRating != null ? (
                                            <span className="font-bold">{booking.providerRating.toFixed(1)}</span>
                                        ) : (
                                            <span className="text-text-secondary">No rating yet</span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Payment Summary */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="glass-card p-8 rounded-2xl"
                        >
                            <h3 className="font-bold text-white mb-6 uppercase text-xs tracking-wider border-b border-white/10 pb-2 text-text-muted">{lang === 'es' ? 'Resumen de Pago' : 'Payment Summary'}</h3>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between pt-2">
                                    <span className="text-white font-bold text-lg">{lang === 'es' ? 'Total Pagado' : 'Total Paid'}</span>
                                    <span className="font-bold text-accent-gold text-xl">${booking.price.toFixed(2)}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* View Receipt — only when completed */}
                        {booking.status === 'completed' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 }}
                                className="glass-card p-4 rounded-2xl"
                            >
                                <Link
                                    href={`/${lang}/booking/${booking.id}/receipt`}
                                    className="flex items-center justify-between text-sm text-text-secondary hover:text-white transition-colors"
                                >
                                    <span>{lang === 'es' ? 'Ver Recibo de Pago' : 'View Payment Receipt'}</span>
                                    <ChevronLeft className="w-4 h-4 rotate-180" />
                                </Link>
                            </motion.div>
                        )}

                        {/* Rate Your Service — only when completed */}
                        {booking.status === 'completed' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="glass-card p-6 rounded-2xl border border-accent-gold/20"
                            >
                                <div className="flex items-center gap-2 mb-2 text-accent-gold">
                                    <Star className="w-5 h-5 fill-current" />
                                    <h3 className="font-bold">
                                        {lang === 'es' ? 'Califica tu Servicio' : 'Rate Your Service'}
                                    </h3>
                                </div>
                                <p className="text-text-secondary text-sm mb-5 leading-relaxed">
                                    {lang === 'es'
                                        ? 'Tu opinión ayuda a mejorar nuestros servicios y reconocer a los mejores detalladores.'
                                        : 'Your feedback helps us improve and recognize our best detailers.'}
                                </p>
                                <Link
                                    href={`/${lang}/booking/${booking.id}/review`}
                                    className="block w-full py-3 btn-primary rounded-xl font-bold text-center text-sm"
                                >
                                    {lang === 'es' ? 'Dejar una Reseña' : 'Leave a Review'}
                                </Link>
                            </motion.div>
                        )}
                    </div>
                </div>
                <NotificationToast notifications={notifications} onDismiss={dismissNotification} />
            </div>
        </div>
    );
}
