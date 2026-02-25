/**
 * Payment Form Component
 * Simplified to only handle Stripe payment - customer info comes from context
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/contexts";
import { PricingSummary } from "@/components/booking";
import { createSupabaseBooking } from "@/lib/supabase/bookingService";
import StripeProvider from "@/components/payment/StripeProvider";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface PaymentFormProps {
  locale: "en" | "es";
}

/** Stripe Payment Form Component */
function CheckoutForm({
  locale,
  onSuccess,
  isProcessing: externalIsProcessing,
  total,
  confirmationCode,
  serviceName,
}: {
  locale: "en" | "es";
  onSuccess: () => void;
  isProcessing: boolean;
  total: number;
  confirmationCode: string;
  serviceName: string;
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

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Failed to submit payment details");
      setInternalIsProcessing(false);
      return;
    }

    const returnUrl = new URL(`${window.location.origin}/${locale}/booking/confirmation`);
    returnUrl.searchParams.set('code', confirmationCode);
    returnUrl.searchParams.set('service', encodeURIComponent(serviceName));
    returnUrl.searchParams.set('total', total.toFixed(2));

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl.toString(),
      },
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed");
      setInternalIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  const isProcessing = internalIsProcessing || externalIsProcessing;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          {locale === "es" ? "Información de Pago" : "Payment Information"}
        </h3>
        <PaymentElement id="payment-element" />
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 text-red-600 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-white text-lg
          transition-all duration-200 shadow-lg
          ${!stripe || isProcessing
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 hover:shadow-xl"
          }
        `}
      >
        {isProcessing
          ? (locale === "es" ? "Procesando..." : "Processing...")
          : (locale === "es" ? `Pagar $${total.toFixed(2)}` : `Pay $${total.toFixed(2)}`)}
      </button>

      <div className="flex items-center justify-center text-sm text-gray-600">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    subtotal,
    serviceFee,
    total,
    currentStep,
    previousStep,
    setPaymentStatus,
    setPaymentIntentId,
  } = useBooking();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingCreated, setBookingCreated] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

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
    if (!customerInfo) {
      router.push(`/${locale}/booking/review`);
      return;
    }
  }, [selectedService, customerLocation, selectedDate, selectedTimeWindow, customerInfo, router, locale]);

  const handleCreateBooking = async () => {
    if (!customerInfo || !customerLocation || !selectedDate || !selectedTimeWindow || !selectedService) {
      setError(locale === "es" ? "Faltan datos de reserva" : "Missing booking data");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

      // 1. Create booking in Supabase (source of truth for transactional data)
      const booking = await createSupabaseBooking({
        serviceId: typeof selectedService.id === "number" ? selectedService.id : 0,
        addOnIds: selectedAddOns.map((a) => a.id as number),
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
        subtotal,
        serviceFee,
        total,
        serviceName: selectedService.name,
        vehicleMake: vehicleInfo?.make,
        vehicleModel: vehicleInfo?.model,
        vehicleYear: vehicleInfo?.year,
        vehicleColor: vehicleInfo?.color,
      });

      const bookingId = booking.document_id;
      // Capture confirmation code so the return_url can display it
      setConfirmationCode(booking.confirmation_code || '');

      // 2. Create payment intent via Next.js API route (no Strapi required)
      const response = await fetch(
        `/api/payments/create-intent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(total * 100),
            bookingId: bookingId,
            currency: "usd",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to initiate payment");
      }

      const data = await response.json();
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
                {step < 6 && (
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
            <span>{locale === "es" ? "Ubicación" : "Location"}</span>
            <span>{locale === "es" ? "Horario" : "Schedule"}</span>
            <span>{locale === "es" ? "Revisar" : "Review"}</span>
            <span>{locale === "es" ? "Vehículo" : "Vehicle"}</span>
            <span className="font-semibold text-blue-600">
              {locale === "es" ? "Pago" : "Payment"}
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {locale === "es" ? "Pago Seguro" : "Secure Payment"}
          </h1>
          <p className="text-lg text-gray-600">
            {locale === "es"
              ? "Completa tu reserva con pago seguro"
              : "Complete your booking with secure payment"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column: Booking Summary & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Summary (Read-only) */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {locale === "es" ? "Resumen de Reserva" : "Booking Summary"}
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {locale === "es" ? "Contacto:" : "Contact:"}
                  </span>
                  <span className="text-gray-900 font-medium">{customerInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {locale === "es" ? "Ubicación:" : "Location:"}
                  </span>
                  <span className="text-gray-900 text-right">{customerLocation.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {locale === "es" ? "Fecha:" : "Date:"}
                  </span>
                  <span className="text-gray-900">
                    {selectedDate.toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {locale === "es" ? "Hora:" : "Time:"}
                  </span>
                  <span className="text-gray-900">
                    {locale === "es" ? selectedTimeWindow.labelEs : selectedTimeWindow.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            {clientSecret && bookingCreated ? (
              <StripeProvider clientSecret={clientSecret}>
                <CheckoutForm
                  locale={locale}
                  onSuccess={() => setPaymentStatus("paid")}
                  isProcessing={isProcessing}
                  total={total}
                  confirmationCode={confirmationCode}
                  serviceName={selectedService.name}
                />
              </StripeProvider>
            ) : (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleCreateBooking}
                  disabled={isProcessing}
                  className="
                    w-full py-4 px-6 rounded-xl font-semibold text-white text-lg
                    transition-all duration-200 shadow-lg
                    bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300
                    disabled:cursor-not-allowed
                  "
                >
                  {isProcessing
                    ? (locale === "es" ? "Procesando..." : "Processing...")
                    : (locale === "es" ? "Continuar al Pago" : "Continue to Payment")}
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
                  {locale === "es" ? "Volver a Revisar" : "Back to Review"}
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 text-red-600 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Right column: Price Summary (sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <PricingSummary
                service={selectedService}
                addOns={selectedAddOns}
                subtotal={subtotal}
                serviceFee={serviceFee}
                total={total}
                locale={locale}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
