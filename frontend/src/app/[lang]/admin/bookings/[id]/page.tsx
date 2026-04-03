"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";
import { fmtDate, fmtDateTime } from "@/lib/dateUtils";

interface PageProps {
  params: Promise<{ lang: "en" | "es"; id: string }>;
}

interface BookingDetail {
  id: number;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  vehicleType: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  scheduledDate: string;
  timeWindow: string;
  totalAmount: number;
  paymentStatus: string;
  paymentIntentId: string;
  specialInstructions: string;
  confirmationCode: string;
  contractorId: string | null;
  createdAt: string;
  updatedAt: string;
  reviewRating: number | null;
  reviewComment: string | null;
  reviewedAt: string | null;
}

interface ContractorInfo {
  id: string;
  name: string;
  phone: string;
  stripeAccountId: string | null;
  onboardingComplete: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  pending_assignment: "bg-orange-100 text-orange-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminBookingDetailPage({ params }: PageProps) {
  const { lang, id } = use(params);
  const locale = lang || "en";

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [contractor, setContractor] = useState<ContractorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await adminFetch(`/api/admin/bookings/detail?id=${id}`);
        if (!res.ok) {
          setLoading(false);
          return;
        }

        const { booking: detail, contractor: contractorData } = await res.json();
        setBooking(detail);
        if (contractorData) setContractor(contractorData);
      } catch (err) {
        console.error("Error loading booking:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleAction(action: "cancel" | "requeue") {
    if (!booking) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const endpoint = action === "cancel"
        ? "/api/admin/bookings/cancel"
        : "/api/admin/bookings/requeue";

      const res = await adminFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ bookingId: booking.id }),
      });

      if (!res.ok) throw new Error("Request failed");

      const newStatus = action === "cancel" ? "cancelled" : "pending_assignment";
      setBooking((prev) => prev ? { ...prev, status: newStatus, contractorId: action === "requeue" ? null : prev.contractorId } : prev);
      if (action === "requeue") setContractor(null);
      setMessage({ type: "success", text: action === "cancel" ? "Booking cancelled." : "Job re-queued for assignment." });
    } catch {
      setMessage({ type: "error", text: "Action failed. Please try again." });
    } finally {
      setActionLoading(false);
    }
  }

  const PLATFORM_FEE = 0.30;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{locale === "es" ? "Reserva no encontrada" : "Booking not found"}</p>
        <Link href={`/${locale}/admin/bookings`} className="text-blue-600 hover:underline text-sm">
          {locale === "es" ? "← Volver" : "← Go back"}
        </Link>
      </div>
    );
  }

  const platformFee = booking.totalAmount * PLATFORM_FEE;
  const contractorPayout = booking.totalAmount - platformFee;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Link href={`/${locale}/admin/bookings`} className="text-sm text-blue-600 hover:underline mb-2 block">
          {locale === "es" ? "← Volver a Reservas" : "← Back to Bookings"}
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-mono">
              {booking.confirmationCode || `#${String(booking.id).slice(0, 8)}`}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${STATUS_COLORS[booking.status] || "bg-gray-100 text-gray-700"}`}>
              {booking.status.replace(/_/g, " ")}
            </span>
            {booking.status !== "cancelled" && booking.status !== "completed" && (
              <>
                <button
                  onClick={() => handleAction("requeue")}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-100 disabled:opacity-50 transition-colors"
                >
                  {locale === "es" ? "Re-asignar" : "Re-queue"}
                </button>
                <button
                  onClick={() => handleAction("cancel")}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  {locale === "es" ? "Cancelar" : "Cancel"}
                </button>
              </>
            )}
          </div>
        </div>
        {message && (
          <div className={`mt-3 px-4 py-2 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid md:grid-cols-2 gap-6">
        {/* Customer */}
        <Section title={locale === "es" ? "Cliente" : "Customer"}>
          <Field label={locale === "es" ? "Nombre" : "Name"} value={booking.customerName} />
          <Field label={locale === "es" ? "Email" : "Email"} value={booking.customerEmail} />
          <Field label={locale === "es" ? "Teléfono" : "Phone"} value={booking.customerPhone} />
          {booking.specialInstructions && booking.specialInstructions !== "—" && (
            <Field label={locale === "es" ? "Notas" : "Notes"} value={booking.specialInstructions} />
          )}
        </Section>

        {/* Vehicle */}
        <Section title={locale === "es" ? "Vehículo" : "Vehicle"}>
          <Field label={locale === "es" ? "Marca" : "Make"} value={booking.vehicleMake} />
          <Field label={locale === "es" ? "Modelo" : "Model"} value={booking.vehicleModel} />
          <Field label={locale === "es" ? "Año" : "Year"} value={booking.vehicleYear} />
          <Field label={locale === "es" ? "Color" : "Color"} value={booking.vehicleColor} />
          <Field label={locale === "es" ? "Tipo" : "Type"} value={booking.vehicleType} />
        </Section>

        {/* Service & Schedule */}
        <Section title={locale === "es" ? "Servicio y Horario" : "Service & Schedule"}>
          <Field label={locale === "es" ? "Servicio" : "Service"} value={booking.serviceName} />
          <Field
            label={locale === "es" ? "Fecha" : "Date"}
            value={fmtDate(booking.scheduledDate, locale)}
          />
          <Field label={locale === "es" ? "Horario" : "Time Window"} value={booking.timeWindow} />
          <Field label={locale === "es" ? "Dirección" : "Address"} value={`${booking.address}, ${booking.city}, ${booking.state} ${booking.zipCode}`} />
        </Section>

        {/* Contractor */}
        <Section title={locale === "es" ? "Técnico Asignado" : "Assigned Technician"}>
          {contractor ? (
            <>
              <Field label={locale === "es" ? "Nombre" : "Name"} value={contractor.name} />
              <Field label={locale === "es" ? "Teléfono" : "Phone"} value={contractor.phone} />
              <Field
                label={locale === "es" ? "Stripe Connect" : "Stripe Connect"}
                value={contractor.stripeAccountId
                  ? (contractor.onboardingComplete ? "✅ Active" : "⚠️ Pending onboarding")
                  : "Not connected"}
              />
              <Field label="ID" value={contractor.id} mono />
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">
              {locale === "es" ? "Sin asignar" : "Not yet assigned"}
            </p>
          )}
        </Section>

        {/* Payment */}
        <Section title={locale === "es" ? "Pago" : "Payment"}>
          <Field
            label={locale === "es" ? "Total cobrado" : "Total Charged"}
            value={`$${booking.totalAmount.toFixed(2)}`}
            bold
          />
          <Field
            label={locale === "es" ? "Comisión plataforma (30%)" : "Platform Fee (30%)"}
            value={`$${platformFee.toFixed(2)}`}
          />
          <Field
            label={locale === "es" ? "Pago al técnico (70%)" : "Technician Payout (70%)"}
            value={`$${contractorPayout.toFixed(2)}`}
            bold
          />
          <Field
            label={locale === "es" ? "Estado del pago" : "Payment Status"}
            value={booking.paymentStatus}
          />
          {booking.paymentIntentId && (
            <Field label="Stripe Intent" value={booking.paymentIntentId} mono />
          )}
        </Section>

        {/* Timestamps */}
        <Section title={locale === "es" ? "Historial" : "Timeline"}>
          <Field
            label={locale === "es" ? "Creada" : "Created"}
            value={fmtDateTime(booking.createdAt, locale)}
          />
          <Field
            label={locale === "es" ? "Actualizada" : "Updated"}
            value={fmtDateTime(booking.updatedAt, locale)}
          />
        </Section>

        {/* Customer Review */}
        {booking.reviewRating && (
          <Section title={locale === "es" ? "Reseña del Cliente" : "Customer Review"}>
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map((s) => (
                <svg key={s} className={`w-5 h-5 ${s <= booking.reviewRating! ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-2 text-sm font-semibold text-gray-700">{booking.reviewRating}/5</span>
            </div>
            {booking.reviewComment && (
              <p className="text-sm text-gray-600 italic">"{booking.reviewComment}"</p>
            )}
            {booking.reviewedAt && (
              <p className="text-xs text-gray-400 mt-1">{fmtDateTime(booking.reviewedAt, locale)}</p>
            )}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  bold,
  mono,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-xs text-gray-500 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-right break-all ${bold ? "font-semibold text-gray-900" : "text-gray-700"} ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
