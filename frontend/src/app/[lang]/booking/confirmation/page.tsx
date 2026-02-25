"use client";

import { use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        {/* Success Card */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-8 text-center shadow-2xl backdrop-blur-sm">
          {/* Checkmark Circle */}
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-text-primary mb-2">
            {locale === "es" ? "Reserva Confirmada!" : "Booking Confirmed!"}
          </h1>
          <p className="text-text-secondary mb-8">
            {locale === "es"
              ? "Tu cita ha sido programada exitosamente"
              : "Your appointment has been successfully scheduled"}
          </p>

          {/* Confirmation Code */}
          <div className="bg-accent-gold/10 rounded-xl p-4 mb-8 border border-accent-gold/20">
            <p className="text-xs font-semibold text-accent-gold uppercase tracking-wide mb-1">
              {locale === "es" ? "Código de Confirmación" : "Confirmation Code"}
            </p>
            <p className="text-2xl font-bold text-accent-gold font-mono tracking-wider">
              {confirmationCode}
            </p>
          </div>

          {/* Booking Details */}
          <div className="border-t border-white/10 pt-6 mb-8 space-y-3 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">
                {locale === "es" ? "Servicio" : "Service"}
              </span>
              <span className="font-medium text-text-primary">{decodeURIComponent(serviceName)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-text-secondary">
                {locale === "es" ? "Total" : "Total"}
              </span>
              <span className="font-bold text-accent-gold text-lg">${totalAmount}</span>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-white/5 rounded-xl p-6 mb-8 text-left border border-white/5">
            <p className="font-semibold text-text-primary mb-3">
              {locale === "es" ? "Próximos Pasos:" : "What's Next:"}
            </p>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                {locale === "es"
                  ? "Recibirás una confirmación por SMS/email"
                  : "You'll receive a confirmation via SMS/email"}
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                {locale === "es"
                  ? "Un detallador será asignado a tu cita"
                  : "A detailer will be assigned to your appointment"}
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                {locale === "es"
                  ? "Recibirás actualizaciones en tiempo real el día del servicio"
                  : "You'll get real-time updates on the day of service"}
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Link
              href={`/${locale}`}
              className="
                block w-full bg-accent-gold text-bg-primary font-bold py-4 rounded-xl
                hover:opacity-90 hover:shadow-lg transition-all duration-200
                text-center shadow-glow
              "
            >
              {locale === "es" ? "Volver al Inicio" : "Back to Home"}
            </Link>
            <Link
              href={`/${locale}/booking/select`}
              className="
                block w-full bg-transparent text-text-primary font-semibold py-4 rounded-xl
                border border-white/10 hover:border-accent-gold hover:text-accent-gold
                transition-all duration-200
                text-center
              "
            >
              {locale === "es" ? "Reservar Otro Servicio" : "Book Another Service"}
            </Link>
          </div>
        </div>
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <ConfirmationContent locale={locale} />
    </Suspense>
  );
}
