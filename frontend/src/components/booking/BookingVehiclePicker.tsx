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
    const [isExpanded, setIsExpanded] = useState(false);
    const [showOneOff, setShowOneOff] = useState(selectedVehicles.length === 0 && Boolean(selectedBodyStyle));
    const panelRef = useRef<HTMLDivElement>(null);
    const changeButtonRef = useRef<HTMLButtonElement>(null);
    const shouldFocusPanel = useRef(false);
    const shouldFocusChange = useRef(false);

    // Stays open until something is actually driving the prices.
    const isOpen = !hasSelection || isExpanded;

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
        shouldFocusChange.current = true;
        onSelectBodyStyle(style);
        setIsExpanded(false);
    };

    return (
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
                                            className={`flex w-[11.5rem] shrink-0 snap-start items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131835] ${
                                                isChecked
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
                                                className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                                                    isChecked
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
                                        ? '¿Un vehículo que no está en tu garaje?'
                                        : 'Vehicle not in your garage?'}
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
    );
}
