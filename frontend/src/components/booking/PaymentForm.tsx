/**
 * Payment Form Component
 * Separated from Page to allow Server Component wrapper
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useBooking } from "@/contexts";
import { PricingSummary } from "@/components/booking";
import { createSupabaseBooking } from "@/lib/supabase/bookingService";
import StripeProvider from "@/components/payment/StripeProvider";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const GoogleAddressInput = dynamic(
  () => import("@/components/maps/GoogleAddressInput"),
  { ssr: false }
);

interface PaymentFormProps {
  locale: "en" | "es";
}

/** Stripe Payment Form Component */
function CheckoutForm({
  locale,
  onSuccess,
  isProcessing: externalIsProcessing,
  total,
}: {
  locale: "en" | "es";
  onSuccess: () => void;
  isProcessing: boolean;
  total: number;
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

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/booking/confirmation`,
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
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          {locale === "es" ? "Información de Pago" : "Payment Information"}
        </h3>
        <PaymentElement id="payment-element" />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-bg-primary text-lg
          transition-all duration-200 shadow-glow
          ${!stripe || isProcessing
            ? "bg-white/10 text-text-muted cursor-not-allowed"
            : "bg-accent-gold hover:bg-accent-gold-hover hover:shadow-lg active:scale-98"
          }
        `}
      >
        {isProcessing
          ? (locale === "es" ? "Procesando..." : "Processing...")
          : (locale === "es" ? `Pagar $${total.toFixed(2)}` : `Pay $${total.toFixed(2)}`)}
      </button>

      <div className="flex items-center justify-center text-sm text-text-muted">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        {locale === "es" ? "Seguro y encriptado" : "Secure & Encrypted"}
      </div>
    </form>
  );
}

export default function PaymentForm({ locale }: PaymentFormProps) {
  const router = useRouter();
  const {
    selectedService,
    selectedAddOns,
    selectedDate,
    selectedTimeWindow,
    subtotal,
    serviceFee,
    total,
    setLocation,
    setCustomerInfo,
    setPaymentStatus,
    setPaymentIntentId,
  } = useBooking();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [serviceCity, setServiceCity] = useState("");
  const [serviceState, setServiceState] = useState("FL");
  const [serviceZip, setServiceZip] = useState("");
  const [serviceLat, setServiceLat] = useState(0);
  const [serviceLng, setServiceLng] = useState(0);
  const [specialNotes, setSpecialNotes] = useState("");

  const [billingDifferent, setBillingDifferent] = useState(false);
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("FL");
  const [billingZip, setBillingZip] = useState("");

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [bookingCreated, setBookingCreated] = useState(false);

  useEffect(() => {
    if (!selectedService) {
      router.push(`/${locale}/booking/select`);
      return;
    }
    if (!selectedDate || !selectedTimeWindow) {
      router.push(`/${locale}/booking/schedule`);
      return;
    }
    const savedZip = sessionStorage.getItem('serviceZipCode');
    if (savedZip) setServiceZip(savedZip);
  }, [selectedService, selectedDate, selectedTimeWindow, router, locale]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = locale === "es" ? "Requerido" : "Required";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errors.email = locale === "es" ? "Inválido" : "Invalid";
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) errors.phone = locale === "es" ? "Inválido" : "Invalid";
    if (!serviceAddress.trim()) errors.serviceAddress = locale === "es" ? "Requerida" : "Required";
    if (!serviceCity.trim()) errors.serviceCity = locale === "es" ? "Requerida" : "Required";
    if (!serviceZip.trim() || serviceZip.length !== 5) errors.serviceZip = locale === "es" ? "Inválido" : "Invalid";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateBooking = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    setError(null);

    try {
      if (!selectedDate || !selectedTimeWindow || !selectedService) return;

      const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

      // 1. Create booking in Supabase
      const booking = await createSupabaseBooking({
        serviceId: typeof selectedService.id === "number" ? selectedService.id : 0,
        addOnIds: selectedAddOns.map((a) => a.id as number),
        date: formattedDate,
        timeWindow: selectedTimeWindow.slot,
        address: serviceAddress,
        city: serviceCity,
        state: serviceState,
        zipCode: serviceZip,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        specialInstructions: specialNotes || undefined,
        subtotal,
        serviceFee,
        total,
      });

      const bookingId = booking.document_id;

      // 2. Create payment intent via backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/payments/create-intent`,
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

      // Save context
      setLocation({ address: serviceAddress, city: serviceCity, state: serviceState, zipCode: serviceZip, latitude: serviceLat, longitude: serviceLng });
      setCustomerInfo({ name, email, phone, specialNotes });

    } catch (err) {
      console.error("Booking creation error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedService || !selectedDate || !selectedTimeWindow) return null;

  return (
    <div className="min-h-screen bg-bg-primary py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button onClick={() => router.push(`/${locale}/booking/schedule`)} className="flex items-center text-accent-gold hover:text-accent-gold-hover mb-4 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {locale === "es" ? "Volver" : "Back"}
          </button>
          <h1 className="text-3xl font-bold text-text-primary">{locale === "es" ? "Finalizar Reserva" : "Complete Your Booking"}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-Col 2 space-y-6">
            <div className="space-y-6">
              {/* Data Sections (Read only after booking created) */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  {locale === "es" ? "Contacto" : "Contact"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} disabled={bookingCreated} className="w-full px-4 py-3 border border-white/10 rounded-lg bg-white/5 text-text-primary disabled:opacity-50" />
                  <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} disabled={bookingCreated} className="w-full px-4 py-3 border border-white/10 rounded-lg bg-white/5 text-text-primary disabled:opacity-50" />
                  <input type="tel" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} disabled={bookingCreated} className="md:col-span-2 w-full px-4 py-3 border border-white/10 rounded-lg bg-white/5 text-text-primary disabled:opacity-50" />
                </div>
              </div>

              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                  {locale === "es" ? "Ubicación" : "Location"}
                </h2>
                {!bookingCreated ? (
                  <GoogleAddressInput onAddressSelect={val => { setServiceAddress(val.address); setServiceCity(val.city || ""); setServiceZip(val.zipCode); }} placeholder="Enter Address" />
                ) : (
                  <div className="text-text-secondary">{serviceAddress}, {serviceCity}, {serviceZip}</div>
                )}
              </div>

              {/* Step 3: Payment */}
              {clientSecret && bookingCreated ? (
                <StripeProvider clientSecret={clientSecret}>
                  <CheckoutForm locale={locale} onSuccess={() => setPaymentStatus("paid")} isProcessing={isProcessing} total={total} />
                </StripeProvider>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateBooking}
                  disabled={isProcessing}
                  className="w-full py-4 px-6 rounded-xl font-bold text-bg-primary text-lg transition-all duration-200 shadow-glow bg-accent-gold hover:bg-accent-gold-hover"
                >
                  {isProcessing ? "..." : (locale === "es" ? "Continuar al Pago" : "Continue to Payment")}
                </button>
              )}

              {error && <div className="text-red-400 font-medium p-4 bg-red-500/10 rounded-xl border border-red-500/50">{error}</div>}
            </div>
          </div>

          <div className="lg:col-span-1">
            <PricingSummary service={selectedService} addOns={selectedAddOns} subtotal={subtotal} serviceFee={serviceFee} total={total} locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
