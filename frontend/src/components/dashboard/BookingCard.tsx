"use client";

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronRight, CheckCircle, Truck, Wrench, ShieldCheck, XCircle } from 'lucide-react';
import { BookingStatus } from './StatusTimeline';

interface BookingCardProps {
    id: string;
    serviceName: string;
    date: string; // ISO string
    time: string;
    status: BookingStatus;
    price: number;
    providerName?: string;
    index?: number; // For stagger animation
}

const statusConfig = {
    pending: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Clock, label: 'Requested' },
    confirmed: { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: CheckCircle, label: 'Confirmed' },
    en_route: { color: 'text-indigo-500', bg: 'bg-indigo-500/10', icon: Truck, label: 'En Route' },
    working: { color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Wrench, label: 'In Progress' },
    completed: { color: 'text-green-500', bg: 'bg-green-500/10', icon: ShieldCheck, label: 'Completed' },
    cancelled: { color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle, label: 'Cancelled' },
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
    const lang = params?.lang || 'en';
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
                                {config.label}
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
                        {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="flex items-center text-text-secondary text-sm">
                        <Clock className="w-4 h-4 mr-2 text-text-muted" />
                        {time}
                    </div>
                    {providerName && (
                        <div className="flex items-center text-text-secondary text-sm">
                            <ShieldCheck className="w-4 h-4 mr-2 text-text-muted" />
                            Detailer: <span className="text-white ml-1">{providerName}</span>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-xs text-text-muted font-mono">ID: {id}</span>
                    <Link
                        href={`/${lang}/customer/bookings/${id}`}
                        className="flex items-center text-sm font-semibold text-white hover:text-accent-gold transition-colors group/link"
                    >
                        Track Status
                        <ChevronRight className="w-4 h-4 ml-1 transform group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
