"use client";

import { useRouter } from "next/navigation";
import { useBooking, Service, AddOn } from "@/contexts";
import { AddOnSelector, PricingSummary } from "@/components/booking";
import { ServiceCard } from "@/components/booking/ServiceCard";

interface ServiceSelectionFormProps {
    services: Service[];
    addOns: AddOn[];
    locale: "en" | "es";
    dataSource: "strapi" | "fallback";
}

export default function ServiceSelectionForm({
    services,
    addOns,
    locale,
    dataSource,
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

    // No need for local state for services/addOns as they are passed as props

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
        // Go back to homepage
        router.push(`/${locale}`);
    };

    return (
        <div className="min-h-screen bg-bg-primary py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Progress Indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between max-w-3xl mx-auto">
                        {[1, 2, 3, 4, 5].map((step) => (
                            <div key={step} className="flex items-center">
                                <div
                                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    font-semibold text-sm transition-colors
                    ${currentStep >= step
                                            ? "bg-accent-gold text-bg-primary"
                                            : "bg-white/10 text-text-muted"
                                        }
                  `}
                                >
                                    {step}
                                </div>
                                {step < 5 && (
                                    <div
                                        className={`
                      w-12 h-1 mx-2 transition-colors
                      ${currentStep > step ? "bg-accent-gold" : "bg-white/10"}
                    `}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between max-w-3xl mx-auto mt-2 text-xs text-text-muted">
                        <span className="font-semibold text-accent-gold">
                            {locale === "es" ? "Servicio" : "Service"}
                        </span>
                        <span>{locale === "es" ? "Ubicación" : "Location"}</span>
                        <span>{locale === "es" ? "Horario" : "Schedule"}</span>
                        <span>{locale === "es" ? "Revisar" : "Review"}</span>
                        <span>{locale === "es" ? "Pago" : "Payment"}</span>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-text-primary mb-2">
                        {locale === "es"
                            ? "Elige Tu Servicio de Detallado"
                            : "Choose Your Detailing Service"}
                    </h1>
                    <p className="text-lg text-text-secondary">
                        {locale === "es"
                            ? "Selecciona el paquete perfecto para tu vehículo"
                            : "Select the perfect package for your vehicle"}
                    </p>
                    {dataSource === "strapi" && (
                        <p className="text-xs text-green-400 mt-1 opacity-60">Connected</p>
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left column: Services and Add-ons */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Services */}
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary mb-4">
                                {locale === "es" ? "Servicios Disponibles" : "Available Services"}
                            </h2>
                            <div className="grid md:grid-cols-3 gap-4">
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
                            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
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
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/10">
                                        <svg className="w-6 h-6 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold text-text-primary text-sm">
                                        {locale === "es" ? "Pago Seguro" : "Secure Payment"}
                                    </p>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/10">
                                        <svg className="w-6 h-6 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold text-text-primary text-sm">
                                        {locale === "es" ? "Cancelación 24h" : "Cancel 24h Before"}
                                    </p>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/10">
                                        <svg className="w-6 h-6 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold text-text-primary text-sm">
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
                                <>
                                    <PricingSummary
                                        service={selectedService}
                                        addOns={selectedAddOns}
                                        subtotal={subtotal}
                                        serviceFee={serviceFee}
                                        total={total}
                                        locale={locale}
                                    />

                                    <button
                                        onClick={handleBack}
                                        className="
                      w-full mb-3 bg-transparent text-text-secondary font-semibold py-4 rounded-xl
                      border border-white/20 hover:border-white/40 hover:text-text-primary
                      transition-colors duration-200
                    "
                                    >
                                        {locale === "es" ? "Volver a Inico" : "Back to Home"}
                                    </button>

                                    <button
                                        onClick={handleContinue}
                                        className="
                      w-full bg-accent-gold text-bg-primary font-bold py-4 rounded-xl
                      hover:bg-accent-gold-hover transition-colors duration-200
                      shadow-glow hover:shadow-lg
                    "
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
                                    </button>
                                </>
                            ) : (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                                    <svg className="w-16 h-16 text-text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p className="text-text-secondary font-medium mb-2">
                                        {locale === "es" ? "Selecciona un Servicio" : "Select a Service"}
                                    </p>
                                    <p className="text-sm text-text-muted">
                                        {locale === "es"
                                            ? "Elige uno de los servicios arriba para comenzar"
                                            : "Choose one of the services above to get started"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
