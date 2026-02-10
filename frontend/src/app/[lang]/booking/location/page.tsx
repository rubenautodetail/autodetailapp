"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/contexts";
import { GoogleAddressInput } from "@/components/maps";
import { PricingSummary } from "@/components/booking";
import { validateZip } from "@/lib/api/strapi";

interface LocationPageProps {
  params: Promise<{
    lang: "en" | "es";
  }>;
}

export default function LocationPage({ params }: LocationPageProps) {
  const router = useRouter();
  const { lang } = use(params);
  const locale = lang || "en";

  const {
    selectedService,
    selectedAddOns,
    customerLocation,
    setLocation,
    subtotal,
    serviceFee,
    total,
    currentStep,
    nextStep,
    previousStep,
  } = useBooking();

  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Redirect if no service selected
  useEffect(() => {
    if (!selectedService) {
      router.push(`/${locale}/booking/select`);
    }
  }, [selectedService, router, locale]);

  // Validate ZIP code against real Strapi service zones
  const validateZipCode = async (zipCode: string): Promise<boolean> => {
    try {
      setIsValidating(true);
      setValidationError("");

      const result = await validateZip(zipCode);

      if (!result.available) {
        setValidationError(
          locale === "es"
            ? "Lo sentimos, aún no ofrecemos servicio en tu área."
            : "Sorry, we don't service your area yet."
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("ZIP validation error:", error);
      // Fallback: accept known Miami-area ZIPs if Strapi is down
      const fallbackZips = ["33186", "33183", "33156", "33176"];
      const isValid = fallbackZips.includes(zipCode);
      if (!isValid) {
        setValidationError(
          locale === "es"
            ? "Error al validar código postal. Intenta de nuevo."
            : "Error validating ZIP code. Please try again."
        );
      }
      return isValid;
    } finally {
      setIsValidating(false);
    }
  };

  const handleAddressSelect = (data: {
    address: string;
    zipCode: string;
    latitude: number;
    longitude: number;
  }) => {
    setLocation(data);
    setValidationError("");
  };

  const handleContinue = () => {
    if (!customerLocation) return;

    nextStep();
    router.push(`/${locale}/booking/schedule`);
  };

  const handleBack = () => {
    previousStep();
    router.push(`/${locale}/booking/select`);
  };

  if (!selectedService) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
            <span>{locale === "es" ? "Servicio" : "Service"}</span>
            <span className="font-semibold text-blue-600">
              {locale === "es" ? "Ubicación" : "Location"}
            </span>
            <span>{locale === "es" ? "Horario" : "Schedule"}</span>
            <span>{locale === "es" ? "Pago" : "Payment"}</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {locale === "es"
              ? "¿Dónde te gustaría el servicio?"
              : "Where would you like service?"}
          </h1>
          <p className="text-lg text-gray-600">
            {locale === "es"
              ? "Ingresa la dirección donde detallamos tu vehículo"
              : "Enter the address where we'll detail your vehicle"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column: Address Input */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
              {/* Address Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  {locale === "es"
                    ? "Dirección del Servicio"
                    : "Service Address"}
                </label>
                <GoogleAddressInput
                  onAddressSelect={handleAddressSelect}
                  onZipValidation={validateZipCode}
                  locale={locale}
                  placeholder={
                    locale === "es"
                      ? "Ej: 123 Main St, Miami, FL 33186"
                      : "e.g. 123 Main St, Miami, FL 33186"
                  }
                  initialValue={customerLocation?.address}
                />

                {validationError && (
                  <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="font-medium text-yellow-900">
                          {validationError}
                        </p>
                        <button className="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900">
                          {locale === "es"
                            ? "Únete a la lista de espera"
                            : "Join our waitlist"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Address Display */}
              {customerLocation && !validationError && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="font-medium text-green-900">
                        {locale === "es"
                          ? "¡Genial! Ofrecemos servicio en tu área"
                          : "Great! We service your area"}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        {customerLocation.address}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {locale === "es" ? "Código Postal:" : "ZIP Code:"}{" "}
                        {customerLocation.zipCode}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Area Info */}
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  {locale === "es"
                    ? "📍 Áreas de Servicio"
                    : "📍 Service Areas"}
                </h3>
                <p className="text-sm text-blue-700">
                  {locale === "es"
                    ? "Actualmente ofrecemos servicio en Miami-Dade County. ¿Tu área no está cubierta? Únete a nuestra lista de espera para ser notificado cuando expandamos."
                    : "We currently service Miami-Dade County. Not in our area yet? Join our waitlist to be notified when we expand."}
                </p>
              </div>
            </div>
          </div>

          {/* Right column: Summary (sticky) */}
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

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleContinue}
                  disabled={!customerLocation || !!validationError || isValidating}
                  className="
                    w-full bg-blue-600 text-white font-semibold py-4 rounded-xl
                    hover:bg-blue-700 transition-colors duration-200
                    disabled:bg-gray-300 disabled:cursor-not-allowed
                    shadow-lg hover:shadow-xl
                  "
                >
                  {isValidating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {locale === "es" ? "Validando..." : "Validating..."}
                    </span>
                  ) : (
                    <>
                      {locale === "es"
                        ? "Continuar a Horario"
                        : "Continue to Schedule"}
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
                    </>
                  )}
                </button>

                <button
                  onClick={handleBack}
                  className="
                    w-full bg-white text-gray-700 font-semibold py-4 rounded-xl
                    border-2 border-gray-300 hover:border-gray-400
                    transition-colors duration-200
                  "
                >
                  <svg
                    className="inline-block mr-2 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  {locale === "es" ? "Volver a Servicios" : "Back to Services"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
