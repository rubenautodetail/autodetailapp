"use client";

import { ArrowLeft, Plus, Car, Trash2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useBookingStatus } from "@/contexts";
import { useState } from "react";

type VehicleType = "sedan" | "suv" | "truck" | "coupe" | "van" | "other";

const VEHICLE_TYPES: { id: VehicleType; en: string; es: string }[] = [
    { id: 'sedan', en: 'Sedan', es: 'Sedán' },
    { id: 'suv', en: 'SUV', es: 'SUV' },
    { id: 'truck', en: 'Truck', es: 'Camioneta' },
    { id: 'coupe', en: 'Coupe', es: 'Coupé' },
    { id: 'van', en: 'Van', es: 'Van' },
    { id: 'other', en: 'Other', es: 'Otro' },
];

export default function MyVehiclesPage() {
    const router = useRouter();
    const params = useParams();
    const locale = (params?.lang as string) || 'en';
    const isEs = locale === 'es';
    const { vehicles, removeVehicle, addVehicle } = useBookingStatus();
    const [isAdding, setIsAdding] = useState(false);

    // Form state for new vehicle
    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [year, setYear] = useState("");
    const [color, setColor] = useState("");
    const [type, setType] = useState<VehicleType>("sedan");

    const handleAddVehicle = async () => {
        if (!make || !model || !year || !color) return;

        await addVehicle({
            make,
            model,
            year,
            color,
            type,
            licensePlate: ""
        });

        setIsAdding(false);
        setMake("");
        setModel("");
        setYear("");
        setColor("");
        setType("sedan");
    };

    return (
        <div className="min-h-screen bg-[var(--background)] p-6">
            <header className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm border border-[var(--divider)]"
                >
                    <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
                </button>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{isEs ? 'Mis Vehículos' : 'My Vehicles'}</h1>
            </header>

            <div className="space-y-4">
                {vehicles.map((v) => (
                    <div key={v.id} className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--divider)] shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                                <Car className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--text-primary)]">{v.make} {v.model}</h3>
                                <p className="text-sm text-[var(--text-secondary)]">{v.color} · {v.year} · {v.type}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => removeVehicle(v.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            aria-label={isEs ? 'Eliminar vehículo' : 'Delete vehicle'}
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}

                {vehicles.length === 0 && !isAdding && (
                    <div className="text-center py-8 bg-[var(--card)] rounded-2xl border border-dashed border-[var(--divider)]">
                        <Car className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3 opacity-50" />
                        <p className="text-[var(--text-secondary)] text-sm">
                            {isEs ? 'Aún no has añadido vehículos' : 'No vehicles added yet'}
                        </p>
                    </div>
                )}

                {isAdding ? (
                    <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--divider)] shadow-lg space-y-4">
                        <h3 className="font-bold text-lg text-[var(--text-primary)]">
                            {isEs ? 'Añadir Vehículo' : 'Add New Vehicle'}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                placeholder={isEs ? 'Marca' : 'Make'}
                                value={make}
                                onChange={(e) => setMake(e.target.value)}
                                className="bg-[var(--background)] border border-[var(--divider)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                            />
                            <input
                                placeholder={isEs ? 'Modelo' : 'Model'}
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="bg-[var(--background)] border border-[var(--divider)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                            />
                            <input
                                placeholder={isEs ? 'Año' : 'Year'}
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="bg-[var(--background)] border border-[var(--divider)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                                inputMode="numeric"
                                maxLength={4}
                            />
                            <input
                                placeholder="Color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="bg-[var(--background)] border border-[var(--divider)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                            />
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as VehicleType)}
                                className="bg-[var(--background)] border border-[var(--divider)] rounded-xl px-4 py-3 text-[var(--text-primary)] col-span-2"
                            >
                                {VEHICLE_TYPES.map((t) => (
                                    <option key={t.id} value={t.id}>{isEs ? t.es : t.en}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleAddVehicle}
                                disabled={!make || !model || !year || !color}
                                className="flex-1 py-3 bg-[var(--accent)] text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            >
                                {isEs ? 'Guardar' : 'Save Vehicle'}
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="flex-1 py-3 bg-[var(--card)] border border-[var(--divider)] text-[var(--text-secondary)] rounded-xl"
                            >
                                {isEs ? 'Cancelar' : 'Cancel'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full py-4 rounded-xl border-2 border-dashed border-[var(--divider)] text-[var(--text-secondary)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--card)] transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        {isEs ? 'Añadir Vehículo' : 'Add New Vehicle'}
                    </button>
                )}
            </div>
        </div>
    );
}
