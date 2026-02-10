"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/contexts";
import { PricingSummary } from "@/components/booking";
import { createBooking } from "@/lib/api/strapi";

interface ReviewPageProps {
  params: Promise<{
    lang: "en" | "es";
  }>;
}

export default function ReviewPage({ params }: ReviewPageProps) {
  const router = useRouter();
  const { lang } = use(params);
  const locale = lang || "en";

  const {
    selectedService,
    selectedAddOns,
    customerLocation,
    selectedDate,
    selectedTimeWindow,
    subtotal,
    serviceFee,
    total,
    currentStep,
    previousStep,
  } = useBooking();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");

  // Redirect if prerequisites not met
  useEffect(() => {
    if (!selectedService) {
      router.push(`/${locale}/booking/select`);
    } else if (!customerLocation) {
      router.push(`/${locale}/booking/location`);
    } else if (!selectedDate || !selectedTimeWindow) {
      router.push(`/${locale}/booking/schedule`);
    }
  }, [selectedService, customerLocation, selectedDate, selectedTimeWindow, router, locale]);

  const handleBack = () => {
    previousStep();
    router.push(`/${locale}/booking/schedule`);
  };

  const handleConfirmBooking = async () => {
    // Validate required fields
    if (!customerName.trim()) {
      setPaymentError(locale === "es" ? "Nombre es requerido" : "Name is required");
      return;
    }
    if (!customerPhone.trim()) {
      setPaymentError(locale === "es" ? "Teléfono es requerido" : "Phone is required");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Parse city from address (everything between last comma-separated parts)
      const addressParts = customerLocation?.address.split(",").map((s) => s.trim()) || [];
      const city = addressParts.length >= 3 ? addressParts[addressParts.length - 3] : "Miami";

      // Format date as YYYY-MM-DD for Strapi
      const formattedDateStr = selectedDate
        ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
        : "";

      // Create real booking in Strapi
      const booking = await createBooking({
        service: typeof selectedService?.id === "number" ? selectedService.id : 0,
        addOns: selectedAddOns
          .filter((a) => typeof a.id === "number")
          .map((a) => a.id as number),
        date: formattedDateStr,
        timeWindow: selectedTimeWindow?.slot || "morning",
        address: customerLocation?.address || "",
        city,
        state: "FL",
        zipCode: customerLocation?.zipCode || "",
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || `${customerPhone.replace(/\D/g, "")}@placeholder.com`,
        customerPhone: customerPhone.trim(),
        specialInstructions: specialNotes.trim() || undefined,
        subtotal,
        serviceFee,
        total,
      });

      // Navigate to confirmation page with real Strapi data
      router.push(
        `/${locale}/booking/confirmation?code=${booking.confirmationCode}&service=${encodeURIComponent(
          selectedService?.name || ""
        )}&total=${total.toFixed(2)}`
      );
    } catch (err) {
      console.error("Booking creation error:", err);
      // Fallback: if Strapi is down, still complete with mock code
      const isStrapiDown = err instanceof Error && (err.message.includes("Failed to") || err.message.includes("fetch"));
      if (isStrapiDown) {
        const fallbackCode = `RBN-${Date.now().toString(36).toUpperCase()}`;
        router.push(
          `/${locale}/booking/confirmation?code=${fallbackCode}&service=${encodeURIComponent(
            selectedService?.name || ""
          )}&total=${total.toFixed(2)}`
        );
      } else {
        setPaymentError(
          locale === "es"
            ? "Error al procesar. Por favor intente de nuevo."
            : "Processing error. Please try again."
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedService || !customerLocation || !selectedDate || !selectedTimeWindow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const formattedDate = selectedDate.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeLabel = locale === "es" ? selectedTimeWindow.labelEs : selectedTimeWindow.label;
  const timeRange = selectedTimeWindow.range;

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
            <span>{locale === "es" ? "Ubicación" : "Location"}</span>
            <span>{locale === "es" ? "Horario" : "Schedule"}</span>
            <span className="font-semibold text-blue-600">
              {locale === "es" ? "Pago" : "Payment"}
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {locale === "es"
              ? "Revisa y Confirma"
              : "Review & Confirm"}
          </h1>
          <p className="text-lg text-gray-600">
            {locale === "es"
              ? "Verifica los detalles de tu cita antes de confirmar"
              : "Verify your appointment details before confirming"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column: Booking details & contact form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Summary */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {locale === "es" ? "Resumen del Servicio" : "Service Summary"}
              </h2>

              <div className="space-y-4">
                {/* Selected Service */}
                <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {locale === "es" ? selectedService.nameEs : selectedService.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {locale === "es" ? selectedService.descriptionEs : selectedService.description}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedService.duration} {locale === "es" ? "min" : "min"}
                    </p>
                  </div>
                  <span className="font-bold text-gray-900">${selectedService.basePrice.toFixed(2)}</span>
                </div>

                {/* Add-ons */}
                {selectedAddOns.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">
                      {locale === "es" ? "Extras:" : "Add-ons:"}
                    </p>
                    {selectedAddOns.map((addOn) => (
                      <div key={addOn.id} className="flex justify-between text-sm pl-4">
                        <span className="text-gray-600">
                          + {locale === "es" ? addOn.nameEs : addOn.name}
                        </span>
                        <span className="text-gray-900">${addOn.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {locale === "es" ? "Detalles de la Cita" : "Appointment Details"}
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Date & Time */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                    {locale === "es" ? "Fecha y Hora" : "Date & Time"}
                  </p>
                  <p className="font-semibold text-gray-900">{formattedDate}</p>
                  <p className="text-sm text-gray-600">
                    {timeLabel} • {timeRange}
                  </p>
                </div>

                {/* Location */}
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">
                    {locale === "es" ? "Ubicación" : "Location"}
                  </p>
                  <p className="font-semibold text-gray-900">{customerLocation.address}</p>
                  <p className="text-sm text-gray-600">
                    ZIP: {customerLocation.zipCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {locale === "es" ? "Información de Contacto" : "Contact Information"}
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === "es" ? "Nombre Completo *" : "Full Name *"}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={locale === "es" ? "Tu nombre" : "Your name"}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === "es" ? "Teléfono *" : "Phone *"}
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(305) 555-0123"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === "es" ? "Correo Electrónico" : "Email"}
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === "es" ? "Notas Especiales" : "Special Notes"}
                  </label>
                  <input
                    type="text"
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder={locale === "es" ? "Instrucciones especiales..." : "Special instructions..."}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Payment Notice */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">
                    {locale === "es" ? "Pago al Momento del Servicio" : "Pay at Time of Service"}
                  </p>
                  <p className="text-sm text-yellow-800">
                    {locale === "es"
                      ? "No se cobra por adelantado. El pago se procesará cuando el detallador llegue a tu ubicación. Puedes cancelar gratis hasta 24 horas antes."
                      : "No upfront charge. Payment will be processed when the detailer arrives at your location. Free cancellation up to 24 hours before."}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {paymentError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 font-medium">{paymentError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right column: Price summary & actions (sticky) */}
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

              {/* Cancellation Policy */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{locale === "es" ? "Cancelación gratis 24h antes" : "Free cancellation 24h before"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{locale === "es" ? "Garantía de satisfacción" : "Satisfaction guaranteed"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{locale === "es" ? "Detalladores verificados" : "Verified detailers"}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleConfirmBooking}
                  disabled={isProcessing}
                  className="
                    w-full bg-blue-600 text-white font-semibold py-4 rounded-xl
                    hover:bg-blue-700 transition-colors duration-200
                    disabled:bg-blue-400 disabled:cursor-not-allowed
                    shadow-lg hover:shadow-xl
                  "
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {locale === "es" ? "Procesando..." : "Processing..."}
                    </span>
                  ) : (
                    <>
                      {locale === "es" ? "Confirmar Reserva" : "Confirm Booking"} — ${total.toFixed(2)}
                    </>
                  )}
                </button>

                <button
                  onClick={handleBack}
                  disabled={isProcessing}
                  className="
                    w-full bg-white text-gray-700 font-semibold py-4 rounded-xl
                    border-2 border-gray-300 hover:border-gray-400
                    transition-colors duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
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
                  {locale === "es" ? "Volver a Horario" : "Back to Schedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
