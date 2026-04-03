"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useBooking, Location } from "@/contexts";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { PricingSummary, ProgressIndicator } from "@/components/booking";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

const MapboxAddressInput = dynamic(
  () => import("@/components/maps/MapboxAddressInput"),
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

  // Saved addresses
  const { user } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [saveLabel, setSaveLabel] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from("profiles").select("saved_addresses").eq("id", user.id).single().then(({ data }) => {
      if (data?.saved_addresses) setSavedAddresses(data.saved_addresses as SavedAddress[]);
    });
  }, [user]);

  const handleSelectSaved = (saved: SavedAddress) => {
    setAddress(saved.address);
    setCity(saved.city);
    setState(saved.state);
    setZipCode(saved.zipCode);
    setLatitude(saved.latitude);
    setLongitude(saved.longitude);
    setIsValid(true);
    setZipError("");
    setAddressError("");
  };

  const handleSaveAddress = async () => {
    if (!user || !address || !zipCode || !saveLabel.trim()) return;
    setSaving(true);
    const newEntry: SavedAddress = {
      id: crypto.randomUUID(),
      label: saveLabel.trim(),
      address, city, state: state || "FL", zipCode,
      latitude, longitude,
    };
    const updated = [...savedAddresses, newEntry];
    const supabase = createClient();
    await supabase.from("profiles").update({ saved_addresses: updated }).eq("id", user.id);
    setSavedAddresses(updated);
    setSaveLabel("");
    setSaving(false);
  };

  const handleDeleteSaved = async (id: string) => {
    if (!user) return;
    const updated = savedAddresses.filter(a => a.id !== id);
    const supabase = createClient();
    await supabase.from("profiles").update({ saved_addresses: updated }).eq("id", user.id);
    setSavedAddresses(updated);
  };

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
          `/api/booking/validate-zip`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ zipCode }),
          }
        );

        const data = await response.json();

        if (!data.available) {
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
    <div className="min-h-screen bg-[#131835] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} locale={locale} />

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            {locale === "es"
              ? "¿Dónde te gustaría el servicio?"
              : "Where would you like service?"}
          </h1>
          <p className="text-lg text-[#A5B0D1]">
            {locale === "es"
              ? "Ingresa tu ubicación para verificar disponibilidad"
              : "Enter your location to check availability"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left column: Location Input */}
          <div className="lg:col-span-2 space-y-8">
            {/* Saved Addresses */}
            {savedAddresses.length > 0 && (
              <Card className="p-6 !bg-[#1A2142] !border-[#2C355E]">
                <h3 className="text-base font-bold text-white mb-4">
                  {locale === "es" ? "Mis Direcciones" : "Saved Addresses"}
                </h3>
                <div className="space-y-2">
                  {savedAddresses.map(saved => (
                    <div
                      key={saved.id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        address === saved.address
                          ? "border-[#D0B078] bg-[#D0B078]/10"
                          : "border-[#2C355E] hover:border-[#D0B078]/50"
                      }`}
                      onClick={() => handleSelectSaved(saved)}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#D0B078]">{saved.label}</p>
                        <p className="text-xs text-[#A5B0D1] truncate">{saved.address}</p>
                        <p className="text-xs text-[#5E698F]">{saved.city}, {saved.state} {saved.zipCode}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSaved(saved.id); }}
                        className="text-[#5E698F] hover:text-red-400 transition-colors flex-shrink-0 p-1"
                        aria-label="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ZIP Code Input */}
            <Card className="p-5 sm:p-8 !bg-[#1A2142] !border-[#2C355E]">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D0B078]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                {locale === "es" ? "Código Postal" : "ZIP Code"}
              </h3>

              <div className="space-y-3">
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
                    w-full px-5 py-4 text-lg bg-white/5 border rounded-xl placeholder-[#5E698F]
                    focus:outline-none focus:ring-2 focus:ring-[#D0B078] transition-all duration-300
                    ${zipError
                      ? "border-red-500/50 bg-red-500/5"
                      : isValid
                        ? "border-green-500/50 bg-green-500/5 focus:border-[#D0B078]"
                        : "border-[#2C355E] hover:border-white/20"
                    }
                  `}
                  style={{ color: '#FFFFFF', fontSize: '16px' }}
                  inputMode="numeric"
                  maxLength={5}
                />

                {isValidating && (
                  <div className="flex items-center gap-2 text-sm text-[#5E698F] animate-fade-in">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#D0B078]"></div>
                    {locale === "es" ? "Verificando área de servicio..." : "Checking service area..."}
                  </div>
                )}

                {zipError && (
                  <div className="flex items-center gap-2 text-sm text-red-400 animate-fade-in">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {zipError}
                  </div>
                )}

                {isValid && !isValidating && (
                  <div className="flex items-center gap-2 text-sm text-green-400 animate-fade-in">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {locale === "es"
                      ? "¡Área de servicio confirmada!"
                      : "Service area confirmed!"}
                  </div>
                )}
              </div>
            </Card>

            {/* Address Input (only show if ZIP is valid) */}
            {isValid && (
              <Card className="p-5 sm:p-8 animate-fade-in-up !bg-[#1A2142] !border-[#2C355E]">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D0B078]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  {locale === "es" ? "Dirección del Servicio" : "Service Address"}
                </h3>

                <div className="space-y-4">
                  <MapboxAddressInput
                    onAddressSelect={handleAddressSelect}
                    initialValue={address}
                    placeholder={
                      locale === "es"
                        ? "Ingresa tu dirección completa"
                        : "Enter your full address"
                    }
                    locale={locale}
                    zipCode={zipCode}
                  />

                  {addressError && (
                    <div className="flex items-center gap-2 text-sm text-red-400 animate-fade-in">
                      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {addressError}
                    </div>
                  )}

                  {address && (
                    <div className="mt-4 space-y-3 animate-fade-in">
                      <div className="p-5 bg-[#D0B078]/5 border border-[#D0B078]/30 rounded-xl">
                        <p className="text-sm font-semibold text-[#D0B078] mb-1">
                          {locale === "es" ? "Dirección Seleccionada:" : "Selected Address:"}
                        </p>
                        <p className="text-white">{address}</p>
                      </div>

                      {/* Save address option — only show if not already saved */}
                      {user && !savedAddresses.some(s => s.address === address) && (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={saveLabel}
                            onChange={e => setSaveLabel(e.target.value)}
                            placeholder={locale === "es" ? "Guardar como (Casa, Trabajo…)" : "Save as (Home, Work…)"}
                            className="flex-1 px-3 py-2 text-sm bg-white/5 border border-[#2C355E] rounded-lg text-white placeholder-[#5E698F] focus:outline-none focus:border-[#D0B078]"
                          />
                          <button
                            onClick={handleSaveAddress}
                            disabled={!saveLabel.trim() || saving}
                            className="px-4 py-2 text-sm font-semibold text-[#D0B078] bg-[#D0B078]/10 border border-[#D0B078]/30 rounded-lg hover:bg-[#D0B078]/20 disabled:opacity-40 transition-all"
                          >
                            {saving ? "…" : (locale === "es" ? "Guardar" : "Save")}
                          </button>
                        </div>
                      )}
                      {user && savedAddresses.some(s => s.address === address) && (
                        <p className="text-xs text-green-400">✓ {locale === "es" ? "Dirección guardada" : "Address saved"}</p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Info Box */}
            <Card className="p-6 !bg-[#1A2142]/50 !border-[#2C355E]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#D0B078]/10 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#D0B078]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-white mb-1">
                    {locale === "es" ? "Servicio Móvil" : "Mobile Service"}
                  </p>
                  <p className="text-[#A5B0D1] leading-relaxed">
                    {locale === "es"
                      ? "Nuestros detalladores profesionales llegarán con todo el equipo necesario para ofrecer un servicio premium en tu ubicación."
                      : "Our professional detailers will arrive fully equipped to provide a premium service at your location."}
                  </p>
                </div>
              </div>
            </Card>
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
              <div className="mt-6 space-y-3">
                <Button
                  fullWidth
                  variant="primary"
                  onClick={handleContinue}
                  disabled={!isValid || !address}
                  className={(!isValid || !address) ? 'opacity-50 cursor-not-allowed' : ''}
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
                  {locale === "es" ? "Volver a Servicio" : "Back to Service"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
