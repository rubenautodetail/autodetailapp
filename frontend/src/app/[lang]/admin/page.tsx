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
  revenue: { total: number; month: number };
  attention: { pendingAssignment: number; unpaidPayouts: number; noZoneCoverage?: number };
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

  const attentionItems = [
    { count: stats?.attention.noZoneCoverage ?? 0, href: `/${locale}/admin/bookings`, label: locale === "es" ? "Trabajos sin contratista en su zona (asígnalos a mano)" : "Jobs with no contractor in their zone (assign by hand)" },
    { count: stats?.attention.pendingAssignment ?? 0, href: `/${locale}/admin/bookings`, label: locale === "es" ? "Reservas por asignar a un contratista" : "Bookings to assign to a contractor" },
    { count: stats?.attention.unpaidPayouts ?? 0, href: `/${locale}/admin/payouts`, label: locale === "es" ? "Contratistas con pagos por hacer" : "Contractors waiting to be paid" },
    { count: stats?.contractors.pending ?? 0, href: `/${locale}/admin/contractors?status=pending`, label: locale === "es" ? "Solicitudes de contratistas por aprobar" : "Contractor applications to review" },
  ].filter((i) => i.count > 0);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <p className="text-sm text-gray-500 mt-0.5">Lux Auto Detail Services</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Needs attention */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {locale === "es" ? "Requiere tu atención" : "Needs your attention"}
          </h2>
          {attentionItems.length === 0 ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 font-medium">
              {locale === "es" ? "Todo al día ✓" : "All caught up ✓"}
            </div>
          ) : (
            <div className="space-y-2">
              {attentionItems.map((it) => (
                <Link key={it.href} href={it.href} className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors">
                  <span className="flex-shrink-0 min-w-[2.25rem] h-9 px-2 rounded-full bg-yellow-200 text-yellow-900 text-sm font-bold flex items-center justify-center">{it.count}</span>
                  <span className="flex-1 text-sm font-semibold text-yellow-900">{it.label}</span>
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatCard
            label={locale === "es" ? "Contratistas activos" : "Active contractors"}
            value={stats?.contractors.active ?? "—"}
            color="green"
            icon="✅"
          />
          <StatCard
            label={locale === "es" ? "Trabajos completados" : "Completed jobs"}
            value={stats?.bookings.completed ?? "—"}
            color="blue"
            icon="📅"
          />
          <StatCard
            label={locale === "es" ? "Ingresos del mes" : "Revenue this month"}
            value={stats ? `$${stats.revenue.month.toFixed(0)}` : "—"}
            color="purple"
            icon="💰"
          />
          <StatCard
            label={locale === "es" ? "Ingresos totales" : "Total revenue"}
            value={stats ? `$${stats.revenue.total.toFixed(0)}` : "—"}
            color="yellow"
            icon="🏦"
          />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
