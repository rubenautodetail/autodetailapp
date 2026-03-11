"use client";

import { useState, useEffect, use, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { adminFetch } from "@/lib/adminFetch";

interface AdminContractorsProps {
    params: Promise<{ lang: "en" | "es" }>;
}

interface Contractor {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
    approval_status: "pending" | "approved" | "rejected" | null;
    stripe_account_id: string | null;
    onboarding_complete: boolean | null;
    rating: number | null;
    total_jobs_completed: number | null;
    created_at: string;
}

type FilterStatus = "all" | "pending" | "active" | "rejected";

function displayStatus(c: Contractor): string {
    if (c.approval_status === "pending") return "pending";
    if (c.approval_status === "rejected") return "rejected";
    if (c.role === "contractor" && c.approval_status === "approved") return "active";
    return "unknown";
}

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    unknown: "bg-gray-100 text-gray-700",
};

function AdminContractorsContent({ locale }: { locale: string }) {
    const searchParams = useSearchParams();
    const initialStatus = (searchParams.get("status") as FilterStatus) || "all";

    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<FilterStatus>(initialStatus);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const isEs = locale === "es";

    const t = {
        title: isEs ? "Gestión de Contratistas" : "Contractor Management",
        back: isEs ? "← Volver al Panel" : "← Back to Dashboard",
        all: isEs ? "Todos" : "All",
        pending: isEs ? "Pendientes" : "Pending",
        active: isEs ? "Activos" : "Active",
        rejected: isEs ? "Rechazados" : "Rejected",
        name: isEs ? "Nombre" : "Name",
        contact: isEs ? "Contacto" : "Contact",
        status: isEs ? "Estado" : "Status",
        stripe: "Stripe",
        joined: isEs ? "Registro" : "Joined",
        actions: isEs ? "Acciones" : "Actions",
        approve: isEs ? "Aprobar" : "Approve",
        reject: isEs ? "Rechazar" : "Reject",
        noContractors: isEs ? "No hay contratistas" : "No contractors found",
        rejectTitle: isEs ? "Rechazar Solicitud" : "Reject Application",
        rejectPlaceholder: isEs ? "Motivo del rechazo (opcional)..." : "Reason for rejection (optional)...",
        cancel: isEs ? "Cancelar" : "Cancel",
        confirmReject: isEs ? "Confirmar Rechazo" : "Confirm Rejection",
    };

    const STATUS_FILTERS: { key: FilterStatus; label: string }[] = [
        { key: "all", label: t.all },
        { key: "pending", label: t.pending },
        { key: "active", label: t.active },
        { key: "rejected", label: t.rejected },
    ];

    const fetchContractors = useCallback(async () => {
        setLoading(true);
        try {
            const qs = new URLSearchParams({ status: statusFilter });
            const res = await adminFetch(`/api/admin/contractors?${qs}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            setContractors(json.data ?? []);
            setTotal(json.total ?? 0);
        } catch {
            setContractors([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchContractors(); }, [fetchContractors]);

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            const res = await adminFetch("/api/admin/contractors/approve", {
                method: "POST",
                body: JSON.stringify({ userId: id }),
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
            const res = await adminFetch("/api/admin/contractors/reject", {
                method: "POST",
                body: JSON.stringify({ userId: rejectModal.id, reason: rejectReason }),
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <Link href={`/${locale}/admin`} className="text-sm text-blue-600 hover:underline mb-2 block">
                    {t.back}
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
                        <p className="text-sm text-gray-500">
                            {total} {isEs ? "contratistas en total" : "contractors total"}
                        </p>
                    </div>
                    {/* Pending badge */}
                    {contractors.filter((c) => c.approval_status === "pending").length > 0 && statusFilter !== "pending" && (
                        <button
                            onClick={() => setStatusFilter("pending")}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors"
                        >
                            ⚡ {contractors.filter((c) => c.approval_status === "pending").length} {isEs ? "solicitudes pendientes" : "pending applications"}
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Status filter tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {STATUS_FILTERS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === key
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            {label}
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
                                    {contractors.map((c) => {
                                        const status = displayStatus(c);
                                        return (
                                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{c.full_name ?? "—"}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {c.rating != null && `⭐ ${c.rating.toFixed(1)} · `}
                                                        {c.total_jobs_completed ?? 0} {isEs ? "trabajos" : "jobs"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-700">{c.email ?? "—"}</div>
                                                    <div className="text-xs text-gray-500">{c.phone ?? "—"}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
                                                        {isEs
                                                            ? { pending: "Pendiente", active: "Activo", rejected: "Rechazado", unknown: "—" }[status]
                                                            : status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {c.onboarding_complete ? (
                                                        <span className="text-green-600 text-sm">✓ {isEs ? "Conectado" : "Connected"}</span>
                                                    ) : c.stripe_account_id ? (
                                                        <span className="text-yellow-600 text-sm">⚠ {isEs ? "Incompleto" : "Incomplete"}</span>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(c.created_at).toLocaleDateString(locale)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {c.approval_status === "pending" && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleApprove(c.id)}
                                                                disabled={actionLoading === c.id}
                                                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                            >
                                                                {actionLoading === c.id ? "..." : t.approve}
                                                            </button>
                                                            <button
                                                                onClick={() => setRejectModal({ id: c.id, name: c.full_name ?? c.email ?? c.id })}
                                                                disabled={actionLoading === c.id}
                                                                className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                                                            >
                                                                {t.reject}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {status === "active" && (
                                                        <span className="text-green-600 text-sm font-medium">✓ {isEs ? "Aprobado" : "Approved"}</span>
                                                    )}
                                                    {status === "rejected" && (
                                                        <span className="text-red-500 text-sm">✗ {isEs ? "Rechazado" : "Rejected"}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
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

export default function AdminContractorsPage({ params }: AdminContractorsProps) {
    const { lang } = use(params);
    const locale = lang || "en";
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        }>
            <AdminContractorsContent locale={locale} />
        </Suspense>
    );
}
