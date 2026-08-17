'use client';

/**
 * BookingVehiclePicker
 *
 * One control that answers "which vehicle are we pricing?" for both audiences:
 * - Returning customers pick from their garage (or price a one-off vehicle).
 * - First-time customers pick a body style, then the picker collapses into the
 *   same compact summary a returning customer sees.
 *
 * Prices elsewhere on the page are driven by whatever is selected here, so the
 * collapsed state always names the vehicle the prices belong to.
 */

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Pencil } from 'lucide-react';
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
    /** Garage vehicle currently driving pricing, if any. */
    selectedVehicleId: string | null;
    /** Body style currently driving pricing when no garage vehicle is selected. */
    selectedBodyStyle: VehicleBodyStyle | null;
    onSelectVehicle: (vehicle: GarageVehicleOption) => void;
    onSelectBodyStyle: (style: VehicleBodyStyle) => void;
    isPriceLoading?: boolean;
}

export function BookingVehiclePicker({
    locale,
    garageVehicles,
    selectedVehicleId,
    selectedBodyStyle,
    onSelectVehicle,
    onSelectBodyStyle,
    isPriceLoading = false,
}: BookingVehiclePickerProps) {
    const isEs = locale === 'es';
    const selectedVehicle = garageVehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null;
    const hasSelection = Boolean(selectedVehicle || selectedBodyStyle);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showOneOff, setShowOneOff] = useState(!selectedVehicle && Boolean(selectedBodyStyle));
    const panelRef = useRef<HTMLDivElement>(null);
    const changeButtonRef = useRef<HTMLButtonElement>(null);
    const garageRefs = useRef<(HTMLButtonElement | null)[]>([]);
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

    const activeStyle: VehicleBodyStyle | null = selectedVehicle
        ? normalizeVehicleBodyStyle(selectedVehicle.type)
        : selectedBodyStyle;

    const handleVehicleSelect = (vehicle: GarageVehicleOption) => {
        shouldFocusChange.current = true;
        onSelectVehicle(vehicle);
        setShowOneOff(false);
        setIsExpanded(false);
    };

    const handleBodyStyleSelect = (style: VehicleBodyStyle) => {
        shouldFocusChange.current = true;
        onSelectBodyStyle(style);
        setIsExpanded(false);
    };

    // Native radios give the body-style grid arrow-key nav for free; the garage
    // cards are buttons, so they need it wired by hand to match the role we claim.
    const handleGarageKeyDown = (event: ReactKeyboardEvent, index: number) => {
        const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();

        const last = garageVehicles.length - 1;
        const next = event.key === 'Home'
            ? 0
            : event.key === 'End'
                ? last
                : event.key === 'ArrowRight' || event.key === 'ArrowDown'
                    ? (index + 1) % garageVehicles.length
                    : (index - 1 + garageVehicles.length) % garageVehicles.length;

        garageRefs.current[next]?.focus();
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
                                    {selectedVehicle
                                        ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`
                                        : activeStyle
                                            ? getVehicleBodyStyleLabel(activeStyle, locale)
                                            : ''}
                                </p>
                                <p className="mt-0.5 text-xs text-[#A5B0D1]">
                                    {selectedVehicle && activeStyle
                                        ? getVehicleBodyStyleLabel(activeStyle, locale)
                                        : isEs
                                            ? 'Vehículo de esta reserva'
                                            : 'This booking’s vehicle'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        garageVehicles.length > 0 && (
                            <p className="mt-2 max-w-md text-sm text-[#A5B0D1]">
                                {isEs
                                    ? 'Elige el vehículo de esta reserva para ver sus precios exactos.'
                                    : 'Pick the vehicle for this booking to see its exact prices.'}
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
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        {isOpen
                            ? isEs ? 'Cerrar' : 'Done'
                            : isEs ? 'Cambiar' : 'Change'}
                    </button>
                )}
            </div>

            <p className="sr-only" aria-live="polite">
                {isPriceLoading
                    ? isEs ? 'Actualizando precios…' : 'Updating prices…'
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
                            <div
                                role="radiogroup"
                                aria-label={isEs ? 'Vehículos guardados' : 'Saved vehicles'}
                                className="mt-3 grid gap-2.5 sm:grid-cols-2"
                            >
                                {garageVehicles.map((vehicle, index) => {
                                    const style = normalizeVehicleBodyStyle(vehicle.type);
                                    const isActive = vehicle.id === selectedVehicleId;
                                    const isTabStop = selectedVehicleId ? isActive : index === 0;

                                    return (
                                        <button
                                            key={vehicle.id}
                                            ref={(node) => { garageRefs.current[index] = node; }}
                                            type="button"
                                            role="radio"
                                            aria-checked={isActive}
                                            tabIndex={isTabStop ? 0 : -1}
                                            onKeyDown={(event) => handleGarageKeyDown(event, index)}
                                            onClick={() => handleVehicleSelect(vehicle)}
                                            className={`flex items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131835] ${
                                                isActive
                                                    ? 'border-[#D0B078] bg-[#D0B078]/10'
                                                    : 'border-[#2C355E] bg-[#1A2142] hover:border-[#D0B078]/60'
                                            }`}
                                        >
                                            <span className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.06] bg-[radial-gradient(circle_at_50%_28%,rgba(208,176,120,0.16),rgba(8,12,27,0.2)_72%)]">
                                                <VehicleBodyStyleArtwork
                                                    style={style}
                                                    locale={locale}
                                                    className="h-11 w-full min-w-0 shrink-0"
                                                />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-bold text-white">
                                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                                </span>
                                                <span className="mt-0.5 block text-xs text-[#A5B0D1]">
                                                    {getVehicleBodyStyleLabel(style, locale)}
                                                </span>
                                            </span>
                                            {isActive && (
                                                <span
                                                    aria-hidden="true"
                                                    className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D0B078] text-sm font-black text-[#131835]"
                                                >
                                                    ✓
                                                </span>
                                            )}
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
                                        ? 'Reservar para otro vehículo'
                                        : 'Booking for a different vehicle?'}
                                </button>
                            )}
                        </div>
                    )}

                    {(garageVehicles.length === 0 || showOneOff) && (
                        <div className={garageVehicles.length > 0 ? 'border-t border-[#2C355E] pt-5' : ''}>
                            <VehicleBodyStyleSelector
                                locale={locale}
                                appearance="dark"
                                value={selectedVehicle ? null : selectedBodyStyle}
                                onChange={handleBodyStyleSelect}
                                name="booking-vehicle-body-style"
                                required={garageVehicles.length === 0}
                                legend={garageVehicles.length > 0
                                    ? isEs ? 'Otro vehículo' : 'A different vehicle'
                                    : undefined}
                                description={garageVehicles.length > 0
                                    ? isEs
                                        ? 'Elige su estilo para ver el precio de esta reserva.'
                                        : 'Pick its body style to price this booking.'
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
