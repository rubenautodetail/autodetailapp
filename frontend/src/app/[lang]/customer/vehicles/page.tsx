"use client";

import React, { useState } from 'react';
import { useBookingStatus, Vehicle } from '@/contexts/BookingStatusContext';
import { VehicleCard } from '@/components/dashboard/VehicleCard';
import { NotificationToast } from '@/components/dashboard/NotificationToast';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft, Car, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function VehiclesPage() {
    const params = useParams();
    const { vehicles, addVehicle, removeVehicle, notifications, dismissNotification, isLoading } = useBookingStatus();
    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Vehicle Form State
    const [newVehicle, setNewVehicle] = useState<Omit<Vehicle, 'id'>>({
        make: '',
        model: '',
        year: new Date().getFullYear().toString(),
        color: '',
        licensePlate: '',
        type: 'sedan'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addVehicle(newVehicle);
            setIsAdding(false);
            // Reset form
            setNewVehicle({
                make: '',
                model: '',
                year: new Date().getFullYear().toString(),
                color: '',
                licensePlate: '',
                type: 'sedan'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary pb-20">
            {/* Header */}
            <div className="glass-card border-b border-white/5 sticky top-0 z-40 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href={`/${params.lang || 'en'}/customer`} className="text-text-secondary hover:text-white flex items-center text-sm font-medium transition-colors">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-white font-bold hidden md:block">Garage</h1>
                    <div className="w-20"></div> {/* Spacer for centering */}
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Garage</h1>
                        <p className="text-text-secondary">Manage the vehicles in your premium fleet.</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="btn-primary py-2 px-4 rounded-lg font-bold flex items-center shadow-glow"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Vehicle
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {vehicles.map((vehicle) => (
                            <VehicleCard
                                key={vehicle.id}
                                vehicle={vehicle}
                                onDelete={removeVehicle}
                            />
                        ))}
                    </AnimatePresence>

                    {vehicles.length === 0 && (
                        <div className="col-span-full py-12 text-center text-text-muted border border-dashed border-white/10 rounded-2xl">
                            <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No vehicles in your garage yest.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Vehicle Modal */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsAdding(false)}
                                className="absolute top-4 right-4 text-text-muted hover:text-white"
                                disabled={isSubmitting}
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                                <Plus className="w-6 h-6 text-accent-gold mr-2" />
                                Add New Vehicle
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase text-text-muted font-bold mb-1">Make</label>
                                        <input
                                            type="text"
                                            required
                                            disabled={isSubmitting}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-gold focus:outline-none transition-colors disabled:opacity-50"
                                            placeholder="e.g. Tesla"
                                            value={newVehicle.make}
                                            onChange={e => setNewVehicle({ ...newVehicle, make: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-text-muted font-bold mb-1">Model</label>
                                        <input
                                            type="text"
                                            required
                                            disabled={isSubmitting}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-gold focus:outline-none transition-colors disabled:opacity-50"
                                            placeholder="e.g. Model Y"
                                            value={newVehicle.model}
                                            onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase text-text-muted font-bold mb-1">Year</label>
                                        <input
                                            type="text"
                                            required
                                            disabled={isSubmitting}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-gold focus:outline-none transition-colors disabled:opacity-50"
                                            placeholder="YYYY"
                                            value={newVehicle.year}
                                            onChange={e => setNewVehicle({ ...newVehicle, year: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-text-muted font-bold mb-1">Color</label>
                                        <input
                                            type="text"
                                            required
                                            disabled={isSubmitting}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-gold focus:outline-none transition-colors disabled:opacity-50"
                                            placeholder="e.g. Black"
                                            value={newVehicle.color}
                                            onChange={e => setNewVehicle({ ...newVehicle, color: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase text-text-muted font-bold mb-1">License Plate</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={isSubmitting}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-gold focus:outline-none transition-colors disabled:opacity-50"
                                        placeholder="ABC-1234"
                                        value={newVehicle.licensePlate}
                                        onChange={e => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full btn-primary py-3 rounded-xl font-bold text-white shadow-glow disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        ) : null}
                                        {isSubmitting ? 'Saving...' : 'Save Vehicle'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <NotificationToast notifications={notifications} onDismiss={dismissNotification} />
        </div>
    );
}
