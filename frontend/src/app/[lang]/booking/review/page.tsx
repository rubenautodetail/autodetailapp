"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useBooking, useBookingStatus, type VehicleInfo } from "@/contexts";
import { useAuth } from "@/contexts/AuthContext";
import { PricingSummary, ProgressIndicator } from "@/components/booking";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { X, Plus, Car, Warehouse } from "lucide-react";
import { getVehicleBodyStyleLabel, normalizeVehicleBodyStyle, type VehicleBodyStyle } from "@/types/vehicle";
import { VehicleBodyStyleSelector } from "@/components/vehicles/VehicleBodyStyleSelector";
import { VehicleBodyStyleArtwork } from "@/components/vehicles/VehicleBodyStyleArtwork";

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
    bookingVehicles,
    addBookingVehicle,
    removeBookingVehicle,
    setCustomerInfo,
    subtotal,
    serviceFee,
    total,
    currentStep,
    nextStep,
    previousStep,
    priceQuote,
    quoteStatus,
    quoteError,
    refreshPriceQuote,
    selectedBodyStyle,
  } = useBooking();

  const { vehicles: garageVehicles, addVehicle } = useBookingStatus();
  const { user, profile } = useAuth();

  const [name, setName] = useState(customerInfo?.name || "");
  const [email, setEmail] = useState(customerInfo?.email || "");
  const [phone, setPhone] = useState(customerInfo?.phone || "");

  // Auto-fill from auth profile on first load (only if fields are still empty)
  useEffect(() => {
    if (!name && profile?.full_name) setName(profile.full_name);
    if (!email && user?.email) setEmail(user.email);
    if (!phone && profile?.phone) setPhone(profile.phone);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, user]);
  const [specialNotes, setSpecialNotes] = useState(customerInfo?.specialNotes || "");

  // New vehicle form state
  const [showNewForm, setShowNewForm] = useState(false);
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleBodyStyle>(selectedBodyStyle ?? "sedan");
  const [saveToGarage, setSaveToGarage] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const contactCardRef = useRef<HTMLDivElement>(null);
  const vehiclesCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedBodyStyle) setVehicleType(selectedBodyStyle);
  }, [selectedBodyStyle]);

  // Auto-add the garage vehicle only when there is exactly one, matching the
  // service step: with two or more we ask instead of silently pricing garage[0].
  const autoAddedRef = useRef(false);
  useEffect(() => {
    if (!autoAddedRef.current && !selectedBodyStyle && garageVehicles.length === 1 && bookingVehicles.length === 0) {
      autoAddedRef.current = true;
      addBookingVehicle({
        id: garageVehicles[0].id,
        make: garageVehicles[0].make,
        model: garageVehicles[0].model,
        year: garageVehicles[0].year,
        color: garageVehicles[0].color,
        type: normalizeVehicleBodyStyle(garageVehicles[0].type),
      });
    }
  }, [garageVehicles, bookingVehicles.length, addBookingVehicle, selectedBodyStyle]);

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

  const validateForm = (): Record<string, string> => {
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

    if (bookingVehicles.length === 0) {
      newErrors.vehicles = locale === "es" ? "Selecciona al menos un vehículo" : "Select at least one vehicle";
    }

    setErrors(newErrors);
    return newErrors;
  };

  // Match by id when both sides have one (two identical cars must stay distinct);
  // hand-entered booking vehicles have no id, so fall back to field equality.
  const matchesGarageVehicle = (bv: VehicleInfo, gv: { id?: string; make: string; model: string; year: string; color: string }) =>
    bv.id && gv.id
      ? bv.id === gv.id
      : bv.make === gv.make && bv.model === gv.model && bv.year === gv.year && bv.color === gv.color;

  const isGarageVehicleSelected = (gv: { id?: string; make: string; model: string; year: string; color: string }) =>
    bookingVehicles.some(bv => matchesGarageVehicle(bv, gv));

  const toggleGarageVehicle = (gv: { id?: string; make: string; model: string; year: string; color: string; type: string }) => {
    const idx = bookingVehicles.findIndex(bv => matchesGarageVehicle(bv, gv));
    if (idx >= 0) {
      removeBookingVehicle(idx);
    } else {
      addBookingVehicle({ id: gv.id, make: gv.make, model: gv.model, year: gv.year, color: gv.color, type: normalizeVehicleBodyStyle(gv.type) });
    }
  };

  const handleAddNewVehicle = async () => {
    const newErrors: Record<string, string> = {};
    if (!vehicleMake.trim()) newErrors.vehicleMake = locale === "es" ? "Marca requerida" : "Make required";
    if (!vehicleModel.trim()) newErrors.vehicleModel = locale === "es" ? "Modelo requerido" : "Model required";
    if (!vehicleYear.trim()) newErrors.vehicleYear = locale === "es" ? "Año requerido" : "Year required";
    if (!vehicleColor.trim()) newErrors.vehicleColor = locale === "es" ? "Color requerido" : "Color required";
    if (Object.keys(newErrors).length > 0) { setErrors(prev => ({ ...prev, ...newErrors })); return; }

    const newVehicle: VehicleInfo = { make: vehicleMake, model: vehicleModel, year: vehicleYear, color: vehicleColor, type: vehicleType };
    addBookingVehicle(newVehicle);

    if (saveToGarage) {
      try {
        await addVehicle({
          ...newVehicle,
          type: normalizeVehicleBodyStyle(newVehicle.type || 'sedan'),
          licensePlate: '',
        });
      } catch { /* ignore */ }
    }

    // Reset form
    setVehicleMake(""); setVehicleModel(""); setVehicleYear(""); setVehicleColor(""); setVehicleType("sedan");
    setShowNewForm(false);
    setErrors((previous) => {
      const next = { ...previous };
      delete next.vehicleMake;
      delete next.vehicleModel;
      delete next.vehicleYear;
      delete next.vehicleColor;
      delete next.vehicles;
      return next;
    });
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

  // What the "Service" row is really worth: the quote's per-vehicle service
  // prices summed. Before a quote lands, base price times vehicle count.
  const serviceLineTotal = priceQuote
    ? priceQuote.vehicles.reduce((sum, line) => sum + line.servicePrice, 0)
    : (Number(selectedService?.basePrice) || 0) * Math.max(bookingVehicles.length, 1);

  // Per-vehicle lines for the price summary, labeled by the actual vehicles.
  const summaryVehicleLines = priceQuote?.vehicles.map((line, index) => {
    const vehicle = bookingVehicles[index];
    return {
      key: vehicle?.id ?? `${line.bodyStyle}-${index}`,
      label: vehicle
        ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        : getVehicleBodyStyleLabel(line.bodyStyle, locale),
      sublabel: vehicle ? getVehicleBodyStyleLabel(normalizeVehicleBodyStyle(vehicle.type), locale) : undefined,
      total: line.total,
    };
  });

  const handleContinue = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      // The button lives in the right column; the broken fields live in the left.
      // Say why nothing happened right here, and bring the cause into view.
      setErrors((current) => ({
        ...current,
        form: locale === "es"
          ? "Revisa los campos marcados arriba."
          : "Check the highlighted fields above.",
      }));
      const target = validationErrors.vehicles && !validationErrors.name && !validationErrors.email && !validationErrors.phone
        ? vehiclesCardRef.current
        : contactCardRef.current;
      target?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
      return;
    }
    setErrors((current) => {
      const next = { ...current };
      delete next.form;
      return next;
    });

    // Save contact info
    setCustomerInfo({ name, email, phone, specialNotes });

    const quote = await refreshPriceQuote();
    if (!quote) {
      setErrors((current) => ({
        ...current,
        pricing: locale === "es"
          ? "No pudimos confirmar el precio. Intenta de nuevo."
          : "We couldn't confirm pricing. Please try again.",
      }));
      return;
    }

    nextStep();
    router.push(`/${locale}/booking/payment`);
  };

  const handleBack = () => {
    setCustomerInfo({ name, email, phone, specialNotes });
    previousStep();
    router.push(`/${locale}/booking/schedule`);
  };

  if (!selectedService || !customerLocation || !selectedDate || !selectedTimeWindow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D0B078]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131835] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} locale={locale} />

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4" style={{ fontFamily: 'var(--font-display)' }}>
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
            <Card ref={contactCardRef} className="scroll-mt-6 p-5 sm:p-8 !bg-[#1A2142] !border-[#2C355E]">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D0B078]/10 flex items-center justify-center flex-shrink-0">
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
                      transition-colors placeholder:text-[#8994B8]
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
                        transition-colors placeholder:text-[#8994B8]
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
                        transition-colors placeholder:text-[#8994B8]
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
                      transition-colors placeholder:text-[#8994B8] resize-none
                    "
                    maxLength={500}
                  />
                  <p className="mt-2 text-xs text-[#8994B8] text-right font-medium">
                    {specialNotes.length}/500
                  </p>
                </div>
              </div>
            </Card>

            {/* Vehicle Selection — Multi-Vehicle */}
            <Card ref={vehiclesCardRef} className="scroll-mt-6 p-5 sm:p-8 !bg-[#1A2142] !border-[#2C355E]">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D0B078]/10 flex items-center justify-center flex-shrink-0">
                  <Car className="w-5 h-5 text-[#D0B078]" />
                </div>
                {locale === "es" ? "Vehículos" : "Vehicles"}
                {bookingVehicles.length > 0 && (
                  <span className="ml-auto text-sm font-medium bg-[#D0B078]/10 text-[#D0B078] px-3 py-1 rounded-full">
                    {bookingVehicles.length} {bookingVehicles.length === 1 ? (locale === "es" ? "vehículo" : "vehicle") : (locale === "es" ? "vehículos" : "vehicles")}
                  </span>
                )}
              </h3>
              <p className="text-sm text-[#8994B8] mb-6">
                {locale === "es"
                  ? "Selecciona los vehículos a detallar. Puedes agregar varios para una sola cita."
                  : "Select which vehicles to detail. You can add multiple for one appointment."}
              </p>

              {errors.vehicles && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                  {errors.vehicles}
                </div>
              )}

              {/* Selected Vehicles */}
              {bookingVehicles.length > 0 && (
                <div className="mb-6 space-y-2">
                  <p className="text-xs font-semibold text-[#D0B078] uppercase tracking-wider mb-2">
                    {locale === "es" ? "Seleccionados" : "Selected"}
                  </p>
                  {bookingVehicles.map((v, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 bg-[#D0B078]/5 border border-[#D0B078]/20 rounded-xl px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.06] bg-[radial-gradient(circle_at_50%_28%,rgba(208,176,120,0.16),rgba(8,12,27,0.2)_72%)]">
                          <VehicleBodyStyleArtwork
                            style={normalizeVehicleBodyStyle(v.type)}
                            locale={locale}
                            className="h-8 w-full min-w-0 shrink-0"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-white font-medium text-sm">{v.year} {v.make} {v.model}</span>
                          <span className="block text-[#8994B8] text-xs">{getVehicleBodyStyleLabel(normalizeVehicleBodyStyle(v.type), locale)} · {v.color}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBookingVehicle(idx)}
                        className="text-[#8994B8] hover:text-red-400 transition-colors p-1"
                        aria-label="Remove vehicle"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Garage Vehicles */}
              {garageVehicles.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-[#8994B8] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Warehouse className="w-3.5 h-3.5" />
                    {locale === "es" ? "Tu Garaje" : "Your Garage"}
                  </p>
                  <div className="grid gap-2">
                    {garageVehicles.map(gv => {
                      const selected = isGarageVehicleSelected(gv);
                      const style = normalizeVehicleBodyStyle(gv.type);
                      return (
                        <button
                          key={gv.id}
                          type="button"
                          role="checkbox"
                          aria-checked={selected}
                          onClick={() => toggleGarageVehicle(gv)}
                          className={`flex items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131835] ${
                            selected
                              ? "border-[#D0B078] bg-[#D0B078]/10"
                              : "border-[#2C355E] bg-[#1A2142] hover:border-[#D0B078]/60"
                          }`}
                        >
                          <span className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.06] bg-[radial-gradient(circle_at_50%_28%,rgba(208,176,120,0.16),rgba(8,12,27,0.2)_72%)]">
                            <VehicleBodyStyleArtwork
                              style={style}
                              locale={locale}
                              className="h-11 w-full min-w-0 shrink-0"
                            />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-white">
                              {gv.year} {gv.make} {gv.model}
                            </span>
                            <span className="mt-0.5 block text-xs text-[#A5B0D1]">
                              {getVehicleBodyStyleLabel(style, locale)} · {gv.color}
                            </span>
                          </span>
                          <span
                            aria-hidden="true"
                            className={`ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                              selected
                                ? "bg-[#D0B078] text-[#131835]"
                                : "border-2 border-[#4A5580]"
                            }`}
                          >
                            {selected ? "✓" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add New Vehicle */}
              {!showNewForm ? (
                <button
                  type="button"
                  onClick={() => setShowNewForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[#2C355E] text-[#A5B0D1] hover:border-[#D0B078]/50 hover:text-white transition-all text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  {locale === "es" ? "Agregar nuevo vehículo" : "Add new vehicle"}
                </button>
              ) : (
                <div className="border border-[#2C355E] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-white">{locale === "es" ? "Nuevo Vehículo" : "New Vehicle"}</p>
                    <button type="button" onClick={() => setShowNewForm(false)} className="text-[#8994B8] hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#A5B0D1] mb-1.5">
                        {locale === "es" ? "Marca" : "Make"}<span className="text-[#D0B078] ml-0.5">*</span>
                      </label>
                      <input type="text" value={vehicleMake} onChange={(e) => { setVehicleMake(e.target.value); if (errors.vehicleMake) setErrors(prev => ({ ...prev, vehicleMake: "" })); }}
                        placeholder="Toyota, Honda..." className={`w-full px-3 py-2.5 bg-[#131835] border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D0B078] placeholder:text-[#8994B8] ${errors.vehicleMake ? "border-red-500/50" : "border-[#2C355E]"}`} />
                      {errors.vehicleMake && <p className="mt-1 text-xs text-red-400">{errors.vehicleMake}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#A5B0D1] mb-1.5">
                        {locale === "es" ? "Modelo" : "Model"}<span className="text-[#D0B078] ml-0.5">*</span>
                      </label>
                      <input type="text" value={vehicleModel} onChange={(e) => { setVehicleModel(e.target.value); if (errors.vehicleModel) setErrors(prev => ({ ...prev, vehicleModel: "" })); }}
                        placeholder="Camry, Civic..." className={`w-full px-3 py-2.5 bg-[#131835] border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D0B078] placeholder:text-[#8994B8] ${errors.vehicleModel ? "border-red-500/50" : "border-[#2C355E]"}`} />
                      {errors.vehicleModel && <p className="mt-1 text-xs text-red-400">{errors.vehicleModel}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#A5B0D1] mb-1.5">
                        {locale === "es" ? "Año" : "Year"}<span className="text-[#D0B078] ml-0.5">*</span>
                      </label>
                      <input type="text" value={vehicleYear} onChange={(e) => { setVehicleYear(e.target.value); if (errors.vehicleYear) setErrors(prev => ({ ...prev, vehicleYear: "" })); }}
                        placeholder="2024" maxLength={4} className={`w-full px-3 py-2.5 bg-[#131835] border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D0B078] placeholder:text-[#8994B8] ${errors.vehicleYear ? "border-red-500/50" : "border-[#2C355E]"}`} />
                      {errors.vehicleYear && <p className="mt-1 text-xs text-red-400">{errors.vehicleYear}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#A5B0D1] mb-1.5">
                        {locale === "es" ? "Color" : "Color"}<span className="text-[#D0B078] ml-0.5">*</span>
                      </label>
                      <input type="text" value={vehicleColor} onChange={(e) => { setVehicleColor(e.target.value); if (errors.vehicleColor) setErrors(prev => ({ ...prev, vehicleColor: "" })); }}
                        placeholder={locale === "es" ? "Blanco, Negro..." : "White, Black..."} className={`w-full px-3 py-2.5 bg-[#131835] border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D0B078] placeholder:text-[#8994B8] ${errors.vehicleColor ? "border-red-500/50" : "border-[#2C355E]"}`} />
                      {errors.vehicleColor && <p className="mt-1 text-xs text-red-400">{errors.vehicleColor}</p>}
                    </div>
                  </div>
                  <VehicleBodyStyleSelector
                    locale={locale}
                    appearance="dark"
                    layout="carousel"
                    value={vehicleType}
                    onChange={setVehicleType}
                    name="booking-vehicle-body-style"
                    required
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={saveToGarage} onChange={e => setSaveToGarage(e.target.checked)}
                      className="w-4 h-4 rounded border-[#D0B078]/50 bg-[#131835] text-[#D0B078] focus:ring-[#D0B078]" style={{ accentColor: "#D0B078" }} />
                    <span className="text-xs text-[#A5B0D1]">
                      {locale === "es" ? "Guardar en mi garaje" : "Save to my garage"}
                    </span>
                  </label>
                  <button type="button" onClick={handleAddNewVehicle}
                    className="w-full py-2.5 bg-[#D0B078] text-[#131835] font-bold text-sm rounded-xl hover:bg-[#C4A060] transition-all">
                    {locale === "es" ? "Agregar Vehículo" : "Add Vehicle"}
                  </button>
                </div>
              )}

              {/* Authoritative per-vehicle pricing */}
              {bookingVehicles.length > 0 && (
                <div className="mt-4 bg-[#D0B078]/5 border border-[#D0B078]/20 rounded-xl p-3" aria-live="polite">
                  <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#D0B078] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                    <p className="text-xs font-semibold text-[#D0B078]">
                      {locale === "es" ? "Desglose por vehículo" : "Per-vehicle breakdown"}
                    </p>
                  </div>
                  <div className="mt-2 space-y-1.5 pl-6">
                    {bookingVehicles.map((vehicle, index) => (
                      <div key={vehicle.id ?? `${vehicle.make}-${vehicle.model}-${index}`} className="flex justify-between gap-3 text-xs">
                        <span className="text-[#A5B0D1]">
                          {vehicle.year} {vehicle.make} {vehicle.model} · {getVehicleBodyStyleLabel(normalizeVehicleBodyStyle(vehicle.type), locale)}
                        </span>
                        <span key={priceQuote?.vehicles[index]?.total ?? 'pending'} className="price-changed font-semibold text-white">
                          {priceQuote?.vehicles[index] ? `$${priceQuote.vehicles[index].total.toFixed(2)}` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                  {quoteStatus === "loading" && <p className="mt-2 pl-6 text-xs text-[#A5B0D1]">{locale === "es" ? "Actualizando precio…" : "Updating price…"}</p>}
                  {quoteError && <p role="alert" className="mt-2 pl-6 text-xs text-red-400">{locale === "es" ? "No pudimos actualizar el precio." : "We couldn't refresh pricing."}</p>}
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
                <div className="flex justify-between items-start border-b border-[#2C355E] pb-6">
                  <div>
                    <p className="text-sm font-medium text-[#8994B8] mb-1 uppercase tracking-wider">
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
                  <div className="text-right">
                    <p key={serviceLineTotal} className="price-changed font-bold text-lg text-white">
                      ${serviceLineTotal.toFixed(2)}
                    </p>
                    {bookingVehicles.length > 1 && (
                      <p className="mt-0.5 text-xs text-[#8994B8]">
                        {bookingVehicles.length} {locale === "es" ? "vehículos" : "vehicles"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Add-ons */}
                {selectedAddOns.length > 0 && (
                  <div className="border-b border-[#2C355E] pb-6">
                    <p className="text-sm font-medium text-[#8994B8] mb-3 uppercase tracking-wider">
                      {locale === "es" ? "Extras" : "Add-ons"}
                    </p>
                    <div className="space-y-3">
                      {selectedAddOns.map((addOn) => (
                        <div key={addOn.id} className="flex justify-between items-center group">
                          <p className="text-[#A5B0D1] group-hover:text-white transition-colors">{addOn.name}</p>
                          <p className="font-semibold text-white">
                            ${(Number(addOn.price) || 0).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location */}
                <div className="border-b border-[#2C355E] pb-6">
                  <p className="text-sm font-medium text-[#8994B8] mb-3 uppercase tracking-wider">
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
                  <p className="text-sm font-medium text-[#8994B8] mb-3 uppercase tracking-wider">
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
                          timeZone: "America/New_York",
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
                service={{ ...selectedService, basePrice: priceQuote?.vehicles[0]?.servicePrice ?? selectedService.basePrice }}
                addOns={selectedAddOns}
                subtotal={subtotal}
                serviceFee={serviceFee}
                total={total}
                locale={locale}
                vehicleLines={summaryVehicleLines}
              />

              {/* Action buttons */}
              <div className="mt-6 space-y-3">
                <Button
                  fullWidth
                  variant="primary"
                  onClick={handleContinue}
                  disabled={quoteStatus === "loading"}
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
                {errors.form && <p role="alert" className="text-center text-sm font-medium text-[#D0B078]">{errors.form}</p>}
                {errors.pricing && <p role="alert" className="text-sm text-red-400">{errors.pricing}</p>}

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
