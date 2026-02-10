"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useBooking, Service, AddOn } from "@/contexts";
import { AddOnSelector, PricingSummary } from "@/components/booking";
import { fetchServices, fetchAddOns, StrapiService, StrapiAddOn } from "@/lib/api/strapi";

interface SelectServicePageProps {
  params: Promise<{
    lang: "en" | "es";
  }>;
}

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onSelect: (service: Service) => void;
  locale: "en" | "es";
}

function ServiceCard({ service, isSelected, onSelect, locale }: ServiceCardProps) {
  return (
    <div
      onClick={() => onSelect(service)}
      className={`
        relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200
        ${isSelected
          ? "border-blue-600 bg-blue-50 shadow-md ring-1 ring-blue-600"
          : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg"
        }
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          {locale === "es" ? service.nameEs : service.name}
        </h3>
        <span className="text-blue-600 font-bold text-lg">
          ${service.basePrice.toFixed(2)}
        </span>
      </div>

      <p className="text-gray-600 mb-6 text-sm min-h-[40px]">
        {locale === "es" ? service.descriptionEs : service.description}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center text-gray-500 text-sm">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {service.duration} {locale === "es" ? "min" : "mins"}
          </span>
        </div>

        <div
          className={`
            px-4 py-2 rounded-lg font-semibold text-sm transition-colors
            ${isSelected
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700"
            }
          `}
        >
          {isSelected
            ? locale === "es"
              ? "Seleccionado"
              : "Selected"
            : locale === "es"
              ? "Seleccionar"
              : "Select"}
        </div>
      </div>
    </div>
  );
}

// Map Strapi service to BookingContext Service
function mapStrapiService(s: StrapiService): Service {
  return {
    id: s.id,
    strapiId: s.id,
    name: s.name,
    nameEs: s.name, // TODO: fetch es locale from Strapi i18n
    description: s.description,
    descriptionEs: s.description,
    basePrice: s.basePrice,
    duration: s.durationMinutes,
  };
}

// Map Strapi add-on to BookingContext AddOn
function mapStrapiAddOn(a: StrapiAddOn): AddOn {
  return {
    id: a.id,
    strapiId: a.id,
    name: a.name,
    nameEs: a.name,
    description: a.description,
    descriptionEs: a.description,
    price: a.price,
  };
}

// Fallback mock data (used only when Strapi is completely down)
const FALLBACK_SERVICES: Service[] = [
  {
    id: "interior", name: "Interior Detail", nameEs: "Detalle Interior",
    description: "Deep clean of interior surfaces, seats, carpets, and dashboard",
    descriptionEs: "Limpieza profunda de superficies interiores, asientos, alfombras y tablero",
    basePrice: 89.99, duration: 120,
  },
  {
    id: "exterior", name: "Exterior Detail", nameEs: "Detalle Exterior",
    description: "Complete exterior wash, wax, tire shine, and window cleaning",
    descriptionEs: "Lavado exterior completo, encerado, brillo de llantas y limpieza de ventanas",
    basePrice: 79.99, duration: 90,
  },
  {
    id: "full-detail", name: "Full Detail Package", nameEs: "Paquete Detalle Completo",
    description: "Complete interior and exterior detailing package - best value!",
    descriptionEs: "Paquete completo de detallado interior y exterior - ¡mejor valor!",
    basePrice: 149.99, duration: 180,
  },
];

const FALLBACK_ADDONS: AddOn[] = [
  {
    id: "premium-wax", name: "Premium Wax", nameEs: "Cera Premium", price: 29.99,
    description: "High-grade carnauba wax for long-lasting shine", descriptionEs: "Cera de carnauba de alta calidad"
  },
  {
    id: "tire-shine", name: "Tire Shine & Dressing", nameEs: "Brillo de Llantas", price: 15.99,
    description: "Professional tire dressing for a deep black shine", descriptionEs: "Brillo profesional para llantas"
  },
  {
    id: "pet-hair", name: "Pet Hair Removal", nameEs: "Remoción de Pelo de Mascota", price: 34.99,
    description: "Deep cleaning to remove pet hair from seats and carpet", descriptionEs: "Limpieza profunda para remover pelo de mascota"
  },
  {
    id: "headlight", name: "Headlight Restoration", nameEs: "Restauración de Faros", price: 44.99,
    description: "Restore cloudy headlights to like-new clarity", descriptionEs: "Restaurar faros opacos a claridad como nuevos"
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

  const [services, setServices] = useState<Service[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"strapi" | "fallback">("strapi");

  // Reset booking and load data on mount
  useEffect(() => {
    resetBooking();
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [strapiServices, strapiAddOns] = await Promise.all([
        fetchServices(locale),
        fetchAddOns(locale),
      ]);

      setServices(strapiServices.map(mapStrapiService));
      setAddOns(strapiAddOns.map(mapStrapiAddOn));
      setDataSource("strapi");
    } catch (error) {
      console.warn("[Booking] Strapi unavailable, using fallback data:", error);
      setServices(FALLBACK_SERVICES);
      setAddOns(FALLBACK_ADDONS);
      setDataSource("fallback");
    } finally {
      setLoading(false);
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {locale === "es" ? "Cargando servicios..." : "Loading services..."}
          </p>
        </div>
      </div>
    );
  }

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
                    ${currentStep >= step
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
          {dataSource === "strapi" && (
            <p className="text-xs text-green-600 mt-1">Live from Strapi</p>
          )}
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
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
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
