"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useBooking, useBookingStatus, CustomerInfo } from "@/contexts";
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

  const { vehicles, addVehicle } = useBookingStatus();

  const [name, setName] = useState(customerInfo?.name || "");
  const [email, setEmail] = useState(customerInfo?.email || "");
  const [phone, setPhone] = useState(customerInfo?.phone || "");
  const [specialNotes, setSpecialNotes] = useState(customerInfo?.specialNotes || "");

  const [vehicleMake, setVehicleMake] = useState(vehicleInfo?.make || "");
  const [vehicleModel, setVehicleModel] = useState(vehicleInfo?.model || "");
  const [vehicleYear, setVehicleYear] = useState(vehicleInfo?.year || "");
  const [vehicleColor, setVehicleColor] = useState(vehicleInfo?.color || "");
  const [vehicleType, setVehicleType] = useState<any>(vehicleInfo?.type || "sedan");

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("new");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-select first vehicle from garage if available and no vehicle selected yet
  useEffect(() => {
    if (vehicles.length > 0 && selectedVehicleId === "new" && !vehicleMake) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId, vehicleMake]);

  // Sync fields when a garage vehicle is selected
  useEffect(() => {
    if (selectedVehicleId !== "new") {
      const v = vehicles.find(v => v.id === selectedVehicleId);
      if (v) {
        setVehicleMake(v.make);
        setVehicleModel(v.model);
        setVehicleYear(v.year);
        setVehicleColor(v.color);
        setVehicleType(v.type);
      }
    }
  }, [selectedVehicleId, vehicles]);

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

    if (selectedVehicleId === "new") {
      if (!vehicleMake.trim()) newErrors.vehicleMake = locale === "es" ? "Marca requerida" : "Make required";
      if (!vehicleModel.trim()) newErrors.vehicleModel = locale === "es" ? "Modelo requerido" : "Model required";
      if (!vehicleYear.trim()) newErrors.vehicleYear = locale === "es" ? "Año requerido" : "Year required";
      if (!vehicleColor.trim()) newErrors.vehicleColor = locale === "es" ? "Color requerido" : "Color required";
      if (!vehicleType) newErrors.vehicleType = locale === "es" ? "Tipo requerido" : "Type required";
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

  const handleContinue = async () => {
    if (!validateForm()) {
      return;
    }

    let finalVehicle = { 
      make: vehicleMake, 
      model: vehicleModel, 
      year: vehicleYear, 
      color: vehicleColor,
      type: vehicleType 
    };
    
    if (selectedVehicleId !== "new") {
      const existingVehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (existingVehicle) {
        finalVehicle = { 
          make: existingVehicle.make, 
          model: existingVehicle.model, 
          year: existingVehicle.year, 
          color: existingVehicle.color,
          type: existingVehicle.type 
        };
      }
    } else {
      // It's a new vehicle, save it to the garage
      try {
        await addVehicle({ ...finalVehicle, licensePlate: '' });
      } catch (e) {
        console.error("Failed to add vehicle to garage", e);
      }
    }

    // Save to context
    setCustomerInfo({ name, email, phone, specialNotes });
    setVehicleInfo(finalVehicle);

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

    if (selectedVehicleId === "new") {
      setVehicleInfo({ 
        make: vehicleMake, 
        model: vehicleModel, 
        year: vehicleYear, 
        color: vehicleColor,
        type: vehicleType 
      });
    }

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

            {/* Vehicle Information */}
            <Card className="p-8 !bg-[#1A2142] !border-[#2C355E]">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D0B078]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h7m4-1V8a1 1 0 011-1h2l3 5v4h-2m-4 0h4" />
                  </svg>
                </div>
                {locale === "es" ? "Detalles del Vehículo" : "Vehicle Details"}
              </h3>
              <p className="text-sm text-[#5E698F] mb-6">
                {locale === "es"
                  ? "Ayuda a tu técnico a prepararse."
                  : "Helps your technician prepare."}
              </p>

              {vehicles.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#A5B0D1] mb-2">
                    {locale === "es" ? "Seleccionar del garaje" : "Select from garage"}
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1A2142] border border-[#2C355E] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#D0B078] focus:border-transparent transition-colors"
                  >
                    <option value="new">{locale === "es" ? "+ Añadir nuevo vehículo" : "+ Add new vehicle"}</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.year} {v.make} {v.model} ({v.color})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedVehicleId === "new" && (
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#A5B0D1] mb-2">
                      {locale === "es" ? "Marca" : "Make"}
                      <span className="text-[#D0B078] ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={vehicleMake}
                      onChange={(e) => {
                        setVehicleMake(e.target.value);
                        if (errors.vehicleMake) setErrors({ ...errors, vehicleMake: "" });
                      }}
                      placeholder={locale === "es" ? "Toyota, Honda..." : "Toyota, Honda..."}
                      className={`w-full px-4 py-3 bg-[#1A2142] border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#D0B078] focus:border-transparent transition-colors placeholder:text-[#5E698F] ${errors.vehicleMake ? "border-red-500/50" : "border-[#2C355E]"}`}
                    />
                    {errors.vehicleMake && <p className="mt-1 text-sm text-red-400">{errors.vehicleMake}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#A5B0D1] mb-2">
                      {locale === "es" ? "Modelo" : "Model"}
                      <span className="text-[#D0B078] ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => {
                        setVehicleModel(e.target.value);
                        if (errors.vehicleModel) setErrors({ ...errors, vehicleModel: "" });
                      }}
                      placeholder={locale === "es" ? "Camry, Civic..." : "Camry, Civic..."}
                      className={`w-full px-4 py-3 bg-[#1A2142] border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#D0B078] focus:border-transparent transition-colors placeholder:text-[#5E698F] ${errors.vehicleModel ? "border-red-500/50" : "border-[#2C355E]"}`}
                    />
                    {errors.vehicleModel && <p className="mt-1 text-sm text-red-400">{errors.vehicleModel}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#A5B0D1] mb-2">
                      {locale === "es" ? "Año" : "Year"}
                      <span className="text-[#D0B078] ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={vehicleYear}
                      onChange={(e) => {
                        setVehicleYear(e.target.value);
                        if (errors.vehicleYear) setErrors({ ...errors, vehicleYear: "" });
                      }}
                      placeholder="2020"
                      maxLength={4}
                      className={`w-full px-4 py-3 bg-[#1A2142] border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#D0B078] focus:border-transparent transition-colors placeholder:text-[#5E698F] ${errors.vehicleYear ? "border-red-500/50" : "border-[#2C355E]"}`}
                    />
                    {errors.vehicleYear && <p className="mt-1 text-sm text-red-400">{errors.vehicleYear}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#A5B0D1] mb-2">
                      {locale === "es" ? "Color" : "Color"}
                      <span className="text-[#D0B078] ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={vehicleColor}
                      onChange={(e) => {
                        setVehicleColor(e.target.value);
                        if (errors.vehicleColor) setErrors({ ...errors, vehicleColor: "" });
                      }}
                      placeholder={locale === "es" ? "Blanco, Negro..." : "White, Black..."}
                      className={`w-full px-4 py-3 bg-[#1A2142] border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#D0B078] focus:border-transparent transition-colors placeholder:text-[#5E698F] ${errors.vehicleColor ? "border-red-500/50" : "border-[#2C355E]"}`}
                    />
                    {errors.vehicleColor && <p className="mt-1 text-sm text-red-400">{errors.vehicleColor}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#A5B0D1] mb-2">
                      {locale === "es" ? "Tipo de Vehículo" : "Vehicle Type"}
                      <span className="text-[#D0B078] ml-1">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'sedan', label: 'Sedan', labelEs: 'Sedán' },
                        { id: 'suv', label: 'SUV', labelEs: 'SUV' },
                        { id: 'truck', label: 'Truck', labelEs: 'Camioneta' },
                        { id: 'coupe', label: 'Coupe', labelEs: 'Coupé' },
                        { id: 'van', label: 'Van', labelEs: 'Van/Minivan' },
                        { id: 'other', label: 'Other', labelEs: 'Otro' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setVehicleType(t.id as any)}
                          className={`
                            px-4 py-3 rounded-xl border text-sm font-medium transition-all
                            ${vehicleType === t.id
                              ? "bg-[#D0B078] text-[#131835] border-[#D0B078]"
                              : "bg-[#1A2142] text-[#A5B0D1] border-[#2C355E] hover:border-[#D0B078]/50"
                            }
                          `}
                        >
                          {locale === "es" ? t.labelEs : t.label}
                        </button>
                      ))}
                    </div>
                    {errors.vehicleType && <p className="mt-1 text-sm text-red-400">{errors.vehicleType}</p>}
                  </div>
                </div>
              )}
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
