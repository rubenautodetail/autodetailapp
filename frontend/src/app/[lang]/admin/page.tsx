"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";

interface AdminPageProps {
  params: Promise<{ lang: "en" | "es" }>;
}

interface Stats {
  contractors: { total: number; pending: number; active: number };
  bookings: { total: number; pending: number; completed: number };
  revenue: { total: number };
}

async function fetchAdminStats(): Promise<Stats> {
  const res = await adminFetch("/api/admin/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export default function AdminDashboardPage({ params }: AdminPageProps) {
  const { lang } = use(params);
  const locale = lang || "en";
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch(() => setError("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  const t = {
    title: locale === "es" ? "Panel de Administración" : "Admin Dashboard",
    overview: locale === "es" ? "Resumen" : "Overview",
    contractors: locale === "es" ? "Contratistas" : "Contractors",
    bookings: locale === "es" ? "Reservas" : "Bookings",
    revenue: locale === "es" ? "Ingresos Totales" : "Total Revenue",
    pending: locale === "es" ? "Pendientes" : "Pending",
    active: locale === "es" ? "Activos" : "Active",
    completed: locale === "es" ? "Completadas" : "Completed",
    total: locale === "es" ? "Total" : "Total",
    manageContractors: locale === "es" ? "Gestionar Contratistas" : "Manage Contractors",
    manageBookings: locale === "es" ? "Gestionar Reservas" : "Manage Bookings",
    quickActions: locale === "es" ? "Acciones Rápidas" : "Quick Actions",
    reviewApplications: locale === "es" ? "Revisar Solicitudes" : "Review Applications",
    viewAllBookings: locale === "es" ? "Ver Todas las Reservas" : "View All Bookings",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-6" />
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Rubens Auto Detail</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatCard
            label={locale === "es" ? "Pendientes" : "Pending"}
            value={stats?.contractors.pending ?? "—"}
            color="yellow"
            icon="⏳"
          />
          <StatCard
            label={locale === "es" ? "Activos" : "Active"}
            value={stats?.contractors.active ?? "—"}
            color="green"
            icon="✅"
          />
          <StatCard
            label={locale === "es" ? "Reservas" : "Bookings"}
            value={stats?.bookings.pending ?? "—"}
            color="blue"
            icon="📅"
          />
          <StatCard
            label={locale === "es" ? "Ingresos" : "Revenue"}
            value={stats ? `$${stats.revenue.total.toFixed(0)}` : "—"}
            color="purple"
            icon="💰"
          />
        </div>

        {/* Quick actions — mobile-friendly card grid */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t.quickActions}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href={`/${locale}/admin/contractors`} className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 sm:p-5 text-white shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl sm:text-3xl mb-2 opacity-90">🔧</div>
              <div className="text-sm sm:text-base font-semibold">{t.manageContractors}</div>
              {(stats?.contractors.pending ?? 0) > 0 && (
                <span className="absolute top-3 right-3 min-w-[20px] h-5 flex items-center justify-center px-1.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                  {stats?.contractors.pending}
                </span>
              )}
            </Link>
            <Link href={`/${locale}/admin/bookings`} className="group rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 sm:p-5 text-white shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl sm:text-3xl mb-2 opacity-90">📅</div>
              <div className="text-sm sm:text-base font-semibold">{t.manageBookings}</div>
            </Link>
            <Link href={`/${locale}/admin/users`} className="group rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 sm:p-5 text-white shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl sm:text-3xl mb-2 opacity-90">👥</div>
              <div className="text-sm sm:text-base font-semibold">{locale === "es" ? "Usuarios" : "Users"}</div>
            </Link>
            <Link href={`/${locale}/admin/payments`} className="group rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 sm:p-5 text-white shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl sm:text-3xl mb-2 opacity-90">💳</div>
              <div className="text-sm sm:text-base font-semibold">{locale === "es" ? "Pagos" : "Payments"}</div>
            </Link>
          </div>
        </div>

        {/* Pending contractors alert */}
        {(stats?.contractors.pending ?? 0) > 0 && (
          <Link
            href={`/${locale}/admin/contractors?status=pending`}
            className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors"
          >
            <span className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-lg">⚡</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-yellow-900">
                {stats?.contractors.pending} {t.reviewApplications}
              </p>
              <p className="text-xs text-yellow-700 mt-0.5">
                {locale === "es" ? "Solicitudes esperando aprobación" : "Applications waiting for approval"}
              </p>
            </div>
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        {/* Summary cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Contractor summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">{t.contractors}</h2>
              <Link href={`/${locale}/admin/contractors`} className="text-xs text-blue-600 hover:underline font-medium">
                {locale === "es" ? "Ver todos →" : "View all →"}
              </Link>
            </div>
            <div className="space-y-2">
              <SummaryRow label={t.total} value={stats?.contractors.total ?? 0} color="gray" />
              <SummaryRow label={t.pending} value={stats?.contractors.pending ?? 0} color="yellow" highlight={(stats?.contractors.pending ?? 0) > 0} />
              <SummaryRow label={t.active} value={stats?.contractors.active ?? 0} color="green" />
            </div>
          </div>

          {/* Booking summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">{t.bookings}</h2>
              <Link href={`/${locale}/admin/bookings`} className="text-xs text-blue-600 hover:underline font-medium">
                {locale === "es" ? "Ver todos →" : "View all →"}
              </Link>
            </div>
            <div className="space-y-2">
              <SummaryRow label={t.total} value={stats?.bookings.total ?? 0} color="gray" />
              <SummaryRow label={t.pending} value={stats?.bookings.pending ?? 0} color="blue" />
              <SummaryRow label={t.completed} value={stats?.bookings.completed ?? 0} color="green" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  const colors: Record<string, string> = {
    yellow: "bg-yellow-50 border-yellow-200",
    green: "bg-green-50 border-green-200",
    blue: "bg-blue-50 border-blue-200",
    purple: "bg-purple-50 border-purple-200",
  };
  const textColors: Record<string, string> = {
    yellow: "text-yellow-700",
    green: "text-green-700",
    blue: "text-blue-700",
    purple: "text-purple-700",
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-bold ${textColors[color]}`}>{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}

function SummaryRow({ label, value, color, highlight }: { label: string; value: number; color: string; highlight?: boolean }) {
  const dot: Record<string, string> = {
    gray: "bg-gray-400",
    yellow: "bg-yellow-400",
    green: "bg-green-400",
    blue: "bg-blue-400",
  };
  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${highlight ? "bg-yellow-50" : ""}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${dot[color]}`} />
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${highlight ? "text-yellow-700" : "text-gray-900"}`}>{value}</span>
    </div>
  );
}
