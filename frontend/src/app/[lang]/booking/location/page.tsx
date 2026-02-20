"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useBooking, Location } from "@/contexts";
import { PricingSummary } from "@/components/booking";

const GoogleAddressInput = dynamic(
  () => import("@/components/maps/GoogleAddressInput"),
  { ssr: false }
);

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

  const [zipCode, setZipCode] = useState(customerLocation?.zipCode || "");
  const [address, setAddress] = useState(customerLocation?.address || "");
  const [city, setCity] = useState(customerLocation?.city || "");
  const [state, setState] = useState(customerLocation?.state || "FL");
  const [latitude, setLatitude] = useState(customerLocation?.latitude || 0);
  const [longitude, setLongitude] = useState(customerLocation?.longitude || 0);

  const [isValidating, setIsValidating] = useState(false);
  const [zipError, setZipError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [isValid, setIsValid] = useState(false);

  // Redirect if prerequisites not met
  useEffect(() => {
    if (!selectedService) {
      router.push(`/${locale}/booking/select`);
    }
  }, [selectedService, router, locale]);

  // Validate ZIP code when changed
  useEffect(() => {
    const validateZip = async () => {
      if (zipCode.length !== 5) {
        setZipError("");
        setIsValid(false);
        return;
      }

      setIsValidating(true);
      setZipError("");

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/booking/validate-zip`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ zipCode }),
          }
        );

        const data = await response.json();

        if (!data.valid) {
          setZipError(
            locale === "es"
              ? "Lo sentimos, actualmente no prestamos servicios en esta área"
              : "Sorry, we don't currently service this area"
          );
          setIsValid(false);
        } else {
          setIsValid(true);
        }
      } catch (error) {
        console.error("ZIP validation error:", error);
        setZipError(
          locale === "es"
            ? "Error al validar código postal"
            : "Error validating ZIP code"
        );
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateZip();
  }, [zipCode, locale]);

  const handleAddressSelect = (selectedAddress: {
    address: string;
    city?: string;
    state?: string;
    zipCode: string;
    latitude: number;
    longitude: number;
  }) => {
    setAddress(selectedAddress.address);
    setCity(selectedAddress.city || "");
    setState(selectedAddress.state || "FL");
    setZipCode(selectedAddress.zipCode);
    setLatitude(selectedAddress.latitude);
    setLongitude(selectedAddress.longitude);
  };

  const handleContinue = () => {
    // Final validation
    if (!zipCode || zipCode.length !== 5) {
      setZipError(locale === "es" ? "Código postal requerido" : "ZIP code required");
      return;
    }

    if (!address.trim()) {
      setAddressError(locale === "es" ? "Dirección requerida" : "Address required");
      return;
    }

    if (!isValid) {
      return;
    }

    // Save to context
    setLocation({
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
    });

    // Save ZIP to session storage for later use
    sessionStorage.setItem('serviceZipCode', zipCode);

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
            {[1, 2, 3, 4, 5].map((step) => (
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
                {step < 5 && (
                  <div
                    className={`
                      w-12 h-1 mx-2
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
            <span>{locale === "es" ? "Revisar" : "Review"}</span>
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
              ? "Ingresa tu ubicación para verificar disponibilidad"
              : "Enter your location to check availability"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column: Location Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* ZIP Code Input */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {locale === "es" ? "Código Postal" : "ZIP Code"}
              </h3>

              <div className="space-y-2">
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                    setZipCode(value);
                    setZipError("");
                  }}
                  placeholder={locale === "es" ? "Ej: 33101" : "e.g. 33101"}
                  className={`
                    w-full px-4 py-3 text-lg border-2 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${zipError
                      ? "border-red-500 bg-red-50"
                      : isValid
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300"
                    }
                  `}
                  maxLength={5}
                />

                {isValidating && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    {locale === "es" ? "Verificando..." : "Checking..."}
                  </div>
                )}

                {zipError && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {zipError}
                  </div>
                )}

                {isValid && !isValidating && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {locale === "es"
                      ? "¡Área de servicio confirmada!"
                      : "Service area confirmed!"}
                  </div>
                )}
              </div>
            </div>

            {/* Address Input (only show if ZIP is valid) */}
            {isValid && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {locale === "es" ? "Dirección del Servicio" : "Service Address"}
                </h3>

                <div className="space-y-2">
                  <GoogleAddressInput
                    onAddressSelect={handleAddressSelect}
                    placeholder={
                      locale === "es"
                        ? "Ingresa tu dirección completa"
                        : "Enter your full address"
                    }
                  />

                  {addressError && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {addressError}
                    </div>
                  )}

                  {address && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        {locale === "es" ? "Dirección Seleccionada:" : "Selected Address:"}
                      </p>
                      <p className="text-blue-800">
                        {address}
                        {city && `, ${city}`}
                        {state && `, ${state}`} {zipCode}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-blue-900 mb-1">
                    {locale === "es" ? "Servicio Móvil" : "Mobile Service"}
                  </p>
                  <p className="text-blue-800 text-sm">
                    {locale === "es"
                      ? "Nuestros detalladores profesionales vienen a ti. Asegúrate de que la ubicación tenga acceso a agua y electricidad."
                      : "Our professional detailers come to you. Please ensure the location has access to water and electricity."}
                  </p>
                </div>
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
                  disabled={!isValid || !address}
                  className="
                    w-full bg-blue-600 text-white font-semibold py-4 rounded-xl
                    hover:bg-blue-700 transition-colors duration-200
                    disabled:bg-gray-300 disabled:cursor-not-allowed
                    shadow-lg hover:shadow-xl
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
                  {locale === "es" ? "Volver a Servicio" : "Back to Service"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
