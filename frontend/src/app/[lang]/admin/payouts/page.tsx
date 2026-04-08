"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";

interface AdminPayoutsProps {
    params: Promise<{ lang: "en" | "es" }>;
}

interface ContractorInfo {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    payment_preference: string | null;
    zelle_contact: string | null;
    bank_account_number: string | null;
}

interface UnpaidSummary {
    contractor_id: string;
    contractor: ContractorInfo | null;
    total_bookings: number;
    gross_amount: number;
    platform_fee: number;
    contractor_amount: number;
    oldest_job_date: string | null;
    newest_job_date: string | null;
    booking_codes?: string[];
}

interface Payout {
    id: number;
    contractor_id: string;
    period_start: string;
    period_end: string;
    total_bookings: number;
    gross_amount: number;
    platform_fee: number;
    contractor_amount: number;
    status: "pending" | "paid";
    payment_method: "ach" | "zelle" | "check" | "cash" | null;
    paid_at: string | null;
    notes: string | null;
    contractor: ContractorInfo | null;
}

type PaymentMethod = "ach" | "zelle" | "check" | "cash";
type Tab = "pay-now" | "history";

const PAYMENT_METHODS: { value: PaymentMethod; en: string; es: string; icon: string }[] = [
    { value: "zelle", en: "Zelle",                icon: "💸", es: "Zelle"                  },
    { value: "ach",   en: "ACH / Direct Deposit", icon: "🏦", es: "ACH / Depósito Directo" },
    { value: "cash",  en: "Cash",                 icon: "💵", es: "Efectivo"               },
    { value: "check", en: "Check",                icon: "📄", es: "Cheque"                 },
];

function fmtDate(iso: string, locale: string): string {
    return new Date(iso + "T12:00:00Z").toLocaleDateString(
        locale === "es" ? "es-US" : "en-US",
        { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }
    );
}

function getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
}

function toISODate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

export default function AdminPayoutsPage({ params }: AdminPayoutsProps) {
    const { lang } = use(params);
    const isEs = lang === "es";

    const t = {
        title:           isEs ? "Pagos a Contratistas"           : "Contractor Payouts",
        back:            isEs ? "← Panel"                        : "← Dashboard",
        tabPayNow:       isEs ? "Pagar Ahora"                    : "Pay Now",
        tabHistory:      isEs ? "Historial"                      : "History",
        noUnpaid:        isEs ? "Sin saldo pendiente"            : "No outstanding balance",
        noUnpaidDesc:    isEs ? "Todos los contratistas están al día." : "All contractors are up to date.",
        contractor:      isEs ? "Contratista"                    : "Contractor",
        jobs:            isEs ? "Trabajos / Códigos"              : "Jobs / Codes",
        gross:           isEs ? "Total Cliente"                  : "Client Total",
        fee:             isEs ? "Comisión (30%)"                 : "Platform Fee (30%)",
        net:             isEs ? "A Pagar"                        : "Payout Amount",
        oldest:          isEs ? "Desde"                          : "Since",
        payNow:          isEs ? "Pagar"                          : "Pay Now",
        modalTitle:      isEs ? "Registrar Pago"                 : "Record Payment",
        method:          isEs ? "Método de pago"                 : "Payment Method",
        reference:       isEs ? "Referencia (opcional)"          : "Reference # (optional)",
        referencePlh:    isEs ? "# Confirmación, # Cheque, etc." : "Zelle confirmation, check #, wire ref…",
        notes:           isEs ? "Notas (opcional)"               : "Notes (optional)",
        confirm:         isEs ? "Confirmar Pago"                 : "Confirm Payment",
        cancel:          isEs ? "Cancelar"                       : "Cancel",
        loading:         isEs ? "Cargando..."                    : "Loading...",
        week:            isEs ? "Semana"                         : "Week",
        status:          isEs ? "Estado"                         : "Status",
        all:             isEs ? "Todos"                          : "All",
        pending:         isEs ? "Pendientes"                     : "Pending",
        paid:            isEs ? "Pagados"                        : "Paid",
        generate:        isEs ? "Generar Pagos Semanales"        : "Generate Weekly Payouts",
        generating:      isEs ? "Generando..."                   : "Generating...",
        noPayouts:       isEs ? "Sin pagos para esta semana"     : "No payouts for this week",
        noPayoutsDesc:   isEs ? "Genera los pagos primero."      : "Generate payouts first.",
        paidBadge:       isEs ? "Pagado"                        : "Paid",
        pendingBadge:    isEs ? "Pendiente"                      : "Pending",
        markPaid:        isEs ? "Marcar Pagado"                  : "Mark as Paid",
        generated:       isEs ? "Registros generados: "          : "Records generated: ",
        noBooksFound:    isEs ? "Sin trabajos sin pagar esta semana." : "No unpaid completed jobs found.",
    };

    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const [tab, setTab] = useState<Tab>("pay-now");

    // Pay-now state
    const [unpaid, setUnpaid] = useState<UnpaidSummary[]>([]);
    const [unpaidLoading, setUnpaidLoading] = useState(false);
    const [payModal, setPayModal] = useState<UnpaidSummary | null>(null);
    const [payMethod, setPayMethod] = useState<PaymentMethod>("zelle");
    const [payReference, setPayReference] = useState("");
    const [payNotes, setPayNotes] = useState("");
    const [paying, setPaying] = useState(false);

    // History state
    const [selectedWeek, setSelectedWeek] = useState<string>(toISODate(getMondayOfWeek(today)));
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all");
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [histLoading, setHistLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [markModal, setMarkModal] = useState<Payout | null>(null);
    const [markMethod, setMarkMethod] = useState<PaymentMethod>("zelle");
    const [markReference, setMarkReference] = useState("");
    const [markNotes, setMarkNotes] = useState("");
    const [markLoading, setMarkLoading] = useState(false);

    const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

    const showToast = (msg: string, type: "ok" | "err" = "ok") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4500);
    };

    // ── Pay Now tab ──────────────────────────────────────────────────────────
    const fetchUnpaid = useCallback(async () => {
        setUnpaidLoading(true);
        try {
            const res = await adminFetch("/api/admin/payouts/unpaid-by-contractor");
            if (!res.ok) throw new Error();
            const json = await res.json();
            setUnpaid(json.data ?? []);
        } catch {
            setUnpaid([]);
        } finally {
            setUnpaidLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tab === "pay-now") fetchUnpaid();
    }, [tab, fetchUnpaid]);

    const handlePayNow = async () => {
        if (!payModal) return;
        setPaying(true);
        try {
            const res = await adminFetch("/api/admin/payouts/pay-now", {
                method: "POST",
                body: JSON.stringify({
                    contractor_id: payModal.contractor_id,
                    payment_method: payMethod,
                    reference: payReference || undefined,
                    notes: payNotes || undefined,
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                showToast(json.error || "Error recording payment", "err");
            } else {
                showToast(
                    isEs
                        ? `✅ Pago de $${Number(json.contractor_amount).toFixed(2)} registrado para ${payModal.contractor?.full_name}.`
                        : `✅ $${Number(json.contractor_amount).toFixed(2)} payment recorded for ${payModal.contractor?.full_name}.`,
                    "ok"
                );
                setPayModal(null);
                setPayReference("");
                setPayNotes("");
                await fetchUnpaid();
            }
        } catch {
            showToast("Error recording payment", "err");
        } finally {
            setPaying(false);
        }
    };

    // ── History tab ──────────────────────────────────────────────────────────
    const fetchPayouts = useCallback(async () => {
        setHistLoading(true);
        try {
            const qs = new URLSearchParams({ week: selectedWeek });
            if (statusFilter !== "all") qs.set("status", statusFilter);
            const res = await adminFetch(`/api/admin/payouts?${qs}`);
            if (!res.ok) throw new Error();
            const json = await res.json();
            setPayouts(json.data ?? []);
        } catch {
            setPayouts([]);
        } finally {
            setHistLoading(false);
        }
    }, [selectedWeek, statusFilter]);

    useEffect(() => {
        if (tab === "history") fetchPayouts();
    }, [tab, fetchPayouts]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await adminFetch("/api/admin/payouts/generate", {
                method: "POST",
                body: JSON.stringify({ week: selectedWeek }),
            });
            const json = await res.json();
            if (!res.ok) {
                showToast(json.error || "Error generating", "err");
            } else if (json.generated === 0) {
                showToast(t.noBooksFound, "err");
            } else {
                showToast(`${t.generated}${json.generated}`, "ok");
                await fetchPayouts();
            }
        } catch {
            showToast("Error generating payouts", "err");
        } finally {
            setGenerating(false);
        }
    };

    const handleMarkPaid = async () => {
        if (!markModal) return;
        setMarkLoading(true);
        try {
            const combinedNotes = [
                markReference ? `Ref: ${markReference}` : null,
                markNotes || null,
            ].filter(Boolean).join(" — ") || undefined;

            const res = await adminFetch(`/api/admin/payouts/${markModal.id}/mark-paid`, {
                method: "POST",
                body: JSON.stringify({ paymentMethod: markMethod, notes: combinedNotes }),
            });
            if (!res.ok) {
                const json = await res.json();
                showToast(json.error || "Error marking paid", "err");
            } else {
                showToast(isEs ? "Pago registrado exitosamente." : "Payment recorded successfully.", "ok");
                setMarkModal(null);
                setMarkReference("");
                setMarkNotes("");
                await fetchPayouts();
            }
        } catch {
            showToast("Error marking paid", "err");
        } finally {
            setMarkLoading(false);
        }
    };

    const methodLabel = (m: string | null) => {
        const found = PAYMENT_METHODS.find((x) => x.value === m);
        return found ? `${found.icon} ${isEs ? found.es : found.en}` : "—";
    };

    const weekOptions: string[] = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i * 7);
        weekOptions.push(toISODate(getMondayOfWeek(d)));
    }

    return (
        <div className="min-h-screen bg-[#131835] py-8 px-4">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <Link href={`/${lang}/admin`} className="text-sm text-[#A5B0D1] hover:text-white transition-colors">
                        {t.back}
                    </Link>
                    <h1 className="text-3xl font-bold text-white mt-1">{t.title}</h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-[#2C355E] pb-0">
                    {(["pay-now", "history"] as Tab[]).map((tabId) => (
                        <button
                            key={tabId}
                            onClick={() => setTab(tabId)}
                            className={`px-5 py-2.5 text-sm font-semibold rounded-t-xl transition-colors ${
                                tab === tabId
                                    ? "bg-[#1A2142] text-[#D0B078] border border-b-0 border-[#2C355E]"
                                    : "text-[#5E698F] hover:text-white"
                            }`}
                        >
                            {tabId === "pay-now" ? (
                                <span className="flex items-center gap-1.5">
                                    <span className="text-base">💳</span>
                                    {t.tabPayNow}
                                    {unpaid.length > 0 && tabId === "pay-now" && (
                                        <span className="ml-1 bg-[#D0B078] text-[#131835] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {unpaid.length}
                                        </span>
                                    )}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <span className="text-base">📋</span>
                                    {t.tabHistory}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── PAY NOW TAB ────────────────────────────────────── */}
                {tab === "pay-now" && (
                    <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] overflow-hidden">
                        {unpaidLoading ? (
                            <div className="py-16 text-center text-[#5E698F]">{t.loading}</div>
                        ) : unpaid.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="text-4xl mb-3">✅</div>
                                <p className="text-white font-semibold mb-1">{t.noUnpaid}</p>
                                <p className="text-[#5E698F] text-sm">{t.noUnpaidDesc}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#2C355E]">
                                            {[t.contractor, t.jobs, t.oldest, t.gross, t.fee, t.net, ""].map((h, i) => (
                                                <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2C355E]">
                                        {unpaid.map((u) => (
                                            <tr key={u.contractor_id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-4">
                                                    <p className="font-medium text-white">{u.contractor?.full_name ?? "—"}</p>
                                                    <p className="text-[#5E698F] text-xs">{u.contractor?.email ?? ""}</p>
                                                    {u.contractor?.payment_preference && (
                                                        <p className="text-[#D0B078] text-xs mt-0.5">
                                                            {methodLabel(u.contractor.payment_preference)}
                                                            {u.contractor.payment_preference === "zelle" && u.contractor.zelle_contact
                                                                ? ` · ${u.contractor.zelle_contact}` : ""}
                                                            {u.contractor.payment_preference === "ach" && u.contractor.bank_account_number
                                                                ? ` · ****${u.contractor.bank_account_number.slice(-4)}` : ""}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-white font-medium">{u.total_bookings}</p>
                                                    {u.booking_codes && u.booking_codes.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {u.booking_codes.map((code) => (
                                                                <span key={code} className="font-mono text-[10px] font-semibold text-[#D0B078] bg-[#D0B078]/10 px-1.5 py-0.5 rounded">
                                                                    {code}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-[#A5B0D1] text-xs">
                                                    {u.oldest_job_date ? fmtDate(u.oldest_job_date, lang) : "—"}
                                                </td>
                                                <td className="px-4 py-4 text-white">${Number(u.gross_amount).toFixed(2)}</td>
                                                <td className="px-4 py-4 text-red-400">−${Number(u.platform_fee).toFixed(2)}</td>
                                                <td className="px-4 py-4">
                                                    <span className="text-green-400 font-bold text-base">
                                                        ${Number(u.contractor_amount).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <button
                                                        onClick={() => {
                                                            setPayModal(u);
                                                            setPayMethod((u.contractor?.payment_preference as PaymentMethod) ?? "zelle");
                                                            setPayReference("");
                                                            setPayNotes("");
                                                        }}
                                                        className="px-4 py-2 bg-[#D0B078] text-[#131835] text-sm font-bold rounded-xl hover:opacity-90 whitespace-nowrap"
                                                    >
                                                        {t.payNow}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ── HISTORY TAB ────────────────────────────────────── */}
                {tab === "history" && (
                    <>
                        {/* Filters */}
                        <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-[#5E698F] uppercase tracking-wider mb-2">{t.week}</label>
                                <select
                                    value={selectedWeek}
                                    onChange={(e) => setSelectedWeek(e.target.value)}
                                    className="w-full bg-[#131835] border border-[#2C355E] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D0B078]"
                                >
                                    {weekOptions.map((w) => (
                                        <option key={w} value={w}>
                                            {fmtDate(w, lang)} –{" "}
                                            {fmtDate(toISODate(new Date(new Date(w + "T12:00:00Z").setUTCDate(new Date(w + "T12:00:00Z").getUTCDate() + 6))), lang)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#5E698F] uppercase tracking-wider mb-2">{t.status}</label>
                                <div className="flex gap-2">
                                    {(["all", "pending", "paid"] as const).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setStatusFilter(s)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                statusFilter === s
                                                    ? "bg-[#D0B078] text-[#131835]"
                                                    : "bg-[#131835] text-[#A5B0D1] border border-[#2C355E] hover:border-[#D0B078]"
                                            }`}
                                        >
                                            {s === "all" ? t.all : s === "pending" ? t.pending : t.paid}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="px-5 py-2.5 bg-[#2C355E] text-[#A5B0D1] hover:text-white font-semibold rounded-xl hover:bg-[#3A4570] disabled:opacity-50 text-sm whitespace-nowrap border border-[#3A4570]"
                            >
                                {generating ? t.generating : t.generate}
                            </button>
                        </div>

                        <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] overflow-hidden">
                            {histLoading ? (
                                <div className="py-16 text-center text-[#5E698F]">{t.loading}</div>
                            ) : payouts.length === 0 ? (
                                <div className="py-16 text-center">
                                    <p className="text-white font-medium mb-1">{t.noPayouts}</p>
                                    <p className="text-[#5E698F] text-sm">{t.noPayoutsDesc}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-[#2C355E]">
                                                {[t.contractor, t.jobs, t.gross, t.fee, t.net, t.method, t.status, ""].map((h, i) => (
                                                    <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#2C355E]">
                                            {payouts.map((p) => (
                                                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-4 py-4">
                                                        <p className="font-medium text-white">{p.contractor?.full_name ?? "—"}</p>
                                                        <p className="text-[#5E698F] text-xs">{p.contractor?.email ?? ""}</p>
                                                        {p.contractor?.payment_preference && (
                                                            <p className="text-[#D0B078] text-xs mt-0.5">
                                                                {methodLabel(p.contractor.payment_preference)}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-white">{p.total_bookings}</td>
                                                    <td className="px-4 py-4 text-white">${Number(p.gross_amount).toFixed(2)}</td>
                                                    <td className="px-4 py-4 text-red-400">−${Number(p.platform_fee).toFixed(2)}</td>
                                                    <td className="px-4 py-4 text-green-400 font-semibold">${Number(p.contractor_amount).toFixed(2)}</td>
                                                    <td className="px-4 py-4 text-[#A5B0D1]">
                                                        {p.status === "paid" ? methodLabel(p.payment_method) : "—"}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                            p.status === "paid"
                                                                ? "bg-green-500/20 text-green-400"
                                                                : "bg-yellow-500/20 text-yellow-400"
                                                        }`}>
                                                            {p.status === "paid" ? t.paidBadge : t.pendingBadge}
                                                        </span>
                                                        {p.status === "paid" && p.paid_at && (
                                                            <p className="text-[#5E698F] text-xs mt-0.5">
                                                                {fmtDate(p.paid_at.slice(0, 10), lang)}
                                                            </p>
                                                        )}
                                                        {p.notes && (
                                                            <p className="text-[#5E698F] text-xs mt-0.5 max-w-[120px] truncate" title={p.notes}>
                                                                {p.notes}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {p.status === "pending" && (
                                                            <button
                                                                onClick={() => {
                                                                    setMarkModal(p);
                                                                    setMarkMethod((p.contractor?.payment_preference as PaymentMethod) ?? "zelle");
                                                                    setMarkReference("");
                                                                    setMarkNotes("");
                                                                }}
                                                                className="px-3 py-1.5 bg-[#D0B078] text-[#131835] text-xs font-bold rounded-lg hover:opacity-90 whitespace-nowrap"
                                                            >
                                                                {t.markPaid}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ── PAY NOW MODAL ──────────────────────────────────────────── */}
            {payModal && (
                <PaymentModal
                    isEs={isEs}
                    t={t}
                    title={`${payModal.contractor?.full_name ?? "Contractor"}`}
                    amount={Number(payModal.contractor_amount)}
                    jobs={payModal.total_bookings}
                    period={payModal.oldest_job_date && payModal.newest_job_date
                        ? `${fmtDate(payModal.oldest_job_date, lang)} – ${fmtDate(payModal.newest_job_date, lang)}`
                        : undefined}
                    method={payMethod}
                    setMethod={setPayMethod}
                    reference={payReference}
                    setReference={setPayReference}
                    notes={payNotes}
                    setNotes={setPayNotes}
                    loading={paying}
                    onConfirm={handlePayNow}
                    onCancel={() => { setPayModal(null); setPayReference(""); setPayNotes(""); }}
                />
            )}

            {/* ── MARK PAID MODAL (history tab) ──────────────────────── */}
            {markModal && (
                <PaymentModal
                    isEs={isEs}
                    t={t}
                    title={`${markModal.contractor?.full_name ?? "Contractor"}`}
                    amount={Number(markModal.contractor_amount)}
                    jobs={markModal.total_bookings}
                    period={`${fmtDate(markModal.period_start, lang)} – ${fmtDate(markModal.period_end, lang)}`}
                    method={markMethod}
                    setMethod={setMarkMethod}
                    reference={markReference}
                    setReference={setMarkReference}
                    notes={markNotes}
                    setNotes={setMarkNotes}
                    loading={markLoading}
                    onConfirm={handleMarkPaid}
                    onCancel={() => { setMarkModal(null); setMarkReference(""); setMarkNotes(""); }}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg z-50 max-w-sm ${
                    toast.type === "ok" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                }`}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}

// ── Shared payment modal ─────────────────────────────────────────────────────
function PaymentModal({
    isEs, t, title, amount, jobs, period,
    method, setMethod, reference, setReference, notes, setNotes,
    loading, onConfirm, onCancel,
}: {
    isEs: boolean;
    t: Record<string, string>;
    title: string;
    amount: number;
    jobs: number;
    period?: string;
    method: PaymentMethod;
    setMethod: (m: PaymentMethod) => void;
    reference: string;
    setReference: (v: string) => void;
    notes: string;
    setNotes: (v: string) => void;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A2142] border border-[#2C355E] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="mb-5">
                    <h3 className="text-lg font-bold text-white">{t.modalTitle}</h3>
                    <p className="text-[#A5B0D1] text-sm mt-0.5">{title}</p>
                </div>

                {/* Amount summary */}
                <div className="bg-[#131835] rounded-xl p-4 mb-5 flex items-center justify-between">
                    <div>
                        <p className="text-[#5E698F] text-xs font-semibold uppercase tracking-wider">
                            {jobs} {isEs ? "trabajos" : "jobs"}{period ? ` · ${period}` : ""}
                        </p>
                        <p className="text-3xl font-bold text-green-400 mt-1">${amount.toFixed(2)}</p>
                    </div>
                    <div className="text-4xl">💸</div>
                </div>

                {/* Payment method */}
                <div className="mb-4">
                    <label className="block text-xs font-semibold text-[#5E698F] uppercase tracking-wider mb-2">{t.method}</label>
                    <div className="grid grid-cols-2 gap-2">
                        {PAYMENT_METHODS.map((m) => (
                            <button
                                key={m.value}
                                onClick={() => setMethod(m.value)}
                                className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
                                    method === m.value
                                        ? "bg-[#D0B078] text-[#131835] border-[#D0B078]"
                                        : "bg-[#131835] text-[#A5B0D1] border-[#2C355E] hover:border-[#D0B078]"
                                }`}
                            >
                                <span>{m.icon}</span>
                                <span>{isEs ? m.es : m.en}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reference # */}
                <div className="mb-4">
                    <label className="block text-xs font-semibold text-[#5E698F] uppercase tracking-wider mb-2">{t.reference}</label>
                    <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder={t.referencePlh}
                        className="w-full bg-white text-gray-900 border border-[#2C355E] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D0B078]"
                    />
                </div>

                {/* Notes */}
                <div className="mb-6">
                    <label className="block text-xs font-semibold text-[#5E698F] uppercase tracking-wider mb-2">{t.notes}</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder={isEs ? "Cualquier nota adicional..." : "Any additional notes..."}
                        className="w-full bg-white text-gray-900 border border-[#2C355E] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D0B078] resize-none"
                    />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 bg-white/5 text-white rounded-xl hover:bg-white/10 text-sm font-medium"
                    >
                        {t.cancel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-[#D0B078] text-[#131835] font-bold rounded-xl hover:opacity-90 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#131835]" />
                        ) : (
                            <>{t.confirm} ✓</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
