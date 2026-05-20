"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useParams } from 'next/navigation';

interface DashboardHeroProps {
    userName?: string;
}

export function DashboardHero({ userName }: DashboardHeroProps) {
    const params = useParams();
    const isEs = (params?.lang as string) === 'es';
    const displayName = userName || (isEs ? 'Cliente' : 'Valued Customer');

    return (
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl glass-card p-5 sm:p-8 md:p-10 mb-6 sm:mb-10">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent-gold opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />

            <div className="relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="w-5 h-5 text-accent-gold" />
                        <span className="text-accent-gold font-medium uppercase tracking-wider text-xs">{isEs ? 'Miembro Premium' : 'Premium Member'}</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-4">
                        {isEs ? 'Bienvenido de vuelta, ' : 'Welcome back, '}<span className="text-gold-gradient">{displayName}</span>
                    </h1>

                    <p className="text-text-secondary text-sm sm:text-base md:text-lg max-w-2xl">
                        {isEs
                            ? 'Tu vehículo merece lo mejor. Rastrea tus servicios, administra tu garaje y reserva tu próximo detallado premium.'
                            : 'Your vehicle deserves the best. Track your services, manage your garage, and book your next premium detail.'}
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
