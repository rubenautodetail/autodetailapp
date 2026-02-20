"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface AdminContractorsProps {
  params: Promise<{ lang: "en" | "es" }>;
}

interface Contractor {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: "pending" | "active" | "rejected" | "suspended";
  performanceTier: string;
  averageRating: number;
  totalJobs: number;
  createdAt: string;
  stripeOnboardingComplete?: boolean;
}

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || "";

const STATUS_OPTIONS = ["all", "pending", "active", "rejected", "suspended"] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-gray-100 text-gray-700",
};

export default function AdminContractorsPage({ params }: AdminContractorsProps) {
  const { lang } = use(params);
  const locale = lang || "en";
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const t = {
    title: locale === "es" ? "Gestión de Contratistas" : "Contractor Management",
    back: locale === "es" ? "← Volver al Panel" : "← Back to Dashboard",
    all: locale === "es" ? "Todos" : "All",
    pending: locale === "es" ? "Pendientes" : "Pending",
    active: locale === "es" ? "Activos" : "Active",
    rejected: locale === "es" ? "Rechazados" : "Rejected",
    suspended: locale === "es" ? "Suspendidos" : "Suspended",
    name: locale === "es" ? "Nombre" : "Name",
    contact: locale === "es" ? "Contacto" : "Contact",
    status: locale === "es" ? "Estado" : "Status",
    joined: locale === "es" ? "Registro" : "Joined",
    actions: locale === "es" ? "Acciones" : "Actions",
    approve: locale === "es" ? "Aprobar" : "Approve",
    reject: locale === "es" ? "Rechazar" : "Reject",
    approved: locale === "es" ? "¡Aprobado!" : "Approved!",
    noContractors: locale === "es" ? "No hay contratistas" : "No contractors found",
    rejectTitle: locale === "es" ? "Rechazar Solicitud" : "Reject Application",
    rejectPlaceholder: locale === "es" ? "Motivo del rechazo (opcional)..." : "Reason for rejection (optional)...",
    cancel: locale === "es" ? "Cancelar" : "Cancel",
    confirmReject: locale === "es" ? "Confirmar Rechazo" : "Confirm Rejection",
    stripe: "Stripe",
  };

  const fetchContractors = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (statusFilter !== "all") qs.set("status", statusFilter);
      const res = await fetch(`${STRAPI_URL}/api/admin/contractors?${qs}`, {
        headers: { "x-admin-secret": ADMIN_SECRET },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setContractors(json.data || []);
      setTotal(json.meta?.total || 0);
    } catch {
      setContractors([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchContractors(); }, [fetchContractors]);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${STRAPI_URL}/api/admin/contractors/${id}/approve`, {
        method: "PUT",
        headers: { "x-admin-secret": ADMIN_SECRET, "Content-Type": "application/json" },
      });
      if (res.ok) await fetchContractors();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    try {
      const res = await fetch(`${STRAPI_URL}/api/admin/contractors/${rejectModal.id}/reject`, {
        method: "PUT",
        headers: { "x-admin-secret": ADMIN_SECRET, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        setRejectModal(null);
        setRejectReason("");
        await fetchContractors();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Link href={`/${locale}/admin`} className="text-sm text-blue-600 hover:underline mb-2 block">
          {t.back}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-sm text-gray-500">{total} {locale === "es" ? "contratistas en total" : "contractors total"}</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t[s as keyof typeof t] || s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : contractors.length === 0 ? (
            <div className="text-center py-16 text-gray-500">{t.noContractors}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.name}</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.contact}</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.status}</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.stripe}</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.joined}</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contractors.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{c.name}</div>
                        <div className="text-xs text-gray-500">
                          {c.averageRating > 0 && `⭐ ${c.averageRating.toFixed(1)} · `}
                          {c.totalJobs} {locale === "es" ? "trabajos" : "jobs"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">{c.email}</div>
                        <div className="text-xs text-gray-500">{c.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-700"}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {c.stripeOnboardingComplete ? (
                          <span className="text-green-600 text-sm">✓ Connected</span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString(locale)}
                      </td>
                      <td className="px-6 py-4">
                        {c.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(c.id)}
                              disabled={actionLoading === c.id}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === c.id ? "..." : t.approve}
                            </button>
                            <button
                              onClick={() => setRejectModal({ id: c.id, name: c.name })}
                              disabled={actionLoading === c.id}
                              className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              {t.reject}
                            </button>
                          </div>
                        )}
                        {c.status === "active" && (
                          <span className="text-green-600 text-sm font-medium">✓ {t.approved}</span>
                        )}
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

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{t.rejectTitle}</h3>
            <p className="text-sm text-gray-600 mb-4">{rejectModal.name}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t.rejectPlaceholder}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading !== null}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading !== null ? "..." : t.confirmReject}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
