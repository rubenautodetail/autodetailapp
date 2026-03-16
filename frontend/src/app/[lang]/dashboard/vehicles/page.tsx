"use client";
 
import { ArrowLeft, Plus, Car, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBookingStatus } from "@/contexts";
import { useState } from "react";

export default function MyVehiclesPage() {
    const router = useRouter();
    const { vehicles, removeVehicle, addVehicle } = useBookingStatus();
    const [isAdding, setIsAdding] = useState(false);

    // Form state for new vehicle
    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [year, setYear] = useState("");
    const [color, setColor] = useState("");
    const [type, setType] = useState<any>("sedan");

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
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Vehicles</h1>
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
                                <p className="text-sm text-[var(--text-secondary)]">{v.color} • {v.year} • {v.type}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => removeVehicle(v.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}

                {isAdding ? (
                    <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--divider)] shadow-lg space-y-4">
                        <h3 className="font-bold text-lg text-[var(--text-primary)]">Add New Vehicle</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input 
                                placeholder="Make" 
                                value={make}
                                onChange={(e) => setMake(e.target.value)}
                                className="bg-transparent border border-[var(--divider)] rounded-xl px-4 py-2"
                            />
                            <input 
                                placeholder="Model" 
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="bg-transparent border border-[var(--divider)] rounded-xl px-4 py-2"
                            />
                            <input 
                                placeholder="Year" 
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="bg-transparent border border-[var(--divider)] rounded-xl px-4 py-2"
                            />
                            <input 
                                placeholder="Color" 
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="bg-transparent border border-[var(--divider)] rounded-xl px-4 py-2"
                            />
                            <select 
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="bg-transparent border border-[var(--divider)] rounded-xl px-4 py-2 col-span-2"
                            >
                                <option value="sedan">Sedan</option>
                                <option value="suv">SUV</option>
                                <option value="truck">Truck</option>
                                <option value="coupe">Coupe</option>
                                <option value="van">Van</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={handleAddVehicle}
                                className="flex-1 py-3 bg-[var(--accent)] text-white rounded-xl font-bold"
                            >
                                Save Vehicle
                            </button>
                            <button 
                                onClick={() => setIsAdding(false)}
                                className="flex-1 py-3 bg-[var(--card)] border border-[var(--divider)] text-[var(--text-secondary)] rounded-xl"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="w-full py-4 rounded-xl border-2 border-dashed border-[var(--divider)] text-[var(--text-secondary)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--card)] transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Vehicle
                    </button>
                )}
            </div>
        </div>
    );
}
