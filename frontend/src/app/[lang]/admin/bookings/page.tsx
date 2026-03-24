"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";

interface AdminBookingsProps {
  params: Promise<{ lang: "en" | "es" }>;
}

interface Booking {
  id: number;
  customerName?: string;
  customerEmail?: string;
  status: string;
  total?: number;
  scheduledDate?: string;
  timeWindow?: string;
  createdAt: string;
  serviceName?: string;
  zipCode?: string;
  contractorId?: string;
  contractorName?: string;
}

const STATUS_OPTIONS = ["all", "pending", "pending_assignment", "confirmed", "in_progress", "completed", "cancelled"] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  pending_assignment: "bg-orange-100 text-orange-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const PAGE_SIZE = 25;

export default function AdminBookingsPage({ params }: AdminBookingsProps) {
  const { lang } = use(params);
  const locale = lang || "en";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [stats, setStats] = useState<{
    todayCount: number;
    pendingAssignment: number;
    totalRevenue: number;
    completedThisMonth: number;
  } | null>(null);

  const t = {
    title: locale === "es" ? "Gestión de Reservas" : "Booking Management",
    back: locale === "es" ? "← Volver al Panel" : "← Back to Dashboard",
    noBookings: locale === "es" ? "No hay reservas" : "No bookings found",
    customer: locale === "es" ? "Cliente" : "Customer",
    service: locale === "es" ? "Servicio" : "Service",
    status: locale === "es" ? "Estado" : "Status",
    date: locale === "es" ? "Fecha" : "Date",
    total: locale === "es" ? "Total" : "Total",
    contractor: locale === "es" ? "Técnico" : "Technician",
    actions: locale === "es" ? "Acciones" : "Actions",
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({ status: statusFilter, page: String(page) });
      const res = await adminFetch(`/api/admin/bookings/list?${params}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");

      const { bookings: list, total: count } = await res.json();
      setBookings(list ?? []);
      setTotal(count ?? 0);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setBookings([]);
      setFetchError(locale === "es" ? "Error al cargar reservas. Intenta de nuevo." : "Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, locale]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  useEffect(() => {
    adminFetch('/api/admin/bookings/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data); })
      .catch(() => { /* non-fatal */ });
  }, []);

  async function handleAction(bookingId: number, action: "cancel" | "requeue") {
    setActionLoading(bookingId);
    setMessage(null);
    try {
      const endpoint = action === "cancel"
        ? "/api/admin/bookings/cancel"
        : "/api/admin/bookings/requeue";

      const res = await adminFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ bookingId }),
      });

      if (!res.ok) throw new Error("Failed");

      const newStatus = action === "cancel" ? "cancelled" : "pending_assignment";
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, status: newStatus, contractorId: action === "requeue" ? undefined : b.contractorId, contractorName: action === "requeue" ? undefined : b.contractorName }
            : b
        )
      );
      setMessage({
        type: "success",
        text: action === "cancel"
          ? (locale === "es" ? "Reserva cancelada." : "Booking cancelled.")
          : (locale === "es" ? "Trabajo re-asignado a la cola." : "Job re-queued for assignment."),
      });
    } catch {
      setMessage({ type: "error", text: locale === "es" ? "Error. Inténtalo de nuevo." : "Action failed. Try again." });
    } finally {
      setActionLoading(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Link href={`/${locale}/admin`} className="text-sm text-blue-600 hover:underline mb-2 block">
          {t.back}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-sm text-gray-500">
          {total} {locale === "es" ? "reservas en total" : "bookings total"}
        </p>
        {fetchError && (
          <div className="mt-3 px-4 py-2 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
            {fetchError}
          </div>
        )}
        {message && (
          <div className={`mt-3 px-4 py-2 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Stats bar */}
        {stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {locale === "es" ? "Hoy" : "Today"}
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayCount}</p>
            </div>
            <div className="bg-white border border-orange-200 rounded-xl px-5 py-4">
              <p className="text-xs font-medium text-orange-500 uppercase tracking-wider mb-1">
                {locale === "es" ? "Sin Asignar" : "Pending Assignment"}
              </p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingAssignment}</p>
            </div>
            <div className="bg-white border border-green-200 rounded-xl px-5 py-4">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">
                {locale === "es" ? "Completados este Mes" : "Completed This Month"}
              </p>
              <p className="text-2xl font-bold text-green-700">{stats.completedThisMonth}</p>
            </div>
            <div className="bg-white border border-blue-200 rounded-xl px-5 py-4">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                {locale === "es" ? "Ingresos Totales" : "Total Revenue"}
              </p>
              <p className="text-2xl font-bold text-blue-700">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl px-5 py-4 animate-pulse">
                <div className="h-2.5 w-20 bg-gray-200 rounded mb-2" />
                <div className="h-7 w-12 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                statusFilter === s
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {s === "all" ? (locale === "es" ? "Todos" : "All") : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {[t.customer, t.service, t.status, t.date, t.contractor, t.total, t.actions].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...Array(8)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-5 py-4">
                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-1" />
                        <div className="h-3 w-36 bg-gray-100 rounded animate-pulse" />
                      </td>
                      <td className="px-5 py-4"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-20 bg-gray-100 rounded animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-14 bg-gray-200 rounded animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-8 w-20 bg-gray-200 rounded animate-pulse" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 text-gray-500">{t.noBookings}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.customer}</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.service}</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.status}</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.date}</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.contractor}</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.total}</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/${locale}/admin/bookings/${b.id}`} className="block hover:text-blue-600">
                          <div className="text-sm font-medium text-gray-900">{b.customerName || "—"}</div>
                          <div className="text-xs text-gray-500">{b.customerEmail || ""}</div>
                          {b.zipCode && <div className="text-xs text-gray-400">{b.zipCode}</div>}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {b.serviceName || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[b.status] || "bg-gray-100 text-gray-700"}`}>
                          {b.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {b.scheduledDate
                          ? new Date(b.scheduledDate).toLocaleDateString(locale)
                          : new Date(b.createdAt).toLocaleDateString(locale)}
                        {b.timeWindow && (
                          <div className="text-xs text-gray-400 capitalize">{b.timeWindow}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {b.contractorName ? (
                          <span className="text-sm text-gray-700">{b.contractorName}</span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            {locale === "es" ? "Sin asignar" : "Unassigned"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">
                        {b.total != null ? `$${b.total.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          <Link
                            href={`/${locale}/admin/bookings/${b.id}`}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            {locale === "es" ? "Ver" : "View"}
                          </Link>
                          {b.status !== "cancelled" && b.status !== "completed" && (
                            <>
                              <button
                                onClick={() => handleAction(b.id, "requeue")}
                                disabled={actionLoading === b.id}
                                className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded hover:bg-yellow-100 transition-colors disabled:opacity-50"
                              >
                                {locale === "es" ? "Re-asignar" : "Re-queue"}
                              </button>
                              <button
                                onClick={() => handleAction(b.id, "cancel")}
                                disabled={actionLoading === b.id}
                                className="px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                {locale === "es" ? "Cancelar" : "Cancel"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              {locale === "es" ? `Página ${page} de ${totalPages}` : `Page ${page} of ${totalPages}`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                ←
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
