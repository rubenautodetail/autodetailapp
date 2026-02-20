"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useBooking, CustomerInfo } from "@/contexts";
import { PricingSummary } from "@/components/booking";

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
    customerInfo,
    setCustomerInfo,
    subtotal,
    serviceFee,
    total,
    currentStep,
    nextStep,
    previousStep,
  } = useBooking();

  const [name, setName] = useState(customerInfo?.name || "");
  const [email, setEmail] = useState(customerInfo?.email || "");
  const [phone, setPhone] = useState(customerInfo?.phone || "");
  const [specialNotes, setSpecialNotes] = useState(customerInfo?.specialNotes || "");

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = locale === "es" ? "Nombre requerido" : "Name required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = locale === "es" ? "Email requerido" : "Email required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = locale === "es" ? "Email inválido" : "Invalid email";
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (!phone.trim()) {
      newErrors.phone = locale === "es" ? "Teléfono requerido" : "Phone required";
    } else if (phoneDigits.length < 10) {
      newErrors.phone = locale === "es" ? "Teléfono inválido" : "Invalid phone";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhoneNumber = (value: string) => {
    const phoneDigits = value.replace(/\D/g, "");
    if (phoneDigits.length <= 3) return phoneDigits;
    if (phoneDigits.length <= 6) {
      return `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3)}`;
    }
    return `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleContinue = () => {
    if (!validateForm()) {
      return;
    }

    // Save to context
    setCustomerInfo({
      name,
      email,
      phone,
      specialNotes,
    });

    nextStep();
    router.push(`/${locale}/booking/details`);
  };

  const handleBack = () => {
    // Save current form data before going back
    setCustomerInfo({
      name,
      email,
      phone,
      specialNotes,
    });

    previousStep();
    router.push(`/${locale}/booking/schedule`);
  };

  if (!selectedService || !customerLocation || !selectedDate || !selectedTimeWindow) {
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
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    font-semibold text-xs
                    ${currentStep >= step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                    }
                  `}
                >
                  {step}
                </div>
                {step < 6 && (
                  <div
                    className={`
                      w-8 h-1 mx-1
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
              {locale === "es" ? "Revisar" : "Review"}
            </span>
            <span>{locale === "es" ? "Vehículo" : "Vehicle"}</span>
            <span>{locale === "es" ? "Pago" : "Payment"}</span>
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
              ? "Verifica los detalles de tu reserva"
              : "Verify your booking details"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column: Contact Form & Booking Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {locale === "es" ? "Información de Contacto" : "Contact Information"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {locale === "es" ? "Nombre Completo" : "Full Name"}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                    placeholder={locale === "es" ? "Juan Pérez" : "John Doe"}
                    className={`
                      w-full px-4 py-3 border-2 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${errors.name ? "border-red-500 bg-red-50" : "border-gray-300"}
                    `}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === "es" ? "Correo Electrónico" : "Email"}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: "" });
                      }}
                      placeholder={locale === "es" ? "juan@ejemplo.com" : "john@example.com"}
                      className={`
                        w-full px-4 py-3 border-2 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${errors.email ? "border-red-500 bg-red-50" : "border-gray-300"}
                      `}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === "es" ? "Teléfono" : "Phone"}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="(305) 123-4567"
                      className={`
                        w-full px-4 py-3 border-2 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${errors.phone ? "border-red-500 bg-red-50" : "border-gray-300"}
                      `}
                      maxLength={14}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {locale === "es" ? "Notas Especiales (Opcional)" : "Special Notes (Optional)"}
                  </label>
                  <textarea
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder={
                      locale === "es"
                        ? "Ej: Portón de acceso, estacionamiento en el lado derecho..."
                        : "e.g., Gate code, parking on right side..."
                    }
                    rows={3}
                    className="
                      w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      resize-none
                    "
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-gray-500 text-right">
                    {specialNotes.length}/500
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {locale === "es" ? "Resumen de Reserva" : "Booking Summary"}
              </h3>

              <div className="space-y-4">
                {/* Service */}
                <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      {locale === "es" ? "Servicio" : "Service"}
                    </p>
                    <p className="font-semibold text-gray-900">{selectedService.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedService.duration} {locale === "es" ? "minutos" : "minutes"}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    ${selectedService.basePrice.toFixed(2)}
                  </p>
                </div>

                {/* Add-ons */}
                {selectedAddOns.length > 0 && (
                  <div className="border-b border-gray-200 pb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {locale === "es" ? "Extras" : "Add-ons"}
                    </p>
                    {selectedAddOns.map((addOn) => (
                      <div key={addOn.id} className="flex justify-between items-center mt-2">
                        <p className="text-sm text-gray-700">{addOn.name}</p>
                        <p className="text-sm font-semibold text-gray-900">
                          ${addOn.price.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Location */}
                <div className="border-b border-gray-200 pb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    {locale === "es" ? "Ubicación" : "Location"}
                  </p>
                  <p className="text-sm text-gray-900">{customerLocation.address}</p>
                  <p className="text-sm text-gray-600">
                    {customerLocation.city && `${customerLocation.city}, `}
                    {customerLocation.state} {customerLocation.zipCode}
                  </p>
                </div>

                {/* Schedule */}
                <div className="border-b border-gray-200 pb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    {locale === "es" ? "Fecha y Hora" : "Date & Time"}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedDate.toLocaleDateString(locale, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {locale === "es" ? selectedTimeWindow.labelEs : selectedTimeWindow.label} •{" "}
                    {locale === "es" ? selectedTimeWindow.rangeEs : selectedTimeWindow.range}
                  </p>
                </div>
              </div>
            </div>
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

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleContinue}
                  className="
                    w-full bg-blue-600 text-white font-semibold py-4 rounded-xl
                    hover:bg-blue-700 transition-colors duration-200
                    shadow-lg hover:shadow-xl
                  "
                >
                  {locale === "es" ? "Continuar a Vehículo" : "Continue to Vehicle Details"}
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
