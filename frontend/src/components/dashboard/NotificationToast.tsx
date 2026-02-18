import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export interface ToastMessage {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
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
    info: 'border-blue-500 text-blue-500 shadow-blue-500/20',
    success: 'border-green-500 text-green-500 shadow-green-500/20',
    warning: 'border-yellow-500 text-yellow-500 shadow-yellow-500/20',
    error: 'border-red-500 text-red-500 shadow-red-500/20'
};

export function NotificationToast({ notifications, onDismiss }: NotificationToastProps) {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-4 pointer-events-none">
            <AnimatePresence>
                {notifications.map((notification) => {
                    const Icon = icons[notification.type];
                    const colorClass = colors[notification.type];

                    return (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 50, scale: 0.9 }}
                            className={`
                    pointer-events-auto w-96 glass-card rounded-xl p-4 border-l-4 shadow-lg backdrop-blur-xl
                    flex items-start gap-3
                    ${colorClass.split(' ')[0]}
                `}
                        >
                            <div className={`mt-0.5 ${colorClass.split(' ')[1]}`}>
                                <Icon className="w-5 h-5" />
                            </div>

                            <div className="flex-1">
                                <h4 className="font-bold text-white text-sm">{notification.title}</h4>
                                <p className="text-text-secondary text-sm leading-snug mt-1">{notification.message}</p>
                            </div>

                            <button
                                onClick={() => onDismiss(notification.id)}
                                className="text-text-muted hover:text-white transition-colors p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    );
}
