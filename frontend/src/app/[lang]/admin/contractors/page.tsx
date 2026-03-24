"use client";

import { useState, useEffect, use, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { adminFetch } from "@/lib/adminFetch";
import { fmtDate } from "@/lib/dateUtils";

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
    // Application detail fields
    address: string | null;
    business_name: string | null;
    service_area_zips: string[] | null;
    payment_preference: string | null;
    // Banking details
    zelle_contact: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_routing_number: string | null;
    bank_account_type: string | null;
}

type FilterStatus = "all" | "pending" | "active" | "rejected";

function displayStatus(c: Contractor): string {
    if (c.approval_status === "pending") return "pending";
    if (c.approval_status === "rejected") return "rejected";
    if (c.role === "contractor" && c.approval_status === "approved") return "active";
    return "unknown";
}

const STATUS_COLORS: Record<string, string> = {
    pending:  "bg-yellow-100 text-yellow-800",
    active:   "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    unknown:  "bg-gray-100 text-gray-700",
};

const PAYMENT_LABELS: Record<string, { en: string; es: string }> = {
    direct_deposit: { en: "ACH / Direct Deposit", es: "ACH / Depósito Directo" },
    zelle:          { en: "Zelle",                es: "Zelle"                  },
    check:          { en: "Check",                es: "Cheque"                 },
    cash:           { en: "Cash",                 es: "Efectivo"               },
};

function paymentLabel(pref: string | null, isEs: boolean): string {
    if (!pref) return "—";
    return isEs ? (PAYMENT_LABELS[pref]?.es ?? pref) : (PAYMENT_LABELS[pref]?.en ?? pref);
}

// ── Detail modal ─────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5 py-3 border-b border-gray-100 last:border-0">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
            <span className="text-sm text-gray-900 font-medium break-words">{value || "—"}</span>
        </div>
    );
}

// ── Main content ─────────────────────────────────────────────────────────────

function AdminContractorsContent({ locale }: { locale: string }) {
    const searchParams = useSearchParams();
    const initialStatus = (searchParams.get("status") as FilterStatus) || "all";

    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<FilterStatus>(initialStatus);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modals
    const [rejectModal, setRejectModal]       = useState<{ id: string; name: string } | null>(null);
    const [rejectReason, setRejectReason]     = useState("");
    const [terminateModal, setTerminateModal] = useState<{ id: string; name: string } | null>(null);
    const [detailModal, setDetailModal]       = useState<Contractor | null>(null);

    const isEs = locale === "es";

    const t = {
        title:            isEs ? "Gestión de Contratistas"      : "Contractor Management",
        back:             isEs ? "← Volver al Panel"            : "← Back to Dashboard",
        all:              isEs ? "Todos"                         : "All",
        pending:          isEs ? "Pendientes"                   : "Pending",
        active:           isEs ? "Activos"                      : "Active",
        rejected:         isEs ? "Rechazados"                   : "Rejected",
        name:             isEs ? "Nombre"                       : "Name",
        contact:          isEs ? "Contacto"                     : "Contact",
        status:           isEs ? "Estado"                       : "Status",
        joined:           isEs ? "Registro"                     : "Joined",
        actions:          isEs ? "Acciones"                     : "Actions",
        approve:          isEs ? "Aprobar"                      : "Approve",
        reject:           isEs ? "Rechazar"                     : "Reject",
        terminate:        isEs ? "Terminar"                     : "Terminate",
        viewDetails:      isEs ? "Ver Detalles"                 : "View Details",
        noContractors:    isEs ? "No hay contratistas"          : "No contractors found",
        // Reject modal
        rejectTitle:       isEs ? "Rechazar Solicitud"           : "Reject Application",
        rejectPlaceholder: isEs ? "Motivo del rechazo (opcional)..." : "Reason for rejection (optional)...",
        cancel:            isEs ? "Cancelar"                     : "Cancel",
        confirmReject:     isEs ? "Confirmar Rechazo"            : "Confirm Rejection",
        // Terminate modal
        terminateTitle:    isEs ? "Terminar Contratista"         : "Terminate Contractor",
        terminateMsg:      isEs
            ? "¿Estás seguro? Se revocará el acceso de este contratista inmediatamente."
            : "Are you sure? This contractor's access will be revoked immediately.",
        confirmTerminate:  isEs ? "Confirmar Terminación"        : "Confirm Termination",
        // Detail modal labels
        detailTitle:       isEs ? "Perfil del Contratista"       : "Contractor Profile",
        fullName:          isEs ? "Nombre completo"              : "Full Name",
        emailLabel:        isEs ? "Correo electrónico"           : "Email",
        phoneLabel:        isEs ? "Teléfono"                     : "Phone",
        businessName:      isEs ? "Nombre del negocio"           : "Business Name",
        addressLabel:      isEs ? "Dirección"                    : "Address",
        serviceZips:       isEs ? "Códigos ZIP de servicio"      : "Service ZIP Codes",
        paymentPref:       isEs ? "Método de pago preferido"     : "Preferred Payment Method",
        zelleContact:      isEs ? "Teléfono/Correo de Zelle"      : "Zelle Phone/Email",
        bankName:          isEs ? "Banco"                         : "Bank Name",
        bankAccountNum:    isEs ? "Número de cuenta"              : "Account Number",
        bankRoutingNum:    isEs ? "Número de ruta"                : "Routing Number",
        bankAccountType:   isEs ? "Tipo de cuenta"                : "Account Type",
        stripeStatus:      isEs ? "Estado de Stripe"              : "Stripe Status",
        jobsCompleted:     isEs ? "Trabajos completados"         : "Jobs Completed",
        ratingLabel:       isEs ? "Calificación"                 : "Rating",
        registeredOn:      isEs ? "Registrado el"                : "Registered On",
    };

    const STATUS_FILTERS: { key: FilterStatus; label: string }[] = [
        { key: "all",      label: t.all      },
        { key: "pending",  label: t.pending  },
        { key: "active",   label: t.active   },
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
            if (res.ok) {
                setDetailModal(null);
                await fetchContractors();
            }
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
                setDetailModal(null);
                await fetchContractors();
            }
        } finally {
            setActionLoading(null);
        }
    };

    const handleTerminate = async () => {
        if (!terminateModal) return;
        setActionLoading(terminateModal.id);
        try {
            const res = await adminFetch("/api/admin/contractors/reject", {
                method: "POST",
                body: JSON.stringify({ userId: terminateModal.id }),
            });
            if (res.ok) {
                setTerminateModal(null);
                setDetailModal(null);
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
                    {contractors.filter((c) => c.approval_status === "pending").length > 0 && statusFilter !== "pending" && (
                        <button
                            onClick={() => setStatusFilter("pending")}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors"
                        >
                            ⚡ {contractors.filter((c) => c.approval_status === "pending").length}{" "}
                            {isEs ? "solicitudes pendientes" : "pending applications"}
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
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                statusFilter === key
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
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {isEs ? "Pago" : "Payment"}
                                        </th>
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
                                                    {c.business_name && (
                                                        <div className="text-xs text-gray-500">{c.business_name}</div>
                                                    )}
                                                    <div className="text-xs text-gray-400 mt-0.5">
                                                        {c.rating != null && `⭐ ${c.rating.toFixed(1)} · `}
                                                        {c.total_jobs_completed ?? 0} {isEs ? "trabajos" : "jobs"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-700">{c.email ?? "—"}</div>
                                                    <div className="text-xs text-gray-500">{c.phone ?? "—"}</div>
                                                    {c.address && (
                                                        <div className="text-xs text-gray-400 mt-0.5 max-w-[180px] truncate">{c.address}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
                                                        {isEs
                                                            ? { pending: "Pendiente", active: "Activo", rejected: "Rechazado", unknown: "—" }[status]
                                                            : status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">
                                                        {paymentLabel(c.payment_preference, isEs)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {fmtDate(c.created_at, locale)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2 flex-wrap">
                                                        {/* View details — always visible */}
                                                        <button
                                                            onClick={() => setDetailModal(c)}
                                                            className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                        >
                                                            {t.viewDetails}
                                                        </button>

                                                        {/* Approve / Reject for pending */}
                                                        {c.approval_status === "pending" && (
                                                            <>
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
                                                            </>
                                                        )}

                                                        {/* Terminate for active */}
                                                        {status === "active" && (
                                                            <button
                                                                onClick={() => setTerminateModal({ id: c.id, name: c.full_name ?? c.email ?? c.id })}
                                                                disabled={actionLoading === c.id}
                                                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                            >
                                                                {actionLoading === c.id ? "..." : t.terminate}
                                                            </button>
                                                        )}
                                                    </div>
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

            {/* ── Detail Modal ──────────────────────────────────────────────────── */}
            {detailModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{t.detailTitle}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[displayStatus(detailModal)]}`}>
                                        {displayStatus(detailModal)}
                                    </span>
                                </p>
                            </div>
                            <button
                                onClick={() => setDetailModal(null)}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="overflow-y-auto flex-1 px-6 py-4">
                            <DetailRow label={t.fullName}    value={detailModal.full_name} />
                            <DetailRow label={t.emailLabel}  value={detailModal.email} />
                            <DetailRow label={t.phoneLabel}  value={detailModal.phone} />
                            <DetailRow label={t.businessName} value={detailModal.business_name} />
                            <DetailRow label={t.addressLabel} value={detailModal.address} />
                            <DetailRow
                                label={t.serviceZips}
                                value={detailModal.service_area_zips?.join(", ") || null}
                            />
                            <DetailRow
                                label={t.paymentPref}
                                value={
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        detailModal.payment_preference
                                            ? "bg-blue-50 text-blue-700"
                                            : "bg-gray-100 text-gray-500"
                                    }`}>
                                        {paymentLabel(detailModal.payment_preference, isEs)}
                                    </span>
                                }
                            />
                            {/* Zelle details */}
                            {detailModal.payment_preference === "zelle" && (
                                <DetailRow label={t.zelleContact} value={detailModal.zelle_contact} />
                            )}
                            {/* Bank account details */}
                            {detailModal.payment_preference === "direct_deposit" && (
                                <>
                                    <DetailRow label={t.bankName}       value={detailModal.bank_name} />
                                    <DetailRow label={t.bankAccountNum} value={detailModal.bank_account_number} />
                                    <DetailRow label={t.bankRoutingNum} value={detailModal.bank_routing_number} />
                                    <DetailRow
                                        label={t.bankAccountType}
                                        value={detailModal.bank_account_type
                                            ? (detailModal.bank_account_type === "checking"
                                                ? (isEs ? "Cuenta corriente" : "Checking")
                                                : (isEs ? "Cuenta de ahorros" : "Savings"))
                                            : null}
                                    />
                                </>
                            )}
                            <DetailRow
                                label={t.stripeStatus}
                                value={
                                    detailModal.onboarding_complete
                                        ? <span className="text-green-600">✓ {isEs ? "Conectado" : "Connected"}</span>
                                        : detailModal.stripe_account_id
                                            ? <span className="text-yellow-600">⚠ {isEs ? "Incompleto" : "Incomplete"}</span>
                                            : <span className="text-gray-400">{isEs ? "No conectado" : "Not connected"}</span>
                                }
                            />
                            <DetailRow label={t.jobsCompleted} value={String(detailModal.total_jobs_completed ?? 0)} />
                            <DetailRow
                                label={t.ratingLabel}
                                value={detailModal.rating != null ? `⭐ ${detailModal.rating.toFixed(1)}` : null}
                            />
                            <DetailRow
                                label={t.registeredOn}
                                value={fmtDate(detailModal.created_at, locale, { year: "numeric", month: "long", day: "numeric" })}
                            />
                        </div>

                        {/* Modal footer — action buttons */}
                        <div className="border-t border-gray-200 px-6 py-4 flex flex-wrap gap-2 justify-end">
                            {detailModal.approval_status === "pending" && (
                                <>
                                    <button
                                        onClick={() => handleApprove(detailModal.id)}
                                        disabled={actionLoading === detailModal.id}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                    >
                                        {actionLoading === detailModal.id ? "..." : t.approve}
                                    </button>
                                    <button
                                        onClick={() => setRejectModal({ id: detailModal.id, name: detailModal.full_name ?? detailModal.email ?? detailModal.id })}
                                        disabled={actionLoading === detailModal.id}
                                        className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                                    >
                                        {t.reject}
                                    </button>
                                </>
                            )}
                            {displayStatus(detailModal) === "active" && (
                                <button
                                    onClick={() => setTerminateModal({ id: detailModal.id, name: detailModal.full_name ?? detailModal.email ?? detailModal.id })}
                                    disabled={actionLoading === detailModal.id}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                    {actionLoading === detailModal.id ? "..." : t.terminate}
                                </button>
                            )}
                            <button
                                onClick={() => setDetailModal(null)}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                {t.cancel}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reject modal ──────────────────────────────────────────────────── */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{t.rejectTitle}</h3>
                        <p className="text-sm text-gray-600 mb-4">{rejectModal.name}</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder={t.rejectPlaceholder}
                            rows={3}
                            className="w-full bg-white px-4 py-3 border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
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

            {/* ── Terminate modal ───────────────────────────────────────────────── */}
            {terminateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{t.terminateTitle}</h3>
                        <p className="text-sm font-medium text-gray-800 mb-2">{terminateModal.name}</p>
                        <p className="text-sm text-gray-600 mb-6">{t.terminateMsg}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setTerminateModal(null)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={handleTerminate}
                                disabled={actionLoading !== null}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading !== null ? "..." : t.confirmTerminate}
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
