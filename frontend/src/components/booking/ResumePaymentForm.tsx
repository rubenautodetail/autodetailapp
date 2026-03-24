/**
 * ResumePaymentForm
 * Allows a user to complete payment for an existing `pending_payment` booking
 * without re-entering any booking details.
 *
 * Flow:
 *  1. Fetch booking by ID from Supabase (RLS ensures ownership)
 *  2. POST /api/payments/create-intent (idempotent — same intent returned if already created)
 *  3. Render Stripe PaymentElement
 *  4. On success → /[lang]/booking/confirmation?code=...
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import StripeProvider from "@/components/payment/StripeProvider";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useAuth } from "@/contexts";
import { Calendar, Clock, MapPin, Car, ChevronLeft, AlertCircle, Loader2 } from "lucide-react";

interface BookingData {
  id: number;
  service_name: string | null;
  total_amount: number;
  confirmation_code: string;
  date: string;
  time_window: string | null;
  address: string | null;
  customer_name: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  status: string;
  payment_status: string;
}

interface ResumePaymentFormProps {
  bookingId: string;
  locale: "en" | "es";
}

// ── Inner Stripe checkout form ─────────────────────────────────────────────
function ResumeCheckoutForm({
  locale,
  total,
  confirmationCode,
  serviceName,
}: {
  locale: "en" | "es";
  total: number;
  confirmationCode: string;
  serviceName: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    // Safety valve — if stripe.confirmPayment never resolves (network hang),
    // reset after 45s so the user can retry.
    const timeout = setTimeout(() => {
      setIsProcessing(false);
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
      returnUrl.searchParams.set("total", total.toFixed(2));

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl.toString() },
      });

      if (confirmError) {
        setError(confirmError.message || "Payment failed");
      }
      // No else — Stripe handles the redirect on success.
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
    } finally {
      clearTimeout(timeout);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#1A2142] border border-[#2C355E] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#D0B078]/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          {locale === "es" ? "Información de Pago" : "Payment Information"}
        </h3>
        <PaymentElement id="resume-payment-element" />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-4 text-lg font-bold bg-[#D0B078] hover:bg-[#C4A060] text-[#131835] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing
          ? (locale === "es" ? "Procesando..." : "Processing...")
          : (locale === "es" ? `Pagar $${total.toFixed(2)}` : `Pay $${total.toFixed(2)}`)}
      </button>

      <div className="flex items-center justify-center text-sm text-[#5E698F]">
        <svg className="w-4 h-4 mr-2 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        {locale === "es" ? "Seguro y encriptado con Stripe" : "Secure & encrypted by Stripe"}
      </div>
    </form>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ResumePaymentForm({ bookingId, locale }: ResumePaymentFormProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    async function init() {
      const supabase = createClient();

      // RLS ensures user can only see bookings they own
      const { data, error: fetchError } = await supabase
        .from("bookings")
        .select("id, service_name, total_amount, confirmation_code, date, time_window, address, customer_name, vehicle_make, vehicle_model, vehicle_year, status, payment_status")
        .eq("id", bookingId)
        .single();

      if (fetchError || !data) {
        setError(locale === "es" ? "Reserva no encontrada." : "Booking not found.");
        setIsLoading(false);
        return;
      }

      if (data.status !== "pending_payment") {
        // Already paid — redirect to customer dashboard
        router.replace(`/${locale}/customer`);
        return;
      }

      setBooking(data as BookingData);

      // Create/retrieve payment intent (idempotent)
      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: data.id.toString(),
          amount: Math.round(Number(data.total_amount) * 100),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || (locale === "es" ? "Error al iniciar el pago." : "Failed to initialize payment."));
        setIsLoading(false);
        return;
      }

      const { clientSecret: secret } = await res.json();
      setClientSecret(secret);
      setIsLoading(false);
    }

    init();
  }, [user, authLoading, bookingId, locale, router]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[#131835] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#D0B078] animate-spin" />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#131835] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">{locale === "es" ? "Algo salió mal" : "Something went wrong"}</h2>
          <p className="text-[#A5B0D1]">{error}</p>
          <Link href={`/${locale}/customer`} className="inline-block bg-[#D0B078] text-[#131835] font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-all">
            {locale === "es" ? "Volver al panel" : "Back to dashboard"}
          </Link>
        </div>
      </div>
    );
  }

  if (!booking || !clientSecret) return null;

  const vehicleLabel = [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ") || null;
  const timeLabel = booking.time_window
    ? booking.time_window.charAt(0).toUpperCase() + booking.time_window.slice(1)
    : "N/A";
  const formattedDate = booking.date
    ? new Date(booking.date + "T12:00:00").toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "N/A";

  return (
    <div className="min-h-screen bg-[#131835] py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link href={`/${locale}/customer`} className="inline-flex items-center text-[#A5B0D1] hover:text-white text-sm font-medium mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          {locale === "es" ? "Volver a mis reservas" : "Back to my bookings"}
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {locale === "es" ? "Pago pendiente" : "Payment pending"}
          </div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
            {locale === "es" ? "Completar tu Pago" : "Complete Your Payment"}
          </h1>
          <p className="text-[#A5B0D1]">
            {locale === "es" ? "Tu reserva está reservada, solo falta el pago." : "Your spot is reserved — just finish the payment."}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left: Payment form */}
          <div className="lg:col-span-3">
            <StripeProvider clientSecret={clientSecret}>
              <ResumeCheckoutForm
                locale={locale}
                total={Number(booking.total_amount)}
                confirmationCode={booking.confirmation_code}
                serviceName={booking.service_name || "Auto Detail"}
              />
            </StripeProvider>
          </div>

          {/* Right: Booking summary */}
          <div className="lg:col-span-2">
            <div className="bg-[#1A2142] border border-[#2C355E] rounded-2xl p-6 space-y-5 sticky top-8">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider text-[#5E698F] border-b border-[#2C355E] pb-3">
                {locale === "es" ? "Resumen de Reserva" : "Booking Summary"}
              </h3>

              <div>
                <p className="text-xs text-[#5E698F] uppercase tracking-wide mb-1">{locale === "es" ? "Servicio" : "Service"}</p>
                <p className="text-white font-semibold text-lg">{booking.service_name || "Auto Detail"}</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 text-[#A5B0D1]">
                  <Calendar className="w-4 h-4 text-[#D0B078] mt-0.5 flex-shrink-0" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-start gap-3 text-[#A5B0D1]">
                  <Clock className="w-4 h-4 text-[#D0B078] mt-0.5 flex-shrink-0" />
                  <span>{timeLabel}</span>
                </div>
                {booking.address && (
                  <div className="flex items-start gap-3 text-[#A5B0D1]">
                    <MapPin className="w-4 h-4 text-[#D0B078] mt-0.5 flex-shrink-0" />
                    <span>{booking.address}</span>
                  </div>
                )}
                {vehicleLabel && (
                  <div className="flex items-start gap-3 text-[#A5B0D1]">
                    <Car className="w-4 h-4 text-[#D0B078] mt-0.5 flex-shrink-0" />
                    <span>{vehicleLabel}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-[#2C355E] pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#A5B0D1] text-sm">{locale === "es" ? "Total a pagar" : "Total due"}</span>
                  <span className="text-2xl font-bold text-[#D0B078]">${Number(booking.total_amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-[#D0B078]/5 border border-[#D0B078]/20 rounded-xl p-3 text-xs text-[#A5B0D1] leading-relaxed">
                {locale === "es"
                  ? "Solo se autoriza el pago ahora. El cargo se realiza cuando el trabajo comienza."
                  : "Payment is only authorized now. You're charged when the job begins."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
