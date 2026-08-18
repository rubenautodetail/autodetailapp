"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useBooking, useBookingStatus, Service, AddOn } from "@/contexts";
import { AddOnSelector, PricingSummary, ProgressIndicator } from "@/components/booking";
import { ServiceCard } from "@/components/booking/ServiceCard";
import { Button } from "@/components/ui/Button";
import { getVehicleBodyStyleLabel, normalizeVehicleBodyStyle, type VehicleBodyStyle } from "@/types/vehicle";
import { BookingVehiclePicker, type GarageVehicleOption } from "@/components/booking/BookingVehiclePicker";
import {
    canPreviewServicePrice,
    fetchServicePricePreviews,
    getServicePricePreviewKey,
    type ServicePricePreview,
} from "@/lib/pricing/servicePricePreviews";

interface ServiceSelectionFormProps {
    services: Service[];
    addOns: AddOn[];
    locale: "en" | "es";
    dataSource: "catalog" | "fallback";
    preselectedServiceName?: string;
}

export default function ServiceSelectionForm({
    services,
    addOns,
    locale,
    dataSource,
    preselectedServiceName,
}: ServiceSelectionFormProps) {
    const router = useRouter();
    const { vehicles: garageVehicles } = useBookingStatus();
    const [previewResult, setPreviewResult] = useState<{
        requestKey: string;
        previews: Record<string, ServicePricePreview>;
    }>({ requestKey: '', previews: {} });
    const [previewAttempt, setPreviewAttempt] = useState(0);

    const {
        selectedService,
        selectedAddOns,
        setService,
        addAddOn,
        removeAddOn,
        subtotal,
        serviceFee,
        total,
        currentStep,
        nextStep,
        vehicleInfo,
        bookingVehicles,
        priceQuote,
        quoteStatus,
        quoteError,
        addBookingVehicle,
        removeBookingVehicle,
        replaceBookingVehicles,
        isHydrated,
        selectedBodyStyle,
        setSelectedBodyStyle,
    } = useBooking();

    const activeVehicles = bookingVehicles.length > 0
        ? bookingVehicles
        : vehicleInfo
            ? [vehicleInfo]
            : [];

    const previewVehicles = useMemo(() => {
        if (bookingVehicles.length > 0) {
            return bookingVehicles.map((vehicle) => ({
                vehicleId: vehicle.id,
                bodyStyle: normalizeVehicleBodyStyle(vehicle.type),
            }));
        }
        if (vehicleInfo) {
            return [{
                vehicleId: vehicleInfo.id,
                bodyStyle: normalizeVehicleBodyStyle(vehicleInfo.type),
            }];
        }
        return selectedBodyStyle ? [{ bodyStyle: selectedBodyStyle }] : [];
    }, [bookingVehicles, selectedBodyStyle, vehicleInfo]);

    const hasPricingTarget = previewVehicles.length > 0;
    const pricingTargetLabel = previewVehicles.length === 1
        ? getVehicleBodyStyleLabel(previewVehicles[0].bodyStyle, locale)
        : null;

    const previewRequestKey = useMemo(() => {
        if (!isHydrated || dataSource !== 'catalog' || previewVehicles.length === 0) return '';
        return JSON.stringify({
            services: services.map((service) => getServicePricePreviewKey(service)),
            vehicles: previewVehicles,
            attempt: previewAttempt,
        });
    }, [dataSource, isHydrated, previewAttempt, previewVehicles, services]);

    const servicePricePreviews = previewResult.requestKey === previewRequestKey
        ? previewResult.previews
        : {};
    const previewStatus: 'idle' | 'loading' | 'ready' = !previewRequestKey
        ? 'idle'
        : previewResult.requestKey === previewRequestKey
            ? 'ready'
            : 'loading';

    useEffect(() => {
        if (!previewRequestKey) return;

        const controller = new AbortController();

        void fetchServicePricePreviews(services, previewVehicles, controller.signal)
            .then((previews) => {
                if (controller.signal.aborted) return;
                setPreviewResult({ requestKey: previewRequestKey, previews });
            })
            .catch((error) => {
                if (error instanceof DOMException && error.name === 'AbortError') return;
                setPreviewResult({ requestKey: previewRequestKey, previews: {} });
            });

        return () => controller.abort();
    }, [previewRequestKey, previewVehicles, services]);

    // A vehicle is selected and the fetch settled, but some services came back without a
    // price: those cards are showing the generic base price, which looks identical to a
    // real quote. Never let that pass silently.
    const previewIncomplete = previewStatus === 'ready'
        && Object.keys(servicePricePreviews).length < services.filter(canPreviewServicePrice).length;

    // Auto-select only when the garage leaves no room for ambiguity (exactly one vehicle).
    // With two or more we leave the picker open so the customer says which one they mean —
    // silently pricing the first vehicle is the main source of "why is this the wrong price?".
    useEffect(() => {
        if (!isHydrated || selectedBodyStyle || bookingVehicles.length > 0 || garageVehicles.length !== 1) return;
        const vehicle = garageVehicles[0];
        replaceBookingVehicles([{
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            color: vehicle.color,
            type: normalizeVehicleBodyStyle(vehicle.type),
        }]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingVehicles.length, garageVehicles, isHydrated, selectedBodyStyle]);

    // Checkbox semantics: a detailer visits once, so one appointment can cover
    // several cars. Unchecking the last one goes through removeBookingVehicle,
    // which also clears the fallback body style — otherwise the page would keep
    // pricing a style the customer never explicitly picked.
    const handleToggleGarageVehicle = (vehicle: GarageVehicleOption) => {
        const index = bookingVehicles.findIndex((booked) => booked.id === vehicle.id);
        if (index >= 0) {
            removeBookingVehicle(index);
            return;
        }
        addBookingVehicle({
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            color: vehicle.color,
            type: normalizeVehicleBodyStyle(vehicle.type),
        });
    };

    const handleSelectBodyStyle = (style: VehicleBodyStyle) => {
        if (bookingVehicles.length > 0) replaceBookingVehicles([]);
        setSelectedBodyStyle(style);
    };

    // Auto-select service when arriving via "Book Again" link
    useEffect(() => {
        if (!preselectedServiceName || selectedService) return;
        const decoded = decodeURIComponent(preselectedServiceName);
        const match = services.find(
            (s) => s.name.toLowerCase() === decoded.toLowerCase()
        );
        if (match) setService(match);
    }, [preselectedServiceName, services]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleServiceSelect = (service: Service) => {
        setService(service);
    };

    const handleAddOnToggle = (addOn: AddOn, selected: boolean) => {
        if (selected) {
            addAddOn(addOn);
        } else {
            removeAddOn(addOn.id);
        }
    };

    const handleContinue = () => {
        if (!selectedService || (activeVehicles.length === 0 && !selectedBodyStyle)) return;
        nextStep();
        router.push(`/${locale}/booking/location`);
    };

    const handleBack = () => {
        router.push(`/${locale}/customer`);
    };

    return (
        <div className={`min-h-screen bg-[#131835] pt-8 ${selectedService ? 'pb-44 sm:pb-24' : 'pb-8'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Progress Indicator */}
                <div className="mb-8 sm:mb-12 max-w-3xl mx-auto">
                    <ProgressIndicator currentStep={currentStep} locale={locale} />
                </div>

                {/* Header */}
                <div className="text-center mb-8 sm:mb-12">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                        {locale === "es"
                            ? "Elige Tu Paquete"
                            : "Choose Your Package"}
                    </h1>
                    <p className="text-lg text-[#A5B0D1]">
                        {locale === "es"
                            ? "Selecciona el paquete perfecto para tu vehículo"
                            : "Select the perfect detailing package for your vehicle"}
                    </p>
                    {dataSource === "catalog" && (
                        <p className="text-xs text-green-400 mt-2 opacity-60">
                            {locale === "es" ? "Precios en tiempo real" : "Live Pricing Available"}
                        </p>
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-10">
                    {/* Left column: Services and Add-ons */}
                    <div className="lg:col-span-2 space-y-10">
                        <BookingVehiclePicker
                            locale={locale}
                            garageVehicles={garageVehicles}
                            selectedVehicleIds={bookingVehicles
                                .map((vehicle) => vehicle.id)
                                .filter((id): id is string => Boolean(id))}
                            selectedBodyStyle={bookingVehicles.length > 0 ? null : selectedBodyStyle}
                            onToggleVehicle={handleToggleGarageVehicle}
                            onSelectBodyStyle={handleSelectBodyStyle}
                            isPriceLoading={previewStatus === 'loading'}
                        />

                        {/* Services */}
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {locale === "es" ? "Elige un servicio" : "Choose a service"}
                            </h2>
                            <p className="mb-4 mt-1 text-sm text-[#A5B0D1]">
                                {hasPricingTarget
                                    ? pricingTargetLabel
                                        ? locale === "es"
                                            ? `Precios para ${pricingTargetLabel}.`
                                            : `Prices shown for your ${pricingTargetLabel}.`
                                        : locale === "es"
                                            ? "Precios para los vehículos seleccionados."
                                            : "Prices shown for the selected vehicles."
                                    : locale === "es"
                                        ? "Precios iniciales. Elige tu vehículo arriba para ver el precio exacto."
                                        : "Starting prices. Choose your vehicle above to see exact pricing."}
                            </p>
                            {previewIncomplete && (
                                <div
                                    role="alert"
                                    className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D0B078]/40 bg-[#D0B078]/10 px-4 py-3"
                                >
                                    <p className="text-sm text-white">
                                        {locale === "es"
                                            ? "No pudimos calcular el precio de tu vehículo. Mostrando precios base."
                                            : "We couldn't work out your vehicle's price. Showing base prices."}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewAttempt((attempt) => attempt + 1)}
                                        className="min-h-11 shrink-0 rounded-full border border-[#D0B078] px-4 py-2 text-sm font-semibold text-[#D0B078] transition-colors hover:bg-[#D0B078]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131835]"
                                    >
                                        {locale === "es" ? "Reintentar" : "Try again"}
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {services.map((service) => {
                                    const preview = servicePricePreviews[getServicePricePreviewKey(service)];
                                    const singleStyle = pricingTargetLabel;
                                    const priceCaption = !hasPricingTarget
                                        ? locale === 'es' ? 'Elige tu vehículo para el precio exacto' : 'Choose your vehicle for exact price'
                                        : preview
                                            ? preview.priceSource === 'override' && singleStyle
                                                ? locale === 'es' ? `Precio para ${singleStyle}` : `${singleStyle} price`
                                                : preview.priceSource === 'base' && singleStyle
                                                    ? locale === 'es' ? `${singleStyle} · precio base` : `${singleStyle} · base price`
                                                    : locale === 'es'
                                                        ? `Precio para ${preview.vehicleCount} vehículos`
                                                        : `${preview.vehicleCount}-vehicle price`
                                            : locale === 'es' ? 'Precio base' : 'Base price';

                                    return (
                                        <ServiceCard
                                            key={service.id}
                                            service={service}
                                            isSelected={selectedService?.id === service.id}
                                            onSelect={handleServiceSelect}
                                            locale={locale}
                                            displayPrice={preview?.servicePrice}
                                            priceCaption={priceCaption}
                                            isPriceLoading={previewStatus === 'loading'}
                                            isEstimate={!hasPricingTarget}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Add-ons (only show if service selected) */}
                        {selectedService && (
                            <div className="animate-fade-in-up">
                                <AddOnSelector
                                    addOns={addOns}
                                    selectedAddOns={selectedAddOns}
                                    onAddOnToggle={handleAddOnToggle}
                                    locale={locale}
                                />
                            </div>
                        )}

                        {/* Info Cards */}
                        {selectedService && (
                            <div className="grid md:grid-cols-3 gap-4 pt-4">
                                <div className="bg-[#1A2142] border border-[#2C355E] rounded-[20px] p-5 text-center">
                                    <div className="w-12 h-12 bg-[#D0B078]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold text-white text-sm">
                                        {locale === "es" ? "Pago Seguro" : "Secure Payment"}
                                    </p>
                                </div>

                                <div className="bg-[#1A2142] border border-[#2C355E] rounded-[20px] p-5 text-center">
                                    <div className="w-12 h-12 bg-[#D0B078]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold text-white text-sm">
                                        {locale === "es" ? "Cancelación 24h" : "Cancel 24h Before"}
                                    </p>
                                </div>

                                <div className="bg-[#1A2142] border border-[#2C355E] rounded-[20px] p-5 text-center">
                                    <div className="w-12 h-12 bg-[#D0B078]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold text-white text-sm">
                                        {locale === "es" ? "Garantía de Satisfacción" : "Satisfaction Guaranteed"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right column: Summary (sticky) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-4">
                            {selectedService ? (
                                <div className="animate-fade-in-up">
                                    <PricingSummary
                                        service={{
                                            ...selectedService,
                                            basePrice: priceQuote?.vehicles[0]?.servicePrice ?? selectedService.basePrice,
                                        }}
                                        addOns={selectedAddOns}
                                        subtotal={subtotal}
                                        serviceFee={serviceFee}
                                        total={total}
                                        locale={locale}
                                        onRemoveAddOn={removeAddOn}
                                    />

                                    <div
                                        className="mt-4 rounded-2xl border border-[#2C355E] bg-[#1A2142] p-4"
                                        aria-live="polite"
                                    >
                                        <p className="text-sm font-semibold text-white">
                                            {locale === "es" ? "Total por vehículo" : "Vehicle total"}
                                        </p>
                                        {activeVehicles.length === 0 && !selectedBodyStyle ? (
                                            <p className="mt-2 text-sm text-[#A5B0D1]">
                                                {locale === "es"
                                                    ? "Elige tu vehículo arriba (en «Precios para») para ver el precio exacto."
                                                    : "Choose your vehicle above under “Pricing for” to see the exact price."}
                                            </p>
                                        ) : activeVehicles.length === 0 && selectedBodyStyle ? (
                                            <div className="mt-3 flex items-start justify-between gap-3 text-sm">
                                                <span className="text-[#A5B0D1]">{getVehicleBodyStyleLabel(selectedBodyStyle, locale)}</span>
                                                <div className="text-right">
                                                    <span key={priceQuote?.vehicles[0]?.total ?? 'pending'} className="price-changed font-semibold text-[#D0B078]">{priceQuote?.vehicles[0] ? `$${priceQuote.vehicles[0].total.toFixed(2)}` : "—"}</span>
                                                    {priceQuote?.vehicles[0] && (
                                                        <p className="mt-0.5 text-[11px] text-[#A5B0D1]">
                                                            {priceQuote.vehicles[0].priceSource === 'override'
                                                                ? locale === 'es' ? 'Precio personalizado' : 'Custom body-style price'
                                                                : locale === 'es' ? 'Usando el precio base' : 'Using base price'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-3 space-y-2">
                                                {activeVehicles.map((vehicle, index) => {
                                                    const line = priceQuote?.vehicles[index];
                                                    const style = normalizeVehicleBodyStyle(vehicle.type);
                                                    return (
                                                        <div key={vehicle.id ?? `${vehicle.year}-${vehicle.make}-${vehicle.model}-${index}`} className="flex items-start justify-between gap-3 text-sm">
                                                            <div>
                                                                <p className="font-medium text-white">
                                                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                                                </p>
                                                                <p className="text-xs text-[#A5B0D1]">
                                                                    {getVehicleBodyStyleLabel(style, locale)}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span key={line?.total ?? 'pending'} className="price-changed font-semibold text-[#D0B078]">
                                                                    {line ? `$${line.total.toFixed(2)}` : "—"}
                                                                </span>
                                                                {line && (
                                                                    <p className="mt-0.5 text-[11px] text-[#A5B0D1]">
                                                                        {line.priceSource === 'override'
                                                                            ? locale === 'es' ? 'Personalizado' : 'Custom price'
                                                                            : locale === 'es' ? 'Precio base' : 'Base price'}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {quoteStatus === "loading" && (
                                            <p className="mt-3 text-xs text-[#A5B0D1]">
                                                {locale === "es" ? "Actualizando precio…" : "Updating price…"}
                                            </p>
                                        )}
                                        {quoteError && (
                                            <p role="alert" className="mt-3 text-xs text-red-400">
                                                {locale === "es" ? "No pudimos actualizar el precio. Intenta de nuevo." : "We couldn't refresh pricing. Please try again."}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-6 space-y-3">
                                        <Button
                                            fullWidth
                                            variant="primary"
                                            onClick={handleContinue}
                                            disabled={activeVehicles.length === 0 && !selectedBodyStyle}
                                        >
                                            {locale === "es" ? "Continuar a Ubicación" : "Continue to Location"}
                                            <svg
                                                className="inline-block ml-2 w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                                />
                                            </svg>
                                        </Button>

                                        {!hasPricingTarget && (
                                            <p className="text-center text-xs font-medium text-[#D0B078]">
                                                {locale === "es"
                                                    ? "Elige tu vehículo arriba para continuar."
                                                    : "Choose your vehicle above to continue."}
                                            </p>
                                        )}

                                        <Button
                                            fullWidth
                                            variant="secondary"
                                            onClick={handleBack}
                                        >
                                            {locale === "es" ? "Volver a Inicio" : "Back to Home"}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#1A2142] border border-[#2C355E] rounded-[24px] p-8 text-center">
                                    <div className="w-20 h-20 bg-[#2C355E] rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-[#8994B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-xl text-white font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                                        {locale === "es" ? "Selecciona un Servicio" : "Select a Service"}
                                    </p>
                                    <p className="text-[#A5B0D1] leading-relaxed">
                                        {locale === "es"
                                            ? "Elige uno de los servicios arriba para comenzar con tu reserva."
                                            : "Choose one of the services above to begin your booking."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Cart (Appears when service is selected) */}
            {selectedService && (
                <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 md:left-auto md:right-8 z-40 animate-fade-in-up md:w-96 shadow-2xl">
                    <div className="bg-[#1A2142] border border-[#D0B078]/50 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between w-full md:w-auto md:flex-col md:items-start md:gap-1">
                            <div>
                                <p className="text-sm font-semibold text-white">
                                    {selectedService.name}
                                </p>
                                <p className="text-xs text-[#A5B0D1]">
                                    {!hasPricingTarget
                                        ? locale === "es" ? "Falta elegir el vehículo" : "Choose your vehicle first"
                                        : selectedAddOns.length > 0
                                            ? `${selectedAddOns.length} ${locale === "es" ? "Extras" : "Add-ons"}`
                                            : locale === "es" ? "Sin extras" : "No add-ons"}
                                </p>
                            </div>
                            <div className="text-right md:text-left">
                                <p className="text-xs text-[#A5B0D1] uppercase tracking-wider">
                                    {locale === "es" ? "Total de la reserva" : "Booking total"}
                                </p>
                                <p className="text-xl font-bold text-[#D0B078]">
                                    ${(Number(total) || 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleContinue}
                            disabled={activeVehicles.length === 0 && !selectedBodyStyle}
                            className="w-full md:w-auto whitespace-nowrap"
                        >
                            {locale === "es" ? "Continuar" : "Continue"}
                            <svg className="inline-block ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
