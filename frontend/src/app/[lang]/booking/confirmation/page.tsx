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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 text-center shadow-lg">
          {/* Checkmark Circle */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {locale === "es" ? "Reserva Confirmada!" : "Booking Confirmed!"}
          </h1>
          <p className="text-gray-600 mb-6">
            {locale === "es"
              ? "Tu cita ha sido programada exitosamente"
              : "Your appointment has been successfully scheduled"}
          </p>

          {/* Confirmation Code */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
              {locale === "es" ? "Código de Confirmación" : "Confirmation Code"}
            </p>
            <p className="text-2xl font-bold text-blue-900 font-mono tracking-wider">
              {confirmationCode}
            </p>
          </div>

          {/* Booking Details */}
          <div className="border-t border-gray-200 pt-4 mb-6 space-y-3 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {locale === "es" ? "Servicio" : "Service"}
              </span>
              <span className="font-medium text-gray-900">{decodeURIComponent(serviceName)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {locale === "es" ? "Total" : "Total"}
              </span>
              <span className="font-bold text-gray-900">${totalAmount}</span>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="font-semibold text-gray-900 mb-2">
              {locale === "es" ? "Próximos Pasos:" : "What's Next:"}
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                {locale === "es"
                  ? "Recibirás una confirmación por SMS/email"
                  : "You'll receive a confirmation via SMS/email"}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                {locale === "es"
                  ? "Un detallador será asignado a tu cita"
                  : "A detailer will be assigned to your appointment"}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                {locale === "es"
                  ? "Recibirás actualizaciones en tiempo real el día del servicio"
                  : "You'll get real-time updates on the day of service"}
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href={`/${locale}`}
              className="
                block w-full bg-blue-600 text-white font-semibold py-4 rounded-xl
                hover:bg-blue-700 transition-colors duration-200
                text-center
              "
            >
              {locale === "es" ? "Volver al Inicio" : "Back to Home"}
            </Link>
            <Link
              href={`/${locale}/booking/select`}
              className="
                block w-full bg-white text-gray-700 font-semibold py-4 rounded-xl
                border-2 border-gray-300 hover:border-gray-400
                transition-colors duration-200
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
