"use client";

import React from 'react';
import { useBookingStatus } from '@/contexts/BookingStatusContext';
import { BookingCard } from '@/components/dashboard/BookingCard';
import { NotificationToast } from '@/components/dashboard/NotificationToast';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { motion } from 'framer-motion';
import { Plus, Car, Settings, HelpCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CustomerDashboardPage() {
    const params = useParams();
    const { bookings, notifications, dismissNotification, userProfile, isLoading } = useBookingStatus();

    // Sort by date
    const sortedBookings = [...bookings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
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
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">Your Garage</h2>
                                {/* Filter or View All could go here */}
                            </div>

                            {sortedBookings.length === 0 ? (
                                <div className="glass-card rounded-2xl p-12 text-center text-text-secondary">
                                    <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg">No active bookings found.</p>
                                    <Link href={`/${params.lang}/booking/select`} className="mt-4 text-accent-gold font-bold hover:text-white transition-colors block">
                                        Book your first service
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {sortedBookings.map((booking, index) => (
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

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent"
                        >
                            <div className="flex items-center gap-3 mb-2 text-blue-400">
                                <HelpCircle className="w-5 h-5" />
                                <h3 className="font-bold">Concierge Support</h3>
                            </div>
                            <p className="text-text-secondary text-sm mb-4 leading-relaxed">
                                Need to reschedule or have special requests? Our concierge team is standing by.
                            </p>
                            <a
                                href="mailto:support@dtailwash.com?subject=Concierge Request"
                                className="text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors block"
                            >
                                Chat with Concierge &rarr;
                            </a>
                        </motion.div>
                    </div>
                </div>
            </div>

            <NotificationToast notifications={notifications} onDismiss={dismissNotification} />
        </div>
    );
}
