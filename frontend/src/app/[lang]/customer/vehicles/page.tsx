"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Car, ChevronLeft, Loader2, Plus, X } from 'lucide-react';
import {
    useBookingStatus,
    type Vehicle,
} from '@/contexts/BookingStatusContext';
import { NotificationToast } from '@/components/dashboard/NotificationToast';
import { VehicleCard } from '@/components/dashboard/VehicleCard';
import { VehicleForm } from '@/components/vehicles/VehicleForm';

export default function VehiclesPage() {
    const params = useParams();
    const locale = params?.lang === 'es' ? 'es' : 'en';
    const isEs = locale === 'es';
    const prefersReducedMotion = useReducedMotion();
    const {
        vehicles,
        addVehicle,
        removeVehicle,
        notifications,
        dismissNotification,
        isLoading,
    } = useBookingStatus();
    const [isAdding, setIsAdding] = useState(false);

    const handleAddVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
        await addVehicle(vehicle);
        setIsAdding(false);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-bg-primary">
                <Loader2
                    className="h-8 w-8 animate-spin text-accent-gold motion-reduce:animate-none"
                    aria-label={isEs ? 'Cargando vehículos' : 'Loading vehicles'}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary pb-20">
            <div className="glass-card sticky top-0 z-40 border-b border-white/5 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link
                        href={`/${locale}/customer`}
                        className="flex min-h-11 items-center text-sm font-medium text-text-secondary transition-colors hover:text-white motion-reduce:transition-none"
                    >
                        <ChevronLeft className="mr-1 h-5 w-5" aria-hidden="true" />
                        {isEs ? 'Volver al panel' : 'Back to dashboard'}
                    </Link>
                    <h1 className="hidden font-bold text-white md:block">
                        {isEs ? 'Garaje' : 'Garage'}
                    </h1>
                    <div className="w-20" aria-hidden="true" />
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="mb-1 text-2xl font-bold text-white sm:mb-2 sm:text-3xl">
                            {isEs ? 'Mi garaje' : 'My garage'}
                        </h2>
                        <p className="text-sm text-text-secondary sm:text-base">
                            {isEs
                                ? 'Administra los vehículos de tu flota.'
                                : 'Manage the vehicles in your premium fleet.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsAdding(true)}
                        className="btn-primary flex min-h-11 items-center self-start rounded-lg px-4 py-2.5 font-bold shadow-glow sm:self-auto"
                    >
                        <Plus className="mr-2 h-5 w-5" aria-hidden="true" />
                        {isEs ? 'Agregar vehículo' : 'Add vehicle'}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                        <div className="col-span-full rounded-2xl border border-dashed border-white/10 py-12 text-center text-text-muted">
                            <Car className="mx-auto mb-4 h-12 w-12 opacity-50" aria-hidden="true" />
                            <p>
                                {isEs
                                    ? 'Aún no tienes vehículos en tu garaje.'
                                    : 'No vehicles in your garage yet.'}
                            </p>
                        </div>
                    )}
                </div>
            </main>

            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-label={isEs ? 'Agregar nuevo vehículo' : 'Add a new vehicle'}
                            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.97 }}
                            className="relative max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-5 shadow-2xl sm:p-7"
                        >
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-white/10 hover:text-white motion-reduce:transition-none"
                                aria-label={isEs ? 'Cerrar formulario' : 'Close form'}
                            >
                                <X className="h-6 w-6" aria-hidden="true" />
                            </button>
                            <div className="pr-10">
                                <VehicleForm
                                    locale={locale}
                                    appearance="dark"
                                    onSubmit={handleAddVehicle}
                                    onCancel={() => setIsAdding(false)}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <NotificationToast notifications={notifications} onDismiss={dismissNotification} />
        </div>
    );
}
