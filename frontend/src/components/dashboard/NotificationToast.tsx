import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, XCircle, X, ChevronRight } from 'lucide-react';
import { useParams } from 'next/navigation';

export interface ToastMessage {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
}

interface NotificationToastProps {
    notifications: ToastMessage[];
    onDismiss: (id: string) => void;
}

const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle
};

const colors = {
    info: 'border-blue-500 text-blue-500',
    success: 'border-green-500 text-green-500',
    warning: 'border-yellow-500 text-yellow-500',
    error: 'border-red-500 text-red-500'
};

export function NotificationToast({ notifications, onDismiss }: NotificationToastProps) {
    const params = useParams();
    const isEs = (params?.lang as string) === 'es';
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-4 pointer-events-none">
            <AnimatePresence>
                {notifications.map((notification) => {
                    const Icon = icons[notification.type];
                    const colorClass = colors[notification.type];

                    const inner = (
                        <>
                            <div className={`mt-0.5 ${colorClass.split(' ')[1]}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white text-sm">{notification.title}</h4>
                                <p className="text-text-secondary text-sm leading-snug mt-1">{notification.message}</p>
                                {notification.link && (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-gold mt-2">
                                        {isEs ? 'Toca para abrir' : 'Tap to open'} <ChevronRight className="w-3 h-3" />
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDismiss(notification.id); }}
                                className="text-text-muted hover:text-white transition-colors p-1 shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    );

                    return (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 50, scale: 0.9 }}
                            className="pointer-events-auto"
                        >
                            {notification.link ? (
                                <Link
                                    href={notification.link}
                                    onClick={() => onDismiss(notification.id)}
                                    className={`w-96 glass-card rounded-xl p-4 border-l-4 shadow-lg backdrop-blur-xl flex items-start gap-3 hover:border-accent-gold/60 transition-colors ${colorClass.split(' ')[0]}`}
                                >
                                    {inner}
                                </Link>
                            ) : (
                                <div className={`w-96 glass-card rounded-xl p-4 border-l-4 shadow-lg backdrop-blur-xl flex items-start gap-3 ${colorClass.split(' ')[0]}`}>
                                    {inner}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
