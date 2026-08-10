"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Car, Plus, Trash2 } from 'lucide-react';
import { useBookingStatus, type Vehicle } from '@/contexts';
import { VehicleForm } from '@/components/vehicles/VehicleForm';
import { getVehicleBodyStyleLabel } from '@/types/vehicle';

export default function MyVehiclesPage() {
    const router = useRouter();
    const params = useParams();
    const locale = params?.lang === 'es' ? 'es' : 'en';
    const isEs = locale === 'es';
    const { vehicles, removeVehicle, addVehicle } = useBookingStatus();
    const [isAdding, setIsAdding] = useState(false);

    const handleAddVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
        await addVehicle(vehicle);
        setIsAdding(false);
    };

    return (
        <div className="min-h-screen bg-[var(--background)] p-4 sm:p-6">
            <header className="mb-8 flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--divider)] bg-[var(--card)] shadow-sm"
                    aria-label={isEs ? 'Volver' : 'Go back'}
                >
                    <ArrowLeft className="h-5 w-5 text-[var(--text-primary)]" aria-hidden="true" />
                </button>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                    {isEs ? 'Mis vehículos' : 'My vehicles'}
                </h1>
            </header>

            <main className="mx-auto max-w-5xl space-y-4">
                {vehicles.map((vehicle) => (
                    <article
                        key={vehicle.id}
                        className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-[var(--divider)] bg-[var(--card)] p-4 shadow-sm"
                    >
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                                <Car className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="truncate font-semibold text-[var(--text-primary)]">
                                    {vehicle.make} {vehicle.model}
                                </h2>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {vehicle.color} · {vehicle.year} ·{' '}
                                    {getVehicleBodyStyleLabel(vehicle.type, locale)}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => removeVehicle(vehicle.id)}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-500/10 motion-reduce:transition-none"
                            aria-label={isEs ? 'Eliminar vehículo' : 'Delete vehicle'}
                        >
                            <Trash2 className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </article>
                ))}

                {vehicles.length === 0 && !isAdding && (
                    <div className="rounded-2xl border border-dashed border-[var(--divider)] bg-[var(--card)] py-8 text-center">
                        <Car
                            className="mx-auto mb-3 h-10 w-10 text-[var(--text-secondary)] opacity-50"
                            aria-hidden="true"
                        />
                        <p className="text-sm text-[var(--text-secondary)]">
                            {isEs ? 'Aún no has agregado vehículos' : 'No vehicles added yet'}
                        </p>
                    </div>
                )}

                {isAdding ? (
                    <section className="min-w-0 rounded-2xl border border-[var(--divider)] bg-[var(--card)] p-4 shadow-lg sm:p-6">
                        <VehicleForm
                            locale={locale}
                            onSubmit={handleAddVehicle}
                            onCancel={() => setIsAdding(false)}
                        />
                    </section>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsAdding(true)}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--divider)] py-4 font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--card)] motion-reduce:transition-none"
                    >
                        <Plus className="h-5 w-5" aria-hidden="true" />
                        {isEs ? 'Agregar vehículo' : 'Add a new vehicle'}
                    </button>
                )}
            </main>
        </div>
    );
}
