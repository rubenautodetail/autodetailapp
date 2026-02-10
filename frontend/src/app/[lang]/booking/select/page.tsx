"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useBooking, Service, AddOn } from "@/contexts";
import { ServiceCard, AddOnSelector, PricingSummary } from "@/components/booking";

interface SelectServicePageProps {
  params: Promise<{
    lang: "en" | "es";
  }>;
}

// Mock services data
const MOCK_SERVICES: Service[] = [
  {
    id: "interior",
    name: "Interior Detail",
    nameEs: "Detalle Interior",
    description: "Deep clean of interior surfaces, seats, carpets, and dashboard",
    descriptionEs: "Limpieza profunda de superficies interiores, asientos, alfombras y tablero",
    basePrice: 100,
    duration: 90,
  },
  {
    id: "exterior",
    name: "Exterior Detail",
    nameEs: "Detalle Exterior",
    description: "Complete exterior wash, wax, tire shine, and window cleaning",
    descriptionEs: "Lavado exterior completo, encerado, brillo de llantas y limpieza de ventanas",
    basePrice: 120,
    duration: 120,
  },
  {
    id: "full-detail",
    name: "Full Detail",
    nameEs: "Detalle Completo",
    description: "Complete interior and exterior detailing package - best value!",
    descriptionEs: "Paquete completo de detallado interior y exterior - ¡mejor valor!",
    basePrice: 200,
    duration: 180,
  },
];

// Mock add-ons data
const MOCK_ADDONS: AddOn[] = [
  {
    id: "pet-hair",
    name: "Pet Hair Removal",
    nameEs: "Remoción de Pelo de Mascota",
    description: "Specialized removal of pet hair from seats and carpets",
    descriptionEs: "Remoción especializada de pelo de mascota de asientos y alfombras",
    price: 25,
  },
  {
    id: "stain-treatment",
    name: "Stain Treatment",
    nameEs: "Tratamiento de Manchas",
    description: "Deep stain removal from upholstery and carpets",
    descriptionEs: "Eliminación profunda de manchas de tapicería y alfombras",
    price: 30,
  },
  {
    id: "headlight-restoration",
    name: "Headlight Restoration",
    nameEs: "Restauración de Faros",
    description: "Restore clarity to foggy or yellowed headlights",
    descriptionEs: "Restaurar claridad a faros empañados o amarillentos",
    price: 40,
  },
  {
    id: "engine-bay",
    name: "Engine Bay Cleaning",
    nameEs: "Limpieza de Compartimiento del Motor",
    description: "Thorough cleaning and degreasing of engine compartment",
    descriptionEs: "Limpieza y desengrase completo del compartimiento del motor",
    price: 50,
  },
];

export default function SelectServicePage({ params }: SelectServicePageProps) {
  const router = useRouter();
  const { lang } = use(params);
  const locale = lang || "en";

  const {
    selectedService,
    selectedAddOns,
    setService,
    addAddOn,
    removeAddOn,
    resetBooking,
    subtotal,
    serviceFee,
    total,
    currentStep,
    nextStep,
  } = useBooking();

  // Reset booking on mount to start fresh
  useEffect(() => {
    resetBooking();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    font-semibold text-sm
                    ${
                      currentStep >= step
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }
                  `}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`
                      w-16 h-1 mx-2
                      ${currentStep > step ? "bg-blue-600" : "bg-gray-200"}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-3xl mx-auto mt-2 text-xs text-gray-600">
            <span className="font-semibold text-blue-600">
              {locale === "es" ? "Servicio" : "Service"}
            </span>
            <span>{locale === "es" ? "Ubicación" : "Location"}</span>
            <span>{locale === "es" ? "Horario" : "Schedule"}</span>
            <span>{locale === "es" ? "Pago" : "Payment"}</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {locale === "es"
              ? "Elige Tu Servicio de Detallado"
              : "Choose Your Detailing Service"}
          </h1>
          <p className="text-lg text-gray-600">
            {locale === "es"
              ? "Selecciona el paquete perfecto para tu vehículo"
              : "Select the perfect package for your vehicle"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column: Services and Add-ons */}
          <div className="lg:col-span-2 space-y-6">
            {/* Services */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {locale === "es" ? "Servicios Disponibles" : "Available Services"}
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {MOCK_SERVICES.map((service) => (
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
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <AddOnSelector
                  addOns={MOCK_ADDONS}
                  selectedAddOns={selectedAddOns}
                  onAddOnToggle={handleAddOnToggle}
                  locale={locale}
                />
              </div>
            )}

            {/* Info Cards */}
            {selectedService && (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-semibold text-blue-900 text-sm">
                    {locale === "es" ? "Pago Seguro" : "Secure Payment"}
                  </p>
                </div>

                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-green-900 text-sm">
                    {locale === "es" ? "Cancelación 24h" : "Cancel 24h Before"}
                  </p>
                </div>

                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-purple-900 text-sm">
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
                    onClick={handleContinue}
                    className="
                      w-full bg-blue-600 text-white font-semibold py-4 rounded-xl
                      hover:bg-blue-700 transition-colors duration-200
                      shadow-lg hover:shadow-xl
                    "
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
                  </button>
                </>
              ) : (
                <div className="bg-gray-100 border-2 border-gray-200 rounded-xl p-6 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-600 font-medium mb-2">
                    {locale === "es" ? "Selecciona un Servicio" : "Select a Service"}
                  </p>
                  <p className="text-sm text-gray-500">
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
