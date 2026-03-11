"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useBooking, type VehicleInfo } from "@/contexts";
import { PricingSummary } from "@/components/booking";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface DetailsPageProps {
  params: Promise<{
    lang: "en" | "es";
  }>;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => String(CURRENT_YEAR - i));

const CAR_MAKES = [
  "Acura", "Alfa Romeo", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet",
  "Chrysler", "Dodge", "Ferrari", "Fiat", "Ford", "Genesis", "GMC", "Honda",
  "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover",
  "Lexus", "Lincoln", "Maserati", "Mazda", "Mercedes-Benz", "Mini", "Mitsubishi",
  "Nissan", "Porsche", "Ram", "Rivian", "Rolls-Royce", "Subaru", "Tesla",
  "Toyota", "Volkswagen", "Volvo",
];

const COLORS = [
  { value: "white", label: "White", labelEs: "Blanco" },
  { value: "black", label: "Black", labelEs: "Negro" },
  { value: "silver", label: "Silver", labelEs: "Plateado" },
  { value: "gray", label: "Gray", labelEs: "Gris" },
  { value: "red", label: "Red", labelEs: "Rojo" },
  { value: "blue", label: "Blue", labelEs: "Azul" },
  { value: "green", label: "Green", labelEs: "Verde" },
  { value: "brown", label: "Brown / Beige", labelEs: "Café / Beige" },
  { value: "gold", label: "Gold / Yellow", labelEs: "Dorado / Amarillo" },
  { value: "orange", label: "Orange", labelEs: "Naranja" },
  { value: "purple", label: "Purple", labelEs: "Morado" },
  { value: "other", label: "Other", labelEs: "Otro" },
];

export default function DetailsPage({ params }: DetailsPageProps) {
  const router = useRouter();
  const { lang } = use(params);
  const locale = lang || "en";

  const {
    selectedService,
    selectedAddOns,
    customerLocation,
    selectedDate,
    selectedTimeWindow,
    vehicleInfo,
    setVehicleInfo,
    subtotal,
    serviceFee,
    total,
    currentStep,
    nextStep,
    previousStep,
  } = useBooking();

  const [make, setMake] = useState(vehicleInfo?.make || "");
  const [model, setModel] = useState(vehicleInfo?.model || "");
  const [year, setYear] = useState(vehicleInfo?.year || "");
  const [color, setColor] = useState(vehicleInfo?.color || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if prerequisites not met
  useEffect(() => {
    if (!selectedService) {
      router.push(`/${locale}/booking/select`);
      return;
    }
    if (!customerLocation) {
      router.push(`/${locale}/booking/location`);
      return;
    }
    if (!selectedDate || !selectedTimeWindow) {
      router.push(`/${locale}/booking/schedule`);
      return;
    }
  }, [selectedService, customerLocation, selectedDate, selectedTimeWindow, router, locale]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!make) {
      newErrors.make = locale === "es" ? "Marca requerida" : "Make required";
    }
    if (!model.trim()) {
      newErrors.model = locale === "es" ? "Modelo requerido" : "Model required";
    }
    if (!year) {
      newErrors.year = locale === "es" ? "Año requerido" : "Year required";
    }
    if (!color) {
      newErrors.color = locale === "es" ? "Color requerido" : "Color required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;

    setVehicleInfo({ make, model, year, color });
    nextStep();
    router.push(`/${locale}/booking/payment`);
  };

  const handleBack = () => {
    // Save partial data before going back
    if (make || model || year || color) {
      setVehicleInfo({ make, model, year, color });
    }
    previousStep();
    router.push(`/${locale}/booking/review`);
  };

  if (!selectedService || !customerLocation || !selectedDate || !selectedTimeWindow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold bg-luxe-dark-navy text-white transition-all duration-200 ${errors[field] ? "border-red-500 bg-red-500/10" : "border-luxe-gold/20"
    }`;

  return (
    <div className="min-h-screen bg-luxe-dark-navy py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-colors duration-300 ${currentStep >= step
                    ? "bg-luxe-gold text-luxe-dark-charcoal shadow-[0_0_15px_rgba(208,176,120,0.4)]"
                    : "bg-luxe-dark-charcoal text-gray-500 border border-gray-700"
                    }`}
                >
                  {step}
                </div>
                {step < 6 && (
                  <div
                    className={`w-8 h-1 mx-1 rounded-full transition-colors duration-300 ${currentStep > step ? "bg-luxe-gold/50" : "bg-gray-800"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-3xl mx-auto mt-2 text-xs text-gray-400">
            <span>{locale === "es" ? "Servicio" : "Service"}</span>
            <span>{locale === "es" ? "Ubicación" : "Location"}</span>
            <span>{locale === "es" ? "Horario" : "Schedule"}</span>
            <span>{locale === "es" ? "Revisar" : "Review"}</span>
            <span className="font-semibold text-luxe-gold">
              {locale === "es" ? "Vehículo" : "Vehicle"}
            </span>
            <span>{locale === "es" ? "Pago" : "Payment"}</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {locale === "es" ? "Detalles del Vehículo" : "Vehicle Details"}
          </h1>
          <p className="text-lg text-gray-400">
            {locale === "es"
              ? "Cuéntanos sobre el vehículo que deseas detallar"
              : "Tell us about the vehicle you'd like detailed"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column: Vehicle Form */}
          <div className="lg:col-span-2">
            <Card className="p-6 !bg-[#1A2142] !border-[#2C355E]">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-luxe-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                {locale === "es" ? "Información del Vehículo" : "Vehicle Information"}
              </h3>

              <div className="space-y-5">
                {/* Make + Year row */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Make */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {locale === "es" ? "Marca" : "Make"}
                      <span className="text-luxe-gold ml-1">*</span>
                    </label>
                    <select
                      value={make}
                      onChange={(e) => {
                        setMake(e.target.value);
                        if (errors.make) setErrors({ ...errors, make: "" });
                      }}
                      className={inputClass("make")}
                    >
                      <option className="bg-luxe-dark-navy" value="">
                        {locale === "es" ? "Seleccionar marca" : "Select make"}
                      </option>
                      {CAR_MAKES.map((m) => (
                        <option className="bg-luxe-dark-navy" key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    {errors.make && (
                      <p className="mt-1 text-sm text-red-600">{errors.make}</p>
                    )}
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {locale === "es" ? "Año" : "Year"}
                      <span className="text-luxe-gold ml-1">*</span>
                    </label>
                    <select
                      value={year}
                      onChange={(e) => {
                        setYear(e.target.value);
                        if (errors.year) setErrors({ ...errors, year: "" });
                      }}
                      className={inputClass("year")}
                    >
                      <option className="bg-luxe-dark-navy" value="">
                        {locale === "es" ? "Seleccionar año" : "Select year"}
                      </option>
                      {YEARS.map((y) => (
                        <option className="bg-luxe-dark-navy" key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    {errors.year && (
                      <p className="mt-1 text-sm text-red-600">{errors.year}</p>
                    )}
                  </div>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {locale === "es" ? "Modelo" : "Model"}
                    <span className="text-luxe-gold ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value);
                      if (errors.model) setErrors({ ...errors, model: "" });
                    }}
                    placeholder={locale === "es" ? "Ej: Camry, Civic, F-150..." : "e.g. Camry, Civic, F-150..."}
                    className={inputClass("model")}
                  />
                  {errors.model && (
                    <p className="mt-1 text-sm text-red-600">{errors.model}</p>
                  )}
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {locale === "es" ? "Color" : "Color"}
                    <span className="text-luxe-gold ml-1">*</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => {
                          setColor(c.value);
                          if (errors.color) setErrors({ ...errors, color: "" });
                        }}
                        className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${color === c.value
                          ? "border-luxe-gold bg-luxe-gold/10 text-luxe-gold shadow-[0_0_10px_rgba(208,176,120,0.2)]"
                          : "border-luxe-gold/20 text-gray-400 hover:border-luxe-gold/50 hover:text-white"
                          }`}
                      >
                        {locale === "es" ? c.labelEs : c.label}
                      </button>
                    ))}
                  </div>
                  {errors.color && (
                    <p className="mt-2 text-sm text-red-600">{errors.color}</p>
                  )}
                </div>

                {/* Privacy note */}
                <div className="flex items-start gap-2 bg-luxe-gold/10 border border-luxe-gold/20 rounded-lg p-3 mt-2">
                  <svg className="w-4 h-4 text-luxe-gold mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-luxe-gold">
                    {locale === "es"
                      ? "Esta información ayuda a nuestro detallador a prepararse. Solo se comparte con el profesional asignado."
                      : "This helps your detailer prepare. It's only shared with your assigned professional."}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right column: Price Summary (sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <PricingSummary
                service={selectedService}
                addOns={selectedAddOns}
                subtotal={subtotal}
                serviceFee={serviceFee}
                total={total}
                locale={locale}
              />

              {/* Vehicle preview (shows once filled) */}
              {(make || model || year || color) && (
                <Card className="p-4 !bg-[#1A2142] !border-[#2C355E]">
                  <p className="text-xs font-medium text-luxe-gold uppercase tracking-wider mb-2">
                    {locale === "es" ? "Tu Vehículo" : "Your Vehicle"}
                  </p>
                  <p className="font-semibold text-white">
                    {[year, make, model].filter(Boolean).join(" ") || "—"}
                  </p>
                  {color && (
                    <p className="text-sm text-gray-400 capitalize mt-1">
                      {COLORS.find((c) => c.value === color)?.[locale === "es" ? "labelEs" : "label"] || color}
                    </p>
                  )}
                </Card>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleContinue}
                  className="w-full flex justify-center items-center py-4 text-base"
                >
                  {locale === "es" ? "Continuar a Pago" : "Continue to Payment"}
                  <svg className="inline-block ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="w-full flex justify-center items-center py-4 text-base"
                >
                  <svg className="inline-block mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {locale === "es" ? "Volver a Revisar" : "Back to Review"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
