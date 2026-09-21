'use client';

/**
 * BookingVehiclePicker
 *
 * One control that answers "which vehicles are we pricing?" for both audiences:
 * - Returning customers check any of their garage vehicles (a detailer visits
 *   once, so one appointment can cover several cars) or price a one-off vehicle.
 * - First-time customers pick a body style, then the picker collapses into the
 *   same compact summary a returning customer sees.
 *
 * Prices elsewhere on the page are driven by whatever is selected here, so the
 * collapsed state always names every vehicle the prices belong to.
 */

import { useEffect, useRef, useState } from 'react';
import { useBooking, useBookingStatus } from '@/contexts';
import { Check, Pencil } from 'lucide-react';
import {
    getVehicleBodyStyleLabel,
    normalizeVehicleBodyStyle,
    type VehicleBodyStyle,
} from '@/types/vehicle';
import { VehicleBodyStyleArtwork } from '@/components/vehicles/VehicleBodyStyleArtwork';
import { VehicleBodyStyleSelector } from '@/components/vehicles/VehicleBodyStyleSelector';

export interface GarageVehicleOption {
    id: string;
    make: string;
    model: string;
    year: string;
    color: string;
    type: string;
}

interface BookingVehiclePickerProps {
    locale: 'en' | 'es';
    garageVehicles: GarageVehicleOption[];
    /** Garage vehicles currently driving pricing (checkbox semantics). */
    selectedVehicleIds: string[];
    /** Body style currently driving pricing when no garage vehicle is selected. */
    selectedBodyStyle: VehicleBodyStyle | null;
    onToggleVehicle: (vehicle: GarageVehicleOption) => void;
    onSelectBodyStyle: (style: VehicleBodyStyle) => void;
    isPriceLoading?: boolean;
}

export function BookingVehiclePicker({
    locale,
    garageVehicles,
    selectedVehicleIds,
    selectedBodyStyle,
    onToggleVehicle,
    onSelectBodyStyle,
    isPriceLoading = false,
}: BookingVehiclePickerProps) {
    const isEs = locale === 'es';
    const selectedVehicles = garageVehicles.filter((vehicle) => selectedVehicleIds.includes(vehicle.id));
    const hasSelection = selectedVehicles.length > 0 || Boolean(selectedBodyStyle);
    const [isExpanded, setIsExpanded] = useState(true);
    const [showOneOff, setShowOneOff] = useState(selectedVehicles.length === 0 && Boolean(selectedBodyStyle));
    const panelRef = useRef<HTMLDivElement>(null);
    const changeButtonRef = useRef<HTMLButtonElement>(null);
    const shouldFocusPanel = useRef(false);
    const shouldFocusChange = useRef(false);
    const { addBookingVehicle } = useBooking();
    const { addVehicle: addGarageVehicle } = useBookingStatus();
    const [saveNewVehicleToGarage, setSaveNewVehicleToGarage] = useState(true);
    const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
    const [newVehicleMake, setNewVehicleMake] = useState('');
    const [newVehicleModel, setNewVehicleModel] = useState('');
    const [newVehicleYear, setNewVehicleYear] = useState('');
    const [newVehicleColor, setNewVehicleColor] = useState('');
    const [newVehicleType, setNewVehicleType] = useState<VehicleBodyStyle | null>(null);
    const [newVehicleErrors, setNewVehicleErrors] = useState<Record<string, string>>({});

    const handleAddNewVehicleInline = async () => {
        const errors: Record<string, string> = {};
        if (!newVehicleMake.trim()) errors.make = isEs ? 'Marca requerida' : 'Make required';
        if (!newVehicleModel.trim()) errors.model = isEs ? 'Modelo requerido' : 'Model required';
        if (!newVehicleYear.trim()) errors.year = isEs ? 'Año requerido' : 'Year required';
        if (!newVehicleColor.trim()) errors.color = isEs ? 'Color requerido' : 'Color required';
        if (!newVehicleType) errors.type = isEs ? 'Tipo de carrocería requerido' : 'Body style required';
        if (Object.keys(errors).length > 0) { setNewVehicleErrors(errors); return; }

        const confirmedType = newVehicleType as VehicleBodyStyle;
        addBookingVehicle({ make: newVehicleMake, model: newVehicleModel, year: newVehicleYear, color: newVehicleColor, type: confirmedType });

        if (saveNewVehicleToGarage) {
            try {
                await addGarageVehicle({
                    make: newVehicleMake,
                    model: newVehicleModel,
                    year: newVehicleYear,
                    color: newVehicleColor,
                    type: confirmedType,
                    licensePlate: '',
                });
            } catch { /* ignore */ }
        }

        setNewVehicleMake('');
        setNewVehicleModel('');
        setNewVehicleYear('');
        setNewVehicleColor('');
        setNewVehicleType(null);
        setNewVehicleErrors({});
        setShowNewVehicleForm(false);
    };

    // Stays open until the user manually collapses it with the pencil/check button.
    const isOpen = isExpanded;

    // Keep the keyboard user where they expect to be: in the panel when it opens,
    // on the summary's Change button when a choice collapses it.
    useEffect(() => {
        if (isOpen && shouldFocusPanel.current) {
            panelRef.current?.focus();
            shouldFocusPanel.current = false;
        }
        if (!isOpen && shouldFocusChange.current) {
            changeButtonRef.current?.focus();
            shouldFocusChange.current = false;
        }
    }, [isOpen]);

    const activeStyle: VehicleBodyStyle | null = selectedVehicles[0]
        ? normalizeVehicleBodyStyle(selectedVehicles[0].type)
        : selectedBodyStyle;

    const handleVehicleToggle = (vehicle: GarageVehicleOption) => {
        // Checking one car doesn't collapse the panel: the whole point of
        // checkboxes is that a second tap may be coming. Done closes it.
        setIsExpanded(true);
        setShowOneOff(false);
        onToggleVehicle(vehicle);
    };

    const handleBodyStyleSelect = (style: VehicleBodyStyle) => {
        onSelectBodyStyle(style);
    };

    return (
        <>
            <div className="mb-4 rounded-[20px] border border-dashed border-[#D0B078]/50 bg-[#D0B078]/5 p-4 sm:p-5">
                {!showNewVehicleForm ? (
                    <button
                        type="button"
                        onClick={() => setShowNewVehicleForm(true)}
                        className="flex w-full items-center justify-center gap-2 text-sm font-bold text-[#D0B078] hover:text-white transition-colors"
                    >
                        <span className="text-lg leading-none">+</span>
                        {isEs ? 'Agregar otro vehículo' : 'Add another vehicle'}
                    </button>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">{isEs ? 'Nuevo Vehículo' : 'New Vehicle'}</p>
                            <button type="button" onClick={() => setShowNewVehicleForm(false)} className="text-[#8994B8] hover:text-white transition-colors">
                                ✕
                            </button>
                        </div>
                        <VehicleBodyStyleSelector
                            locale={locale}
                            appearance="dark"
                            layout="carousel"
                            value={newVehicleType}
                            onChange={setNewVehicleType}
                            name="new-vehicle-inline-body-style"
                            required
                        />
                        {newVehicleType && (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[#A5B0D1]">
                                        {isEs ? 'Marca' : 'Make'}<span className="ml-0.5 text-[#D0B078]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newVehicleMake}
                                        onChange={(e) => setNewVehicleMake(e.target.value)}
                                        placeholder="Toyota, Honda..."
                                        className={`w-full rounded-lg border bg-[#131835] px-3 py-2.5 text-sm text-white placeholder:text-[#8994B8] focus:outline-none focus:ring-2 focus:ring-[#D0B078] ${newVehicleErrors.make ? 'border-red-500/50' : 'border-[#2C355E]'}`}
                                    />
                                    {newVehicleErrors.make && <p className="mt-1 text-xs text-red-400">{newVehicleErrors.make}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[#A5B0D1]">
                                        {isEs ? 'Modelo' : 'Model'}<span className="ml-0.5 text-[#D0B078]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newVehicleModel}
                                        onChange={(e) => setNewVehicleModel(e.target.value)}
                                        placeholder="Camry, Civic..."
                                        className={`w-full rounded-lg border bg-[#131835] px-3 py-2.5 text-sm text-white placeholder:text-[#8994B8] focus:outline-none focus:ring-2 focus:ring-[#D0B078] ${newVehicleErrors.model ? 'border-red-500/50' : 'border-[#2C355E]'}`}
                                    />
                                    {newVehicleErrors.model && <p className="mt-1 text-xs text-red-400">{newVehicleErrors.model}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[#A5B0D1]">
                                        {isEs ? 'Año' : 'Year'}<span className="ml-0.5 text-[#D0B078]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newVehicleYear}
                                        onChange={(e) => setNewVehicleYear(e.target.value)}
                                        placeholder="2024"
                                        maxLength={4}
                                        className={`w-full rounded-lg border bg-[#131835] px-3 py-2.5 text-sm text-white placeholder:text-[#8994B8] focus:outline-none focus:ring-2 focus:ring-[#D0B078] ${newVehicleErrors.year ? 'border-red-500/50' : 'border-[#2C355E]'}`}
                                    />
                                    {newVehicleErrors.year && <p className="mt-1 text-xs text-red-400">{newVehicleErrors.year}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[#A5B0D1]">
                                        {isEs ? 'Color' : 'Color'}<span className="ml-0.5 text-[#D0B078]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newVehicleColor}
                                        onChange={(e) => setNewVehicleColor(e.target.value)}
                                        placeholder={isEs ? 'Blanco, Negro...' : 'White, Black...'}
                                        className={`w-full rounded-lg border bg-[#131835] px-3 py-2.5 text-sm text-white placeholder:text-[#8994B8] focus:outline-none focus:ring-2 focus:ring-[#D0B078] ${newVehicleErrors.color ? 'border-red-500/50' : 'border-[#2C355E]'}`}
                                    />
                                    {newVehicleErrors.color && <p className="mt-1 text-xs text-red-400">{newVehicleErrors.color}</p>}
                                </div>
                            </div>
                        )}
                        <label className="flex items-center gap-2 text-xs text-[#A5B0D1]">
                            <input
                                type="checkbox"
                                checked={saveNewVehicleToGarage}
                                onChange={(e) => setSaveNewVehicleToGarage(e.target.checked)}
                                className="h-4 w-4 rounded border-[#2C355E] bg-[#131835] text-[#D0B078] focus:ring-[#D0B078]"
                            />
                            {isEs ? 'Guardar en mi garaje' : 'Save to my garage'}
                        </label>

                        <button
                            type="button"
                            onClick={handleAddNewVehicleInline}
                            className="w-full rounded-xl bg-[#D0B078] py-2.5 text-sm font-bold text-[#131835] transition-all hover:bg-[#C4A060]"
                        >
                            {isEs ? 'Agregar Vehículo' : 'Add Vehicle'}
                        </button>
                    </div>
                )}
            </div>

            <section
                aria-labelledby="booking-vehicle-picker-heading"
                className="rounded-[20px] border border-[#2C355E] bg-[#151B3A] p-4 sm:p-5"
            >
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2
                            id="booking-vehicle-picker-heading"
                            className="text-xs font-bold uppercase tracking-[0.14em] text-[#D0B078]"
                        >
                            {isEs ? 'Precios para' : 'Pricing for'}
                        </h2>

                        {hasSelection ? (
                            selectedVehicles.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                    {selectedVehicles.map((vehicle) => {
                                        const style = normalizeVehicleBodyStyle(vehicle.type);
                                        return (
                                            <div key={vehicle.id} className="flex items-center gap-3">
                                                <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.06] bg-[radial-gradient(circle_at_50%_28%,rgba(208,176,120,0.16),rgba(8,12,27,0.2)_72%)]">
                                                    <VehicleBodyStyleArtwork
                                                        style={style}
                                                        locale={locale}
                                                        className="h-9 w-full min-w-0 shrink-0"
                                                    />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-white">
                                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-[#A5B0D1]">
                                                        {getVehicleBodyStyleLabel(style, locale)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="mt-2 flex items-center gap-3">
                                    {activeStyle && (
                                        <span className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.06] bg-[radial-gradient(circle_at_50%_28%,rgba(208,176,120,0.16),rgba(8,12,27,0.2)_72%)]">
                                            <VehicleBodyStyleArtwork
                                                style={activeStyle}
                                                locale={locale}
                                                className="h-10 w-full min-w-0 shrink-0"
                                            />
                                        </span>
                                    )}
                                    <div className="min-w-0">
                                        <p className="truncate text-base font-bold text-white">
                                            {activeStyle ? getVehicleBodyStyleLabel(activeStyle, locale) : ''}
                                        </p>
                                        <p className="mt-0.5 text-xs text-[#A5B0D1]">
                                            {isEs ? 'Vehículo de esta reserva' : 'This booking’s vehicle'}
                                        </p>
                                        <p className="mt-1 text-xs text-[#8994B8]">
                                            {isEs
                                                ? '¿Más de un vehículo? Podrás agregar los demás en el paso de revisión.'
                                                : 'Booking more than one vehicle? You can add the rest at the review step.'}
                                        </p>
                                    </div>
                                </div>
                            )
                        ) : (
                            garageVehicles.length > 0 && (
                                <p className="mt-2 max-w-md text-sm text-[#A5B0D1]">
                                    {isEs
                                        ? 'Elige los vehículos de esta reserva para ver sus precios exactos.'
                                        : 'Pick the vehicles for this booking to see their exact prices.'}
                                </p>
                            )
                        )}
                    </div>

                    {hasSelection && (
                        <button
                            type="button"
                            ref={changeButtonRef}
                            onClick={() => {
                                shouldFocusPanel.current = true;
                                setIsExpanded((prev) => !prev);
                            }}
                            aria-expanded={isOpen}
                            aria-controls="booking-vehicle-picker-panel"
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#D0B078]/40 min-h-11 px-4 py-2 text-sm font-semibold text-[#D0B078] transition-colors hover:bg-[#D0B078]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131835]"
                        >
                            {isOpen
                                ? <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                : <Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
                            {isOpen
                                ? `${isEs ? 'Listo' : 'Done'}${selectedVehicles.length > 0 ? ` (${selectedVehicles.length})` : ''}`
                                : isEs ? 'Cambiar' : 'Change'}
                        </button>
                    )}
                </div>

                <p className="sr-only" aria-live="polite">
                    {isPriceLoading
                        ? isEs ? 'Actualizando precios…' : 'Updating prices…'
                        : selectedVehicles.length > 1
                            ? isEs
                                ? `Precios actualizados para ${selectedVehicles.length} vehículos.`
                                : `Prices updated for ${selectedVehicles.length} vehicles.`
                            : activeStyle
                                ? isEs
                                    ? `Precios actualizados para ${getVehicleBodyStyleLabel(activeStyle, locale)}.`
                                    : `Prices updated for ${getVehicleBodyStyleLabel(activeStyle, locale)}.`
                                : ''}
                </p>

                {isOpen && (
                    <div
                        id="booking-vehicle-picker-panel"
                        ref={panelRef}
                        tabIndex={-1}
                        className="mt-5 focus:outline-none"
                    >
                        {garageVehicles.length > 0 && (
                            <div className="mb-5">
                                <p className="text-base font-bold text-white">
                                    {isEs ? 'Tu garaje' : 'Your garage'}
                                </p>
                                {garageVehicles.length > 1 && (
                                    <p className="mt-1 text-sm text-[#A5B0D1]">
                                        {isEs
                                            ? 'Selecciona cada vehículo para esta cita.'
                                            : 'Select each vehicle for this appointment.'}
                                    </p>
                                )}
                                <div
                                    role="group"
                                    aria-label={isEs ? 'Vehículos guardados' : 'Saved vehicles'}
                                    className="mt-3 flex gap-2.5 overflow-x-auto snap-x snap-mandatory overscroll-x-contain pb-1 [&::-webkit-scrollbar]:hidden"
                                    style={{ scrollbarWidth: 'none' }}
                                >
                                    {garageVehicles.map((vehicle) => {
                                        const style = normalizeVehicleBodyStyle(vehicle.type);
                                        const isChecked = selectedVehicleIds.includes(vehicle.id);

                                        return (
                                            <button
                                                key={vehicle.id}
                                                type="button"
                                                role="checkbox"
                                                aria-checked={isChecked}
                                                onClick={() => handleVehicleToggle(vehicle)}
                                                className={`flex w-[11.5rem] shrink-0 snap-start items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131835] ${isChecked
                                                    ? 'border-[#D0B078] bg-[#D0B078]/10'
                                                    : 'border-[#2C355E] bg-[#1A2142] hover:border-[#D0B078]/60'
                                                    }`}
                                            >
                                                <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.06] bg-[radial-gradient(circle_at_50%_28%,rgba(208,176,120,0.16),rgba(8,12,27,0.2)_72%)]">
                                                    <VehicleBodyStyleArtwork
                                                        style={style}
                                                        locale={locale}
                                                        className="h-9 w-full min-w-0 shrink-0"
                                                    />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block truncate text-xs font-bold text-white">
                                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                                    </span>
                                                    <span className="mt-0.5 block text-[11px] text-[#A5B0D1]">
                                                        {getVehicleBodyStyleLabel(style, locale)}
                                                    </span>
                                                </span>
                                                <span
                                                    aria-hidden="true"
                                                    className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-sm font-black ${isChecked
                                                        ? 'bg-[#D0B078] text-[#131835]'
                                                        : 'border-2 border-[#4A5580]'
                                                        }`}
                                                >
                                                    {isChecked ? '✓' : ''}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>


                                {!showOneOff && (
                                    <button
                                        type="button"
                                        onClick={() => setShowOneOff(true)}
                                        className="mt-3 text-sm font-semibold text-[#D0B078] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131835]"
                                    >
                                        {isEs
                                            ? 'Vista previa de precio para otro tipo de vehículo'
                                            : 'Preview pricing for another vehicle type'}
                                    </button>
                                )}

                            </div>
                        )}

                        {(garageVehicles.length === 0 || showOneOff) && (
                            <div className={garageVehicles.length > 0 ? 'border-t border-[#2C355E] pt-5' : ''}>
                                <VehicleBodyStyleSelector
                                    locale={locale}
                                    appearance="dark"
                                    layout="carousel"
                                    value={selectedVehicles.length > 0 ? null : selectedBodyStyle}
                                    onChange={handleBodyStyleSelect}
                                    name="booking-vehicle-body-style"
                                    required={garageVehicles.length === 0}
                                    legend={garageVehicles.length > 0
                                        ? isEs ? 'Otro vehículo' : 'A different vehicle'
                                        : undefined}
                                    description={garageVehicles.length > 0
                                        ? isEs
                                            ? 'Esto cotiza la reserva por estilo, en lugar de tus vehículos guardados.'
                                            : 'This prices the booking by body style instead of your saved vehicles.'
                                        : isEs
                                            ? 'Elige la opción más parecida. Los precios de abajo se actualizan al instante.'
                                            : 'Choose the closest match. Prices below update instantly.'}
                                />
                            </div>
                        )}
                    </div>
                )}
            </section>
        </>
    );
}
