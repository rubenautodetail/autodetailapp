"use client";

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Clock, ShieldCheck, ChevronRight, CheckCircle, Truck, Wrench, XCircle, CreditCard } from 'lucide-react';
import { BookingStatus } from './StatusTimeline';

interface BookingCardProps {
    id: string;
    serviceName: string;
    date: string;
    time: string;
    status: BookingStatus;
    price: number;
    providerName?: string;
    index?: number;
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
    confirmed: { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: CheckCircle, en: 'Confirmed', es: 'Confirmado' },
    en_route: { color: 'text-indigo-500', bg: 'bg-indigo-500/10', icon: Truck, en: 'En Route', es: 'En Camino' },
    working: { color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Wrench, en: 'In Progress', es: 'En Progreso' },
    completed: { color: 'text-green-500', bg: 'bg-green-500/10', icon: ShieldCheck, en: 'Completed', es: 'Completado' },
    cancelled: { color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle, en: 'Cancelled', es: 'Cancelado' },
};

export function BookingCard({
    id,
    serviceName,
    date,
    time,
    status,
    price,
    providerName,
    index = 0,
}: BookingCardProps) {
    const params = useParams();
    const lang = (params?.lang as string) || 'en';
    const isEs = lang === 'es';
    const config = statusConfig[status] || statusConfig.pending;
    const StatusIcon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="glass-card rounded-2xl overflow-hidden group hover:border-accent-gold/30 transition-all duration-300"
        >
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${config.bg}`}>
                            <StatusIcon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                            <span className={`text-xs font-medium uppercase tracking-wider ${config.color}`}>
                                {isEs ? config.es : config.en}
                            </span>
                            <h3 className="text-xl font-bold text-white mt-1 group-hover:text-accent-gold transition-colors">
                                {serviceName}
                            </h3>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-accent-gold">${price}</span>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center text-text-secondary text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-text-muted" />
                        {new Date(date).toLocaleDateString(lang, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="flex items-center text-text-secondary text-sm">
                        <Clock className="w-4 h-4 mr-2 text-text-muted" />
                        {time}
                    </div>
                    {providerName && (
                        <div className="flex items-center text-text-secondary text-sm">
                            <ShieldCheck className="w-4 h-4 mr-2 text-text-muted" />
                            {isEs ? 'Detallador:' : 'Detailer:'} <span className="text-white ml-1">{providerName}</span>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-xs text-text-muted font-mono">ID: {id}</span>
                    {status === 'pending_payment' ? (
                        <Link
                            href={`/${lang}/booking/${id}/pay`}
                            className="flex items-center gap-1.5 text-sm font-bold text-amber-400 hover:text-white bg-amber-400/10 hover:bg-amber-400/20 px-3 py-1.5 rounded-lg transition-all group/link"
                        >
                            <CreditCard className="w-4 h-4" />
                            {isEs ? 'Completar Pago' : 'Complete Payment'}
                            <ChevronRight className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <Link
                            href={`/${lang}/booking/${id}/track`}
                            className="flex items-center text-sm font-semibold text-white hover:text-accent-gold transition-colors group/link"
                        >
                            {isEs ? 'Ver Estado' : 'Track Status'}
                            <ChevronRight className="w-4 h-4 ml-1 transform group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
