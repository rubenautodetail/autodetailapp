"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useBooking, CustomerInfo } from "@/contexts";
import { PricingSummary, ProgressIndicator } from "@/components/booking";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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
    vehicleInfo,
    setCustomerInfo,
    setVehicleInfo,
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

  // Optional vehicle fields
  const [vehicleMake, setVehicleMake] = useState(vehicleInfo?.make || "");
  const [vehicleModel, setVehicleModel] = useState(vehicleInfo?.model || "");
  const [vehicleYear, setVehicleYear] = useState(vehicleInfo?.year || "");
  const [vehicleColor, setVehicleColor] = useState(vehicleInfo?.color || "");

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
    setCustomerInfo({ name, email, phone, specialNotes });
    setVehicleInfo({ make: vehicleMake, model: vehicleModel, year: vehicleYear, color: vehicleColor });

    nextStep();
    router.push(`/${locale}/booking/payment`);
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
    <div className="min-h-screen bg-[#131835] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} locale={locale} />

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            {locale === "es"
              ? "Revisa y Confirma"
              : "Review & Confirm"}
          </h1>
          <p className="text-lg text-[#A5B0D1]">
            {locale === "es"
              ? "Verifica los detalles de tu reserva"
              : "Verify your booking details"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left column: Contact Form & Booking Summary */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Information */}
            <Card className="p-8 !bg-[#1A2142] !border-[#2C355E]">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D0B078]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                {locale === "es" ? "Información de Contacto" : "Contact Information"}
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#A5B0D1] mb-2">
                    {locale === "es" ? "Nombre Completo" : "Full Name"}
                    <span className="text-[#D0B078] ml-1">*</span>
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
                      w-full px-4 py-3 bg-[#1A2142] border rounded-xl text-white
                      focus:outline-none focus:ring-2 focus:ring-[#D0B078] focus:border-transparent
                      transition-colors placeholder:text-[#5E698F]
                      ${errors.name ? "border-red-500/50 bg-red-500/5" : "border-[#2C355E]"}
                    `}
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#A5B0D1] mb-2">
                      {locale === "es" ? "Correo Electrónico" : "Email"}
                      <span className="text-[#D0B078] ml-1">*</span>
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
                        w-full px-4 py-3 bg-[#1A2142] border rounded-xl text-white
                        focus:outline-none focus:ring-2 focus:ring-[#D0B078] focus:border-transparent
                        transition-colors placeholder:text-[#5E698F]
                        ${errors.email ? "border-red-500/50 bg-red-500/5" : "border-[#2C355E]"}
                      `}
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#A5B0D1] mb-2">
                      {locale === "es" ? "Teléfono" : "Phone"}
                      <span className="text-[#D0B078] ml-1">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="(305) 123-4567"
                      className={`
                        w-full px-4 py-3 bg-[#1A2142] border rounded-xl text-white
                        focus:outline-none focus:ring-2 focus:ring-[#D0B078] focus:border-transparent
                        transition-colors placeholder:text-[#5E698F]
                        ${errors.phone ? "border-red-500/50 bg-red-500/5" : "border-[#2C355E]"}
                      `}
                      maxLength={14}
                    />
                    {errors.phone && (
                      <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#A5B0D1] mb-2">
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
                      w-full px-4 py-3 bg-[#1A2142] border border-[#2C355E] rounded-xl text-white
                      focus:outline-none focus:ring-2 focus:ring-[#D0B078] focus:border-transparent
                      transition-colors placeholder:text-[#5E698F] resize-none
                    "
                    maxLength={500}
                  />
                  <p className="mt-2 text-xs text-[#5E698F] text-right font-medium">
                    {specialNotes.length}/500
                  </p>
                </div>
              </div>
            </Card>

            {/* Vehicle Information (optional) */}
            <Card className="p-8 !bg-[#1A2142] !border-[#2C355E]">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D0B078]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h7m4-1V8a1 1 0 011-1h2l3 5v4h-2m-4 0h4" />
                  </svg>
                </div>
                {locale === "es" ? "Detalles del Vehículo" : "Vehicle Details"}
                <span className="text-xs font-normal text-[#5E698F] ml-1">
                  ({locale === "es" ? "Opcional" : "Optional"})
                </span>
              </h3>
              <p className="text-sm text-[#5E698F] mb-6">
                {locale === "es"
                  ? "Ayuda a tu técnico a prepararse. Puedes omitir esto si lo prefieres."
                  : "Helps your technician prepare. You can skip this if you prefer."}
              </p>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#A5B0D1] mb-2">
                    {locale === "es" ? "Marca" : "Make"}
                  </label>
                  <input
                    type="text"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    placeholder={locale === "es" ? "Toyota, Honda..." : "Toyota, Honda..."}
                    className="w-full px-4 py-3 bg-[#1A2142] border border-[#2C355E] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#D0B078] focus:border-transparent transition-colors placeholder:text-[#5E698F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#A5B0D1] mb-2">
                    {locale === "es" ? "Modelo" : "Model"}
                  </label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder={locale === "es" ? "Camry, Civic..." : "Camry, Civic..."}
                    className="w-full px-4 py-3 bg-[#1A2142] border border-[#2C355E] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#D0B078] focus:border-transparent transition-colors placeholder:text-[#5E698F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#A5B0D1] mb-2">
                    {locale === "es" ? "Año" : "Year"}
                  </label>
                  <input
                    type="text"
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
                    placeholder="2020"
                    maxLength={4}
                    className="w-full px-4 py-3 bg-[#1A2142] border border-[#2C355E] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#D0B078] focus:border-transparent transition-colors placeholder:text-[#5E698F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#A5B0D1] mb-2">
                    {locale === "es" ? "Color" : "Color"}
                  </label>
                  <input
                    type="text"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    placeholder={locale === "es" ? "Blanco, Negro..." : "White, Black..."}
                    className="w-full px-4 py-3 bg-[#1A2142] border border-[#2C355E] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#D0B078] focus:border-transparent transition-colors placeholder:text-[#5E698F]"
                  />
                </div>
              </div>
            </Card>

            {/* Booking Summary */}
            <Card className="p-8 !bg-[#1A2142] !border-[#2C355E]">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D0B078]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                {locale === "es" ? "Resumen de Reserva" : "Booking Summary"}
              </h3>

              <div className="space-y-6">
                {/* Service */}
                <div className="flex justify-between items-start border-b border-[#2C355E] pb-6 relative">
                  <div className="absolute -left-8 top-0 bottom-0 w-1 bg-[#D0B078] rounded-r-md opacity-0 transition-opacity"></div>
                  <div>
                    <p className="text-sm font-medium text-[#5E698F] mb-1 uppercase tracking-wider">
                      {locale === "es" ? "Servicio" : "Service"}
                    </p>
                    <p className="text-lg font-bold text-white">{selectedService.name}</p>
                    <p className="text-sm text-[#A5B0D1] mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {selectedService.duration} {locale === "es" ? "minutos" : "min"}
                    </p>
                  </div>
                  <p className="font-bold text-lg text-white">
                    ${selectedService.basePrice.toFixed(2)}
                  </p>
                </div>

                {/* Add-ons */}
                {selectedAddOns.length > 0 && (
                  <div className="border-b border-[#2C355E] pb-6">
                    <p className="text-sm font-medium text-[#5E698F] mb-3 uppercase tracking-wider">
                      {locale === "es" ? "Extras" : "Add-ons"}
                    </p>
                    <div className="space-y-3">
                      {selectedAddOns.map((addOn) => (
                        <div key={addOn.id} className="flex justify-between items-center group">
                          <p className="text-[#A5B0D1] group-hover:text-white transition-colors">{addOn.name}</p>
                          <p className="font-semibold text-white">
                            ${addOn.price.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location */}
                <div className="border-b border-[#2C355E] pb-6">
                  <p className="text-sm font-medium text-[#5E698F] mb-3 uppercase tracking-wider">
                    {locale === "es" ? "Ubicación" : "Location"}
                  </p>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#D0B078] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-white font-medium">{customerLocation.address}</p>
                      <p className="text-sm text-[#A5B0D1] mt-1">
                        {customerLocation.city && `${customerLocation.city}, `}
                        {customerLocation.state} {customerLocation.zipCode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="pt-2">
                  <p className="text-sm font-medium text-[#5E698F] mb-3 uppercase tracking-wider">
                    {locale === "es" ? "Fecha y Hora" : "Date & Time"}
                  </p>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#D0B078] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-white font-medium">
                        {selectedDate.toLocaleDateString(locale, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-[#D0B078] mt-1 font-medium">
                        {locale === "es" ? selectedTimeWindow.labelEs : selectedTimeWindow.label}
                      </p>
                    </div>
                  </div>
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

              {/* Action buttons */}
              <div className="mt-6 space-y-3">
                <Button
                  fullWidth
                  variant="primary"
                  onClick={handleContinue}
                >
                  {locale === "es" ? "Continuar al Pago" : "Continue to Payment"}
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
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
