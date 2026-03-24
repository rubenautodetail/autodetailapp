"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBooking, Service, AddOn } from "@/contexts";
import { AddOnSelector, PricingSummary } from "@/components/booking";
import { ServiceCard } from "@/components/booking/ServiceCard";
import { Button } from "@/components/ui/Button";

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
    } = useBooking();

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
        if (!selectedService) return;
        nextStep();
        router.push(`/${locale}/booking/location`);
    };

    const handleBack = () => {
        router.push(`/${locale}/customer`);
    };

    return (
        <div className="min-h-screen bg-[#131835] py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Progress Indicator */}
                <div className="mb-12">
                    <div className="flex items-center justify-between max-w-3xl mx-auto">
                        {[1, 2, 3, 4, 5].map((step) => (
                            <div key={step} className="flex items-center w-full relative">
                                <div
                                    className={`
                                        z-10 w-10 h-10 rounded-full flex items-center justify-center
                                        font-bold text-sm transition-all duration-300
                                        ${currentStep >= step
                                            ? "bg-[#D0B078] text-[#131835] shadow-[0_0_15px_rgba(208,176,120,0.4)]"
                                            : "bg-[var(--divider)] text-[var(--text-muted)]"
                                        }
                                    `}
                                >
                                    {step}
                                </div>
                                {step < 5 && (
                                    <div
                                        className={`
                                            absolute left-5 right-0 top-1/2 -mt-[2px] h-1 transition-colors duration-300
                                            ${currentStep > step ? "bg-[#D0B078]" : "bg-[var(--divider)]"}
                                        `}
                                        style={{ width: 'calc(100% - 1.25rem)' }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between max-w-3xl mx-auto mt-3 text-xs uppercase tracking-wider font-semibold">
                        <span className="text-[#D0B078]">{locale === "es" ? "Servicio" : "Service"}</span>
                        <span className="text-[var(--text-muted)]">{locale === "es" ? "Ubicación" : "Location"}</span>
                        <span className="text-[var(--text-muted)]">{locale === "es" ? "Horario" : "Schedule"}</span>
                        <span className="text-[var(--text-muted)]">{locale === "es" ? "Revisar" : "Review"}</span>
                        <span className="text-[var(--text-muted)]">{locale === "es" ? "Pago" : "Payment"}</span>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                        {locale === "es"
                            ? "Elige Tu Paquete"
                            : "Choose Your Package"}
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)]">
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
                        {/* Services */}
                        <div>
                            <div className="grid md:grid-cols-3 gap-6">
                                {services.map((service) => (
                                    <ServiceCard
                                        key={service.id}
                                        service={service}
                                        isSelected={selectedService?.id === service.id}
                                        onSelect={handleServiceSelect}
                                        locale={locale}
                                    />
                                ))}
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
                                <div className="bg-[var(--card)] border border-[var(--divider)] rounded-[20px] p-5 text-center">
                                    <div className="w-12 h-12 bg-[#D0B078]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold text-[var(--text-primary)] text-sm">
                                        {locale === "es" ? "Pago Seguro" : "Secure Payment"}
                                    </p>
                                </div>

                                <div className="bg-[var(--card)] border border-[var(--divider)] rounded-[20px] p-5 text-center">
                                    <div className="w-12 h-12 bg-[#D0B078]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold text-[var(--text-primary)] text-sm">
                                        {locale === "es" ? "Cancelación 24h" : "Cancel 24h Before"}
                                    </p>
                                </div>

                                <div className="bg-[var(--card)] border border-[var(--divider)] rounded-[20px] p-5 text-center">
                                    <div className="w-12 h-12 bg-[#D0B078]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold text-[var(--text-primary)] text-sm">
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
                                        service={selectedService}
                                        addOns={selectedAddOns}
                                        subtotal={subtotal}
                                        serviceFee={serviceFee}
                                        total={total}
                                        locale={locale}
                                    />

                                    <div className="mt-6 space-y-3">
                                        <Button
                                            fullWidth
                                            variant="primary"
                                            onClick={handleContinue}
                                        >
                                            {locale === "es" ? "Continuar a Horario" : "Continue to Schedule"}
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
                                <div className="bg-[var(--card)] border border-[var(--divider)] rounded-[24px] p-8 text-center">
                                    <div className="w-20 h-20 bg-[var(--divider)] rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-xl text-[var(--text-primary)] font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                                        {locale === "es" ? "Selecciona un Servicio" : "Select a Service"}
                                    </p>
                                    <p className="text-[var(--text-secondary)] leading-relaxed">
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
                <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-8 z-50 animate-fade-in-up md:w-96 shadow-2xl">
                    <div className="bg-[#1A2142] border border-[#D0B078]/50 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between w-full md:w-auto md:flex-col md:items-start md:gap-1">
                            <div>
                                <p className="text-sm font-semibold text-white">
                                    {selectedService.name}
                                </p>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    {selectedAddOns.length > 0
                                        ? `${selectedAddOns.length} ${locale === "es" ? "Extras" : "Add-ons"}`
                                        : locale === "es" ? "Sin extras" : "No add-ons"}
                                </p>
                            </div>
                            <div className="text-right md:text-left">
                                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">
                                    {locale === "es" ? "Total" : "Total"}
                                </p>
                                <p className="text-xl font-bold text-[#D0B078]">
                                    ${total.toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleContinue}
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
