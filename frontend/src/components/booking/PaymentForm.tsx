/**
 * Payment Form Component
 * Handles Stripe payment - customer info comes from context
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/contexts";
import { PricingSummary, ProgressIndicator } from "@/components/booking";
import StripeProvider from "@/components/payment/StripeProvider";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { BookingPriceQuote, VehiclePriceLine } from "@/contexts/BookingContext";
import { normalizeVehicleBodyStyle } from "@/types/vehicle";
import { getStableCatalogRef } from "@/lib/pricing/servicePricePreviews";

interface PaymentFormProps {
  locale: "en" | "es";
}

interface StalePriceChange {
  previousTotal: number;
  refreshedTotal: number;
  accepted: boolean;
}

interface PriceChangedResponse {
  code: 'PRICE_CHANGED';
  previousTotalCents: number;
  quote: {
    service: BookingPriceQuote['service'];
    vehicles: VehiclePriceLine[];
    subtotalCents: number;
    serviceFeeCents: number;
    totalCents: number;
    currency: 'usd';
    pricingRevision: string;
  };
}

function normalizeChangedQuote(response: PriceChangedResponse): BookingPriceQuote {
  const quote = response.quote;
  return {
    ...quote,
    vehicles: quote.vehicles.map((vehicle) => ({
      ...vehicle,
      servicePrice: vehicle.servicePrice ?? vehicle.servicePriceCents / 100,
      addOnsPrice: vehicle.addOnsPrice ?? vehicle.addOnsPriceCents / 100,
      total: vehicle.total ?? vehicle.totalCents / 100,
    })),
    subtotal: quote.subtotalCents / 100,
    serviceFee: quote.serviceFeeCents / 100,
    total: quote.totalCents / 100,
  };
}

/** Inner Stripe checkout form */
function CheckoutForm({
  locale,
  onSuccess,
  isProcessing: externalIsProcessing,
  total,
  confirmationCode,
  serviceName,
  vehicleCount = 1,
}: {
  locale: "en" | "es";
  onSuccess: () => void;
  isProcessing: boolean;
  total: number;
  confirmationCode: string;
  serviceName: string;
  vehicleCount?: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [internalIsProcessing, setInternalIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setInternalIsProcessing(true);
    setError(null);

    const timeout = setTimeout(() => {
      setInternalIsProcessing(false);
      setError(locale === "es" ? "La solicitud tardó demasiado. Por favor intenta de nuevo." : "Request timed out. Please try again.");
    }, 45_000);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Failed to submit payment details");
        return;
      }

      const returnUrl = new URL(`${window.location.origin}/${locale}/booking/confirmation`);
      returnUrl.searchParams.set("code", confirmationCode);
      returnUrl.searchParams.set("service", encodeURIComponent(serviceName));
      returnUrl.searchParams.set("total", (Number(total) || 0).toFixed(2));
      if (vehicleCount > 1) returnUrl.searchParams.set("vehicles", String(vehicleCount));

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl.toString() },
      });

      if (confirmError) {
        setError(confirmError.message || "Payment failed");
      } else {
        onSuccess();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
    } finally {
      clearTimeout(timeout);
      setInternalIsProcessing(false);
    }
  };

  const isProcessing = internalIsProcessing || externalIsProcessing;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6 !bg-[#1A2142] !border-[#2C355E]">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#D0B078]/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          {locale === "es" ? "Información de Pago" : "Payment Information"}
        </h3>
        <PaymentElement id="payment-element" />
      </Card>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        fullWidth
        className="py-4 text-lg"
      >
        {isProcessing
          ? (locale === "es" ? "Procesando..." : "Processing...")
          : (locale === "es" ? `Pagar $${(Number(total) || 0).toFixed(2)}` : `Pay $${(Number(total) || 0).toFixed(2)}`)}
      </Button>

      <div className="flex items-center justify-center text-sm text-[#8994B8]">
        <svg className="w-4 h-4 mr-2 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        {locale === "es" ? "Seguro y encriptado con Stripe" : "Secure & encrypted by Stripe"}
      </div>
    </form>
  );
}

export default function PaymentForm({ locale }: PaymentFormProps) {
  const router = useRouter();
  const {
    selectedService,
    selectedAddOns,
    customerLocation,
    selectedDate,
    selectedTimeWindow,
    customerInfo,
    vehicleInfo,
    bookingVehicles,
    vehicleServices,
    allVehiclesAssigned,
    perVehicleServices,
    addOnsForBookingVehicle,
    vehicleSummaryLines,
    bookingServiceLabel,
    subtotal,
    serviceFee,
    total,
    currentStep,
    isHydrated,
    previousStep,
    setPaymentStatus,
    setPaymentIntentId,
    priceQuote,
    pricingRevision,
    refreshPriceQuote,
    applyPriceQuote,
  } = useBooking();

  const vehicleCount = Math.max(bookingVehicles.length, 1);
  const groupTotal = priceQuote?.total ?? total;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingCreated, setBookingCreated] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [stalePriceChange, setStalePriceChange] = useState<StalePriceChange | null>(null);

  // Redirect if prerequisites not met — wait for hydration so sessionStorage state is available
  useEffect(() => {
    if (!isHydrated) return;
    if (!selectedService || !allVehiclesAssigned) { router.push(`/${locale}/booking/select`); return; }
    if (!customerLocation) { router.push(`/${locale}/booking/location`); return; }
    if (!selectedDate || !selectedTimeWindow) { router.push(`/${locale}/booking/schedule`); return; }
    if (!customerInfo) { router.push(`/${locale}/booking/review`); return; }
  }, [isHydrated, selectedService, allVehiclesAssigned, customerLocation, selectedDate, selectedTimeWindow, customerInfo, router, locale]);

  const handleCreateBooking = async () => {
    if (isProcessing || bookingCreated) return;
    if (stalePriceChange && !stalePriceChange.accepted) return;
    if (!customerInfo || !customerLocation || !selectedDate || !selectedTimeWindow || !selectedService) {
      setError(locale === "es" ? "Faltan datos de reserva" : "Missing booking data");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const activeQuote = priceQuote ?? await refreshPriceQuote();
      if (!activeQuote) {
        throw new Error(locale === "es" ? "No pudimos confirmar el precio." : "We couldn't confirm pricing.");
      }
      const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

      // Build vehicles array — use bookingVehicles if multi, else single vehicleInfo
      const vehicles = bookingVehicles.length > 0
        ? bookingVehicles.map(v => {
            const override = v.id ? vehicleServices[v.id] : undefined;
            const overrideId = override ? getStableCatalogRef(override) : undefined;
            const vehicleAddOnIds = addOnsForBookingVehicle(v)
              .map(getStableCatalogRef)
              .filter((id): id is string | number => id !== undefined);
            return {
              make: v.make,
              model: v.model,
              year: v.year,
              color: v.color,
              vehicleId: v.id,
              bodyStyle: normalizeVehicleBodyStyle(v.type),
              ...(overrideId !== undefined ? { serviceId: overrideId } : {}),
              // Per-vehicle mode: this car's own add-ons, even when empty.
              ...(perVehicleServices ? { addOnIds: vehicleAddOnIds } : {}),
            };
          })
        : vehicleInfo
          ? [{
              make: vehicleInfo.make,
              model: vehicleInfo.model,
              year: vehicleInfo.year,
              color: vehicleInfo.color,
              vehicleId: vehicleInfo.id,
              bodyStyle: normalizeVehicleBodyStyle(vehicleInfo.type),
            }]
          : [];

      // Single atomic call: creates booking(s) + Stripe PaymentIntent together.
      // If Stripe fails the server rolls back the bookings — no orphaned records.
      const res = await fetch("/api/booking/create-with-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formattedDate,
          timeWindow: selectedTimeWindow.slot,
          address: customerLocation.address,
          city: customerLocation.city || "",
          state: customerLocation.state || "FL",
          zipCode: customerLocation.zipCode,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          specialInstructions: customerInfo.specialNotes || undefined,
          subtotal: activeQuote.subtotal,
          serviceFee: activeQuote.serviceFee,
          total: activeQuote.total,
          serviceId: activeQuote.service.id,
          serviceName: selectedService.name,
          // Booking-wide add-ons only exist outside per-vehicle mode; there each
          // vehicle carries its own list above.
          addOnIds: perVehicleServices
            ? []
            : selectedAddOns
              .map(getStableCatalogRef)
              .filter((id): id is string | number => id !== undefined),
          selectedAddOns: perVehicleServices ? [] : selectedAddOns.map(a => ({ name: a.name, price: a.price })),
          pricingRevision: activeQuote.pricingRevision,
          vehicles,
          // Backwards compat — first vehicle
          vehicleMake: vehicles[0]?.make,
          vehicleModel: vehicles[0]?.model,
          vehicleYear: vehicles[0]?.year,
          vehicleColor: vehicles[0]?.color,
          currency: "usd",
          locale,
        }),
      });

      if (!res.ok) {
        const err: { error?: string; code?: string; previousTotalCents?: number; quote?: PriceChangedResponse['quote'] } = await res.json();
        if (res.status === 409 && err.code === 'PRICE_CHANGED' && err.quote && typeof err.previousTotalCents === 'number') {
          const changedResponse: PriceChangedResponse = {
            code: 'PRICE_CHANGED',
            previousTotalCents: err.previousTotalCents,
            quote: err.quote,
          };
          const refreshedQuote = normalizeChangedQuote(changedResponse);
          applyPriceQuote(refreshedQuote);
          setStalePriceChange({
            previousTotal: changedResponse.previousTotalCents / 100,
            refreshedTotal: refreshedQuote.total,
            accepted: false,
          });
          return;
        }
        throw new Error(err.error || "Failed to set up booking");
      }

      const data = await res.json();
      setConfirmationCode(data.confirmationCode || "");
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setBookingCreated(true);
    } catch (err) {
      console.error("Booking creation error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    previousStep();
    router.push(`/${locale}/booking/review`);
  };

  if (!selectedService || !customerLocation || !selectedDate || !selectedTimeWindow || !customerInfo) {
    return (
      <div className="min-h-screen bg-[#131835] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D0B078]" />
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4" style={{ fontFamily: "var(--font-display)" }}>
            {locale === "es" ? "Pago Seguro" : "Secure Payment"}
          </h1>
          <p className="text-lg text-[#A5B0D1]">
            {locale === "es"
              ? "Completa tu reserva con pago seguro"
              : "Complete your booking with secure payment"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Booking Summary */}
            <Card className="p-5 sm:p-8 !bg-[#1A2142] !border-[#2C355E]">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D0B078]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                {locale === "es" ? "Resumen de Reserva" : "Booking Summary"}
              </h3>

              <div className="space-y-4 text-sm">
                {[
                  { label: locale === "es" ? "Contacto" : "Contact", value: customerInfo.name },
                  { label: locale === "es" ? "Ubicación" : "Location", value: customerLocation.address },
                  {
                    label: locale === "es" ? "Fecha" : "Date",
                    value: selectedDate.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }),
                  },
                  {
                    label: locale === "es" ? "Hora" : "Time",
                    value: locale === "es" ? selectedTimeWindow.labelEs : selectedTimeWindow.label,
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start gap-4">
                    <span className="text-[#8994B8] flex-shrink-0">{label}:</span>
                    <span className="text-white font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment Section */}
            {clientSecret && bookingCreated ? (
              <StripeProvider clientSecret={clientSecret}>
                <CheckoutForm
                  locale={locale}
                  onSuccess={() => setPaymentStatus("paid")}
                  isProcessing={isProcessing}
                  total={groupTotal}
                  confirmationCode={confirmationCode}
                  serviceName={selectedService.name}
                  vehicleCount={vehicleCount}
                />
              </StripeProvider>
            ) : (
              <div className="space-y-4">
                {/* Terms */}
                <Card className="p-6 !bg-[#1A2142] !border-[#D0B078]/20">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded border-[#D0B078]/50 bg-[#131835] text-[#D0B078] focus:ring-[#D0B078] focus:ring-offset-[#131835] cursor-pointer flex-shrink-0"
                      style={{ accentColor: "#D0B078" }}
                    />
                    <span className="text-sm text-[#A5B0D1] leading-relaxed">
                      {locale === "es"
                        ? "Acepto los términos y condiciones de servicio. Entiendo que el profesional requiere un espacio de trabajo seguro para realizar el detailing."
                        : "I agree to the terms and conditions of service. I understand that the professional needs a safe working space to perform the detailing."}
                    </span>
                  </label>
                </Card>

                <Button
                  onClick={handleCreateBooking}
                  disabled={isProcessing || !acceptedTerms || Boolean(stalePriceChange && !stalePriceChange.accepted)}
                  fullWidth
                  className={`py-4 text-lg ${(!acceptedTerms || isProcessing || (stalePriceChange && !stalePriceChange.accepted)) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isProcessing
                    ? (locale === "es" ? "Procesando..." : "Processing...")
                    : (locale === "es" ? "Continuar al Pago" : "Continue to Payment")}
                </Button>

                {stalePriceChange && (
                  <div className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-4" role="alert" aria-live="assertive">
                    <p className="font-semibold text-amber-200">
                      {locale === "es" ? "El precio cambió" : "Price updated"}
                    </p>
                    <p className="mt-1 text-sm text-amber-100/80">
                      {locale === "es"
                        ? `Total anterior: $${stalePriceChange.previousTotal.toFixed(2)} · Nuevo total: $${stalePriceChange.refreshedTotal.toFixed(2)}. Tus selecciones se conservaron.`
                        : `Previous total: $${stalePriceChange.previousTotal.toFixed(2)} · New total: $${stalePriceChange.refreshedTotal.toFixed(2)}. Your selections were preserved.`}
                    </p>
                    {!stalePriceChange.accepted ? (
                      <Button
                        type="button"
                        onClick={() => setStalePriceChange((current) => current ? { ...current, accepted: true } : current)}
                        className="mt-3"
                      >
                        {locale === "es"
                          ? `Aceptar $${stalePriceChange.refreshedTotal.toFixed(2)}`
                          : `Accept $${stalePriceChange.refreshedTotal.toFixed(2)}`}
                      </Button>
                    ) : (
                      <p className="mt-2 text-sm font-semibold text-amber-200">
                        {locale === "es" ? "Precio aceptado. Continúa al pago." : "Price accepted. Continue to payment."}
                      </p>
                    )}
                  </div>
                )}

                <Button
                  variant="secondary"
                  onClick={handleBack}
                  fullWidth
                  className="py-4 text-lg"
                >
                  <svg className="inline-block mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {locale === "es" ? "Volver a Revisar" : "Back to Review"}
                </Button>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
          </div>

          {/* Right column: Price Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <PricingSummary
                service={{
                  ...selectedService,
                  name: bookingServiceLabel(locale),
                  basePrice: priceQuote?.vehicles[0]?.servicePrice ?? selectedService.basePrice,
                }}
                addOns={selectedAddOns}
                subtotal={subtotal}
                serviceFee={serviceFee}
                total={total}
                locale={locale}
                vehicleLines={vehicleSummaryLines(locale)}
              />
              <p className="sr-only">{locale === "es" ? `Revisión de precio ${pricingRevision ?? ''}` : `Pricing revision ${pricingRevision ?? ''}`}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
