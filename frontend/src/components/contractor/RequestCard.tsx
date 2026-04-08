"use client";

import { MapPin, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';
import { ServiceRequest } from '@/contexts/ContractorContext';
import { motion } from 'framer-motion';

interface RequestCardProps {
    request: ServiceRequest;
    locale?: "en" | "es";
    onAccept?: () => void;
    onDecline?: () => void;
    showActions?: boolean;
}

const labels = {
    en: {
        decline: "Decline",
        accept: "Accept Job",
        viewDetails: "View Details",
    },
    es: {
        decline: "Rechazar",
        accept: "Aceptar Trabajo",
        viewDetails: "Ver Detalles",
    },
};

export default function RequestCard({ request, locale = "en", onAccept, onDecline, showActions = false }: RequestCardProps) {
    const { id, confirmationCode, customerName, vehicleName, serviceName, address, estimatedTotal, status, timestamp } = request;
    const t = labels[locale];

    const timeAgo = (dateString: string) => {
        const minutes = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
        if (minutes < 60) return `${minutes}m ${locale === "es" ? "atrás" : "ago"}`;
        return `${Math.floor(minutes / 60)}h ${locale === "es" ? "atrás" : "ago"}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--card)]/80 backdrop-blur-md border border-[var(--divider)] rounded-2xl p-5 mb-4 shadow-sm"
        >
            {/* Header: Service & Price */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="text-xs font-mono font-semibold text-[var(--text-secondary)]">{confirmationCode || `#${id}`}</span>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1">{serviceName}</h3>
                </div>
                <div className="text-right">
                    <span className="text-xl font-bold text-accent-gold">${(Number(estimatedTotal) || 0).toFixed(2)}</span>
                    <div className="text-xs text-text-secondary">{timeAgo(timestamp)}</div>
                </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-text-secondary">
                    <User className="w-4 h-4 mr-2 text-text-muted" />
                    <span>{customerName}</span>
                </div>
                <div className="flex items-center text-sm text-text-secondary">
                    <div className="w-4 h-4 mr-2 flex items-center justify-center">
                        <span className="block w-2 h-2 rounded-full bg-accent-blue" />
                    </div>
                    <span>{vehicleName}</span>
                </div>
                <div className="flex items-start text-sm text-text-secondary">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 text-text-muted shrink-0" />
                    <span className="line-clamp-2">{address}</span>
                </div>
            </div>

            {/* Actions */}
            {showActions && status === 'pending' && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                        onClick={onDecline}
                        className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary font-medium transition-colors"
                    >
                        {t.decline}
                    </button>
                    <button
                        onClick={onAccept}
                        className="py-3 rounded-xl bg-accent-gold hover:bg-accent-gold/90 text-black font-bold transition-colors shadow-lg shadow-accent-gold/20"
                    >
                        {t.accept}
                    </button>
                </div>
            )}

            {!showActions && (
                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                    <span className={`px-2 py-1 rounded text-xs font-medium uppercase
                        ${status === 'confirmed' ? 'bg-blue-500/10 text-blue-400' :
                            status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                'bg-gray-500/10 text-gray-400'}`}>
                        {status.replace('_', ' ')}
                    </span>
                    <Link
                        href={`/${locale}/contractor/jobs/${id}`}
                        className="text-sm font-medium text-[var(--text-primary)] flex items-center hover:text-accent-gold transition-colors"
                    >
                        {t.viewDetails} <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
            )}
        </motion.div>
    );
}
