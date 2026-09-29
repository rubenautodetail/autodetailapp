"use client";

import { useState } from "react";
import BottomSheetModal from "@/components/ui/BottomSheetModal";
import { getVehicleBodyStyleLabel, type VehicleBodyStyle } from "@/types/vehicle";

export interface VehicleDetails {
    make: string;
    model: string;
    year: string;
    color: string;
}

interface VehicleDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (details: VehicleDetails) => void;
    bodyStyle: VehicleBodyStyle;
    locale: "en" | "es";
}

const fieldClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-[#131835] px-3 py-2.5 text-sm text-white placeholder:text-[#8994B8] focus:outline-none focus:ring-2 focus:ring-[#D0B078] ${
        hasError ? "border-red-500/50" : "border-[#2C355E]"
    }`;

/**
 * Asks for make/model/year/color right when the customer tries to move past
 * step 1, instead of letting a body-style-only pick (chosen just to preview
 * pricing) count as a real vehicle. The body style itself was already chosen
 * on the page below, so this only collects the remaining details.
 */
export default function VehicleDetailsModal({
    isOpen,
    onClose,
    onConfirm,
    bodyStyle,
    locale,
}: VehicleDetailsModalProps) {
    const isEs = locale === "es";
    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [year, setYear] = useState("");
    const [color, setColor] = useState("");
    const [errors, setErrors] = useState<Partial<Record<keyof VehicleDetails, string>>>({});

    const handleConfirm = () => {
        const trimmed = { make: make.trim(), model: model.trim(), year: year.trim(), color: color.trim() };
        const newErrors: Partial<Record<keyof VehicleDetails, string>> = {};
        if (!trimmed.make) newErrors.make = isEs ? "Marca requerida" : "Make required";
        if (!trimmed.model) newErrors.model = isEs ? "Modelo requerido" : "Model required";
        if (!trimmed.year) newErrors.year = isEs ? "Año requerido" : "Year required";
        if (!trimmed.color) newErrors.color = isEs ? "Color requerido" : "Color required";
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        onConfirm(trimmed);
        setMake("");
        setModel("");
        setYear("");
        setColor("");
        setErrors({});
    };

    return (
        <BottomSheetModal
            isOpen={isOpen}
            onClose={onClose}
            title={isEs ? "Cuéntanos sobre tu auto" : "Tell us about your car"}
            footer={
                <button
                    type="button"
                    onClick={handleConfirm}
                    className="w-full rounded-full bg-[#D0B078] px-6 py-3 text-sm font-bold text-[#131835] transition-colors hover:bg-[#dcc08d]"
                >
                    {isEs ? "Ver mi precio" : "See my price"}
                </button>
            }
        >
            <p className="mb-5 text-sm text-[#A5B0D1]">
                {isEs
                    ? `Ya elegiste ${getVehicleBodyStyleLabel(bodyStyle, locale)}. Solo nos faltan estos datos para confirmar tu reserva.`
                    : `You picked ${getVehicleBodyStyleLabel(bodyStyle, locale)}. We just need these details to confirm your booking.`}
            </p>
            <div className="space-y-4">
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#A5B0D1]">
                        {isEs ? "Marca" : "Make"}
                        <span className="ml-0.5 text-[#D0B078]">*</span>
                    </label>
                    <input
                        type="text"
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                        placeholder="Toyota, Honda..."
                        className={fieldClass(Boolean(errors.make))}
                    />
                    {errors.make && <p className="mt-1 text-xs text-red-400">{errors.make}</p>}
                </div>
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#A5B0D1]">
                        {isEs ? "Modelo" : "Model"}
                        <span className="ml-0.5 text-[#D0B078]">*</span>
                    </label>
                    <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="Camry, Civic..."
                        className={fieldClass(Boolean(errors.model))}
                    />
                    {errors.model && <p className="mt-1 text-xs text-red-400">{errors.model}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-[#A5B0D1]">
                            {isEs ? "Año" : "Year"}
                            <span className="ml-0.5 text-[#D0B078]">*</span>
                        </label>
                        <input
                            type="text"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            placeholder="2024"
                            className={fieldClass(Boolean(errors.year))}
                        />
                        {errors.year && <p className="mt-1 text-xs text-red-400">{errors.year}</p>}
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-[#A5B0D1]">
                            {isEs ? "Color" : "Color"}
                            <span className="ml-0.5 text-[#D0B078]">*</span>
                        </label>
                        <input
                            type="text"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            placeholder={isEs ? "Blanco, Negro..." : "White, Black..."}
                            className={fieldClass(Boolean(errors.color))}
                        />
                        {errors.color && <p className="mt-1 text-xs text-red-400">{errors.color}</p>}
                    </div>
                </div>
            </div>
        </BottomSheetModal>
    );
}
