"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface AdminPageProps {
  params: Promise<{ lang: "en" | "es" }>;
}

interface Stats {
  contractors: { total: number; pending: number; active: number };
  bookings: { total: number; pending: number; completed: number };
  revenue: { total: number };
}

async function fetchAdminStats(): Promise<Stats> {
  const res = await fetch("/api/admin/stats", { cache: "no-store" });
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-sm text-gray-500">Rubens Auto Detail</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/${locale}/admin/contractors`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {t.manageContractors}
          </Link>
          <Link
            href={`/${locale}/admin/bookings`}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            {t.manageBookings}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label={locale === "es" ? "Contratistas Pendientes" : "Pending Contractors"}
            value={stats?.contractors.pending ?? "—"}
            color="yellow"
            icon="⏳"
          />
          <StatCard
            label={locale === "es" ? "Contratistas Activos" : "Active Contractors"}
            value={stats?.contractors.active ?? "—"}
            color="green"
            icon="✅"
          />
          <StatCard
            label={locale === "es" ? "Reservas Activas" : "Active Bookings"}
            value={stats?.bookings.pending ?? "—"}
            color="blue"
            icon="📅"
          />
          <StatCard
            label={locale === "es" ? "Ingresos Totales" : "Total Revenue"}
            value={stats ? `$${stats.revenue.total.toFixed(2)}` : "—"}
            color="purple"
            icon="💰"
          />
        </div>

        {/* Two-column layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Contractor summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t.contractors}</h2>
              <Link
                href={`/${locale}/admin/contractors`}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                {locale === "es" ? "Ver todos →" : "View all →"}
              </Link>
            </div>
            <div className="space-y-3">
              <SummaryRow
                label={t.total}
                value={stats?.contractors.total ?? 0}
                color="gray"
              />
              <SummaryRow
                label={t.pending}
                value={stats?.contractors.pending ?? 0}
                color="yellow"
                highlight={stats?.contractors.pending ? stats.contractors.pending > 0 : false}
              />
              <SummaryRow
                label={t.active}
                value={stats?.contractors.active ?? 0}
                color="green"
              />
            </div>
            {stats?.contractors.pending ? (
              <Link
                href={`/${locale}/admin/contractors?status=pending`}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors"
              >
                ⚡ {stats.contractors.pending} {t.reviewApplications}
              </Link>
            ) : null}
          </div>

          {/* Booking summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t.bookings}</h2>
              <Link
                href={`/${locale}/admin/bookings`}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                {locale === "es" ? "Ver todos →" : "View all →"}
              </Link>
            </div>
            <div className="space-y-3">
              <SummaryRow
                label={t.total}
                value={stats?.bookings.total ?? 0}
                color="gray"
              />
              <SummaryRow
                label={t.pending}
                value={stats?.bookings.pending ?? 0}
                color="blue"
              />
              <SummaryRow
                label={t.completed}
                value={stats?.bookings.completed ?? 0}
                color="green"
              />
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
