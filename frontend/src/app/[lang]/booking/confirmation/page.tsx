"use client";

import { use, Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts";

interface ConfirmationPageProps {
  params: Promise<{
    lang: "en" | "es";
  }>;
}

function ConfirmationContent({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const confirmationCode = searchParams.get("code") || "RBN-UNKNOWN";
  const serviceName = searchParams.get("service") || "Auto Detail";
  const totalAmount = searchParams.get("total") || "0.00";
  const vehicleCountParam = searchParams.get("vehicles");
  const vehicleCount = vehicleCountParam ? parseInt(vehicleCountParam, 10) : 1;

  // Stripe redirect params — present when Stripe redirects back after payment
  const paymentIntentId = searchParams.get("payment_intent");
  const redirectStatus = searchParams.get("redirect_status");

  const { isAuthenticated, isLoading } = useAuth();
  const [guestDismissed, setGuestDismissed] = useState(false);

  // Show guest prompt if not signed in and hasn't dismissed it
  const showGuestPrompt = !isLoading && !isAuthenticated && !guestDismissed;

  // Fallback: if Stripe redirected here with a payment_intent param, verify the
  // payment status and ensure the booking transitions out of pending_payment even
  // if the webhook was delayed or failed.
  useEffect(() => {
    if (!paymentIntentId) return;
    if (redirectStatus !== "requires_capture" && redirectStatus !== "succeeded") return;

    fetch("/api/booking/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
    }).catch((err) => {
      console.warn("verify-payment fallback failed (non-fatal):", err);
    });
  }, [paymentIntentId, redirectStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#131835] flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full space-y-4">
        {/* Success Card */}
        <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-8 text-center shadow-2xl">
          {/* Checkmark */}
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            {locale === "es" ? "¡Reserva Confirmada!" : "Booking Confirmed!"}
          </h1>
          <p className="text-[#A5B0D1] mb-8">
            {locale === "es"
              ? "Tu cita ha sido programada exitosamente"
              : "Your appointment has been successfully scheduled"}
          </p>

          {/* Confirmation Code */}
          <div className="bg-[#D0B078]/10 rounded-xl p-4 mb-8 border border-[#D0B078]/20">
            <p className="text-xs font-semibold text-[#D0B078] uppercase tracking-wide mb-1">
              {locale === "es" ? "Código de Confirmación" : "Confirmation Code"}
            </p>
            <p className="text-2xl font-bold text-[#D0B078] font-mono tracking-wider">
              {confirmationCode}
            </p>
          </div>

          {/* Booking Details */}
          <div className="border-t border-[#2C355E] pt-6 mb-8 space-y-3 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-[#5E698F]">
                {locale === "es" ? "Servicio" : "Service"}
              </span>
              <span className="font-medium text-white">{decodeURIComponent(serviceName)}</span>
            </div>
            {vehicleCount > 1 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#5E698F]">
                  {locale === "es" ? "Vehículos" : "Vehicles"}
                </span>
                <span className="font-medium text-white">
                  {vehicleCount} {locale === "es" ? "vehículos" : "vehicles"}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base">
              <span className="text-[#5E698F]">
                {locale === "es" ? "Total" : "Total"}
              </span>
              <span className="font-bold text-[#D0B078] text-lg">${totalAmount}</span>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-white/5 rounded-xl p-6 mb-8 text-left border border-white/5">
            <p className="font-semibold text-white mb-3">
              {locale === "es" ? "Próximos Pasos:" : "What's Next:"}
            </p>
            <ul className="space-y-3 text-sm text-[#A5B0D1]">
              {[
                locale === "es"
                  ? "Recibirás una confirmación por SMS/email"
                  : "You'll receive a confirmation via SMS/email",
                locale === "es"
                  ? "Un detallador será asignado a tu cita"
                  : "A detailer will be assigned to your appointment",
                locale === "es"
                  ? "Recibirás actualizaciones en tiempo real el día del servicio"
                  : "You'll get real-time updates on the day of service",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D0B078]/20 text-[#D0B078] flex items-center justify-center text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href={`/${locale}/dashboard`}
              className="block w-full bg-[#D0B078] text-[#131835] font-bold py-4 rounded-xl hover:opacity-90 transition-all duration-200 text-center"
            >
              {locale === "es" ? "Ver Mis Reservas" : "View My Bookings"}
            </Link>
            <Link
              href={`/${locale}/booking/select`}
              className="block w-full bg-transparent text-white font-semibold py-4 rounded-xl border border-[#2C355E] hover:border-[#D0B078] hover:text-[#D0B078] transition-all duration-200 text-center"
            >
              {locale === "es" ? "Reservar Otro Servicio" : "Book Another Service"}
            </Link>
          </div>
        </div>

        {/* Guest Prompt — shown only if user is not signed in */}
        {showGuestPrompt && (
          <div className="bg-[#1A2142] rounded-2xl border border-[#D0B078]/30 p-6 relative">
            <button
              onClick={() => setGuestDismissed(true)}
              className="absolute top-4 right-4 text-[#5E698F] hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#D0B078]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-white mb-1">
                  {locale === "es" ? "¿Guardar tu reserva?" : "Save your booking?"}
                </p>
                <p className="text-sm text-[#A5B0D1] mb-4 leading-relaxed">
                  {locale === "es"
                    ? "Crea una cuenta gratuita para rastrear esta reserva, recibir recordatorios y volver a reservar fácilmente."
                    : "Create a free account to track this booking, get reminders, and rebook in one tap."}
                </p>
                <div className="flex gap-3">
                  <Link
                    href={`/${locale}/register?redirect=dashboard&code=${confirmationCode}`}
                    className="flex-1 bg-[#D0B078] text-[#131835] font-bold py-3 rounded-xl text-center text-sm hover:opacity-90 transition-all"
                  >
                    {locale === "es" ? "Crear Cuenta" : "Create Account"}
                  </Link>
                  <button
                    onClick={() => setGuestDismissed(true)}
                    className="flex-1 bg-transparent text-[#5E698F] font-medium py-3 rounded-xl border border-[#2C355E] text-sm hover:text-white hover:border-white/20 transition-all"
                  >
                    {locale === "es" ? "Continuar como invitado" : "Continue as guest"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { lang } = use(params);
  const locale = lang || "en";

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#131835] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D0B078]" />
        </div>
      }
    >
      <ConfirmationContent locale={locale} />
    </Suspense>
  );
}
