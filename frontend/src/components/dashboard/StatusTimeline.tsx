import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Truck, Wrench, ShieldCheck } from 'lucide-react';
import type { BookingStatus } from '@/contexts/BookingStatusContext';

export type { BookingStatus };

interface StatusTimelineProps {
    status: BookingStatus;
}

const steps = [
    { id: 'pending', label: 'Booked', icon: Clock },
    { id: 'confirmed', label: 'Confirmed', icon: Check },
    { id: 'en_route', label: 'En Route', icon: Truck },
    { id: 'working', label: 'Working', icon: Wrench },
    { id: 'completed', label: 'Complete', icon: ShieldCheck },
];

export function StatusTimeline({ status }: StatusTimelineProps) {
    const currentStepIndex = steps.findIndex((s) => s.id === status);
    const isCancelled = status === 'cancelled';

    if (isCancelled) {
        return (
            <div className="w-full py-6">
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-xl text-center font-bold">
                    Booking Cancelled
                </div>
            </div>
        )
    }

    const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

    return (
        <div className="w-full py-8">
            {/* progress bar background */}
            <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 rounded-full" />

                <motion.div
                    className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-accent-gold to-yellow-300 -translate-y-1/2 rounded-full shadow-[0_0_15px_rgba(212,172,13,0.5)]"
                    initial={{ width: '0%' }}
                    animate={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                />

                <div className="relative flex justify-between">
                    {steps.map((step, index) => {
                        const isActive = index <= activeIndex;
                        const isCurrent = index === activeIndex;
                        const Icon = step.icon;

                        return (
                            <div key={step.id} className="flex flex-col items-center group cursor-default">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: isCurrent ? 1.2 : 1,
                                        backgroundColor: isActive ? '#D4AC0D' : '#1a1a1a',
                                        borderColor: isActive ? '#D4AC0D' : '#333',
                                        color: isActive ? '#000' : '#666'
                                    }}
                                    className={`
                                w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-colors duration-300
                                ${isCurrent ? 'shadow-glow' : ''}
                             `}
                                >
                                    <Icon className="w-5 h-5" />
                                </motion.div>

                                <motion.span
                                    animate={{
                                        color: isActive ? '#fff' : '#52525b',
                                        y: isCurrent ? -2 : 0
                                    }}
                                    className="mt-3 text-xs font-semibold uppercase tracking-wider bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md"
                                >
                                    {step.label}
                                </motion.span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
