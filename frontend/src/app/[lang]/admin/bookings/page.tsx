"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

  const t = {
    title: locale === "es" ? "Gestión de Reservas" : "Booking Management",
    back: locale === "es" ? "← Volver al Panel" : "← Back to Dashboard",
    noBookings: locale === "es" ? "No hay reservas" : "No bookings found",
    customer: locale === "es" ? "Cliente" : "Customer",
    service: locale === "es" ? "Servicio" : "Service",
    status: locale === "es" ? "Estado" : "Status",
    date: locale === "es" ? "Fecha" : "Date",
    total: locale === "es" ? "Total" : "Total",
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from("bookings")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: Booking[] = (data ?? []).map((b: any) => ({
        id: b.id,
        customerName: b.customer_name ?? undefined,
        customerEmail: b.customer_email ?? undefined,
        status: b.status ?? "pending",
        total: b.total_amount != null ? parseFloat(String(b.total_amount)) : undefined,
        scheduledDate: b.date ?? undefined,
        timeWindow: b.time_window ?? undefined,
        createdAt: b.created_at,
        serviceName: b.service_name ?? undefined,
        zipCode: b.zip_code ?? undefined,
      }));

      setBookings(mapped);
      setTotal(count ?? 0);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

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
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
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
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.total}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-gray-900">{b.customerName || "—"}</div>
                        <div className="text-xs text-gray-500">{b.customerEmail || ""}</div>
                        {b.zipCode && <div className="text-xs text-gray-400">{b.zipCode}</div>}
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
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">
                        {b.total != null ? `$${b.total.toFixed(2)}` : "—"}
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
