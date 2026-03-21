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
    bank_name: string | null;
    bank_account_number: string | null;
    bank_routing_number: string | null;
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

const PAYMENT_METHODS: { value: PaymentMethod; en: string; es: string }[] = [
    { value: "ach",   en: "ACH / Direct Deposit", es: "ACH / Depósito Directo" },
    { value: "zelle", en: "Zelle",                es: "Zelle"                  },
    { value: "check", en: "Check",                es: "Cheque"                 },
    { value: "cash",  en: "Cash",                 es: "Efectivo"               },
];

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

function fmtDate(iso: string, locale: string): string {
    return new Date(iso + "T12:00:00Z").toLocaleDateString(
        locale === "es" ? "es-US" : "en-US",
        { month: "short", day: "numeric", year: "numeric" }
    );
}

export default function AdminPayoutsPage({ params }: AdminPayoutsProps) {
    const { lang } = use(params);
    const isEs = lang === "es";

    const t = {
        title:            isEs ? "Pagos a Contratistas"        : "Contractor Payouts",
        back:             isEs ? "← Panel"                     : "← Dashboard",
        week:             isEs ? "Semana"                      : "Week",
        generate:         isEs ? "Generar Pagos"               : "Generate Payouts",
        generating:       isEs ? "Generando..."                : "Generating...",
        all:              isEs ? "Todos"                       : "All",
        pending:          isEs ? "Pendientes"                  : "Pending",
        paid:             isEs ? "Pagados"                     : "Paid",
        contractor:       isEs ? "Contratista"                 : "Contractor",
        jobs:             isEs ? "Trabajos"                    : "Jobs",
        gross:            isEs ? "Total Cliente"               : "Client Total",
        fee:              isEs ? "Comisión (30%)"              : "Fee (30%)",
        net:              isEs ? "Pago (70%)"                  : "Payout (70%)",
        method:           isEs ? "Método"                      : "Method",
        status:           isEs ? "Estado"                      : "Status",
        markPaid:         isEs ? "Marcar Pagado"               : "Mark as Paid",
        markPaidTitle:    isEs ? "Registrar Pago"              : "Record Payment",
        paymentMethod:    isEs ? "Método de pago"              : "Payment method",
        notes:            isEs ? "Notas (opcional)"            : "Notes (optional)",
        confirm:          isEs ? "Confirmar Pago"              : "Confirm Payment",
        cancel:           isEs ? "Cancelar"                    : "Cancel",
        noPayouts:        isEs ? "No hay pagos para esta semana" : "No payouts for this week",
        noPayoutsDesc:    isEs ? "Genera los pagos primero."   : "Generate payouts first.",
        paidBadge:        isEs ? "Pagado"                      : "Paid",
        pendingBadge:     isEs ? "Pendiente"                   : "Pending",
        paymentInfo:      isEs ? "Info de pago"                : "Payment info",
        loading:          isEs ? "Cargando..."                 : "Loading...",
        generated:        isEs ? "Registros generados: "       : "Records generated: ",
        noBooksFound:     isEs ? "Sin trabajos sin pagar en esta semana." : "No unpaid completed jobs found for this week.",
    };

    const today = new Date();
    const [selectedWeek, setSelectedWeek] = useState<string>(
        toISODate(getMondayOfWeek(today))
    );
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all");
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [markModal, setMarkModal] = useState<Payout | null>(null);
    const [markMethod, setMarkMethod] = useState<PaymentMethod>("zelle");
    const [markNotes, setMarkNotes] = useState("");
    const [markLoading, setMarkLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

    const showToast = (msg: string, type: "ok" | "err" = "ok") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchPayouts = useCallback(async () => {
        setLoading(true);
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
            setLoading(false);
        }
    }, [selectedWeek, statusFilter]);

    useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await adminFetch("/api/admin/payouts/generate", {
                method: "POST",
                body: JSON.stringify({ week: selectedWeek }),
            });
            const json = await res.json();
            if (!res.ok) {
                showToast(json.error || "Error generating payouts", "err");
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
            const res = await adminFetch(`/api/admin/payouts/${markModal.id}/mark-paid`, {
                method: "POST",
                body: JSON.stringify({ paymentMethod: markMethod, notes: markNotes || null }),
            });
            if (!res.ok) {
                const json = await res.json();
                showToast(json.error || "Error marking paid", "err");
            } else {
                showToast(isEs ? "Pago registrado exitosamente." : "Payment recorded successfully.", "ok");
                setMarkModal(null);
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
        return found ? (isEs ? found.es : found.en) : "—";
    };

    // Build week options: current week + past 11 weeks
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Link href={`/${lang}/admin`} className="text-sm text-[#A5B0D1] hover:text-white transition-colors">
                            {t.back}
                        </Link>
                        <h1 className="text-3xl font-bold text-white mt-1">{t.title}</h1>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-[#5E698F] uppercase tracking-wider mb-2">
                            {t.week}
                        </label>
                        <select
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(e.target.value)}
                            className="w-full bg-[#131835] border border-[#2C355E] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D0B078]"
                        >
                            {weekOptions.map((w) => (
                                <option key={w} value={w}>
                                    {fmtDate(w, lang)} – {fmtDate(
                                        toISODate(new Date(new Date(w + "T12:00:00Z").setUTCDate(new Date(w + "T12:00:00Z").getUTCDate() + 6))),
                                        lang
                                    )}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[#5E698F] uppercase tracking-wider mb-2">
                            {t.status}
                        </label>
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
                        className="px-6 py-2.5 bg-[#D0B078] text-[#131835] font-bold rounded-xl hover:opacity-90 disabled:opacity-50 text-sm whitespace-nowrap"
                    >
                        {generating ? t.generating : t.generate}
                    </button>
                </div>

                {/* Payouts table */}
                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] overflow-hidden">
                    {loading ? (
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
                                        {[t.contractor, t.jobs, t.gross, t.fee, t.net, t.method, t.status, ""].map((h) => (
                                            <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2C355E]">
                                    {payouts.map((p) => (
                                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-4">
                                                <p className="font-medium text-white">
                                                    {p.contractor?.full_name ?? "—"}
                                                </p>
                                                <p className="text-[#5E698F] text-xs">{p.contractor?.email ?? ""}</p>
                                                {p.contractor?.payment_preference && (
                                                    <p className="text-[#D0B078] text-xs mt-0.5">
                                                        {methodLabel(p.contractor.payment_preference)}
                                                        {p.contractor.payment_preference === "zelle" && p.contractor.zelle_contact
                                                            ? ` · ${p.contractor.zelle_contact}` : ""}
                                                        {p.contractor.payment_preference === "ach" && p.contractor.bank_account_number
                                                            ? ` · ****${p.contractor.bank_account_number.slice(-4)}` : ""}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-white">{p.total_bookings}</td>
                                            <td className="px-4 py-4 text-white">${Number(p.gross_amount).toFixed(2)}</td>
                                            <td className="px-4 py-4 text-red-400">−${Number(p.platform_fee).toFixed(2)}</td>
                                            <td className="px-4 py-4 text-green-400 font-semibold">
                                                ${Number(p.contractor_amount).toFixed(2)}
                                            </td>
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
                                            </td>
                                            <td className="px-4 py-4">
                                                {p.status === "pending" && (
                                                    <button
                                                        onClick={() => {
                                                            setMarkModal(p);
                                                            setMarkMethod(
                                                                (p.contractor?.payment_preference as PaymentMethod) ?? "zelle"
                                                            );
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
            </div>

            {/* Mark as Paid modal */}
            {markModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1A2142] border border-[#2C355E] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-1">{t.markPaidTitle}</h3>
                        <p className="text-[#A5B0D1] text-sm mb-4">
                            {markModal.contractor?.full_name} · <span className="text-green-400 font-semibold">
                                ${Number(markModal.contractor_amount).toFixed(2)}
                            </span>
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-[#5E698F] uppercase tracking-wider mb-2">
                                {t.paymentMethod}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {PAYMENT_METHODS.map((m) => (
                                    <button
                                        key={m.value}
                                        onClick={() => setMarkMethod(m.value)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                            markMethod === m.value
                                                ? "bg-[#D0B078] text-[#131835] border-[#D0B078]"
                                                : "bg-[#131835] text-[#A5B0D1] border-[#2C355E] hover:border-[#D0B078]"
                                        }`}
                                    >
                                        {isEs ? m.es : m.en}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-semibold text-[#5E698F] uppercase tracking-wider mb-2">
                                {t.notes}
                            </label>
                            <textarea
                                value={markNotes}
                                onChange={(e) => setMarkNotes(e.target.value)}
                                rows={3}
                                placeholder={isEs ? "Referencia de transferencia, etc." : "Transfer reference, etc."}
                                className="w-full bg-white text-gray-900 border border-[#2C355E] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D0B078] resize-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setMarkModal(null); setMarkNotes(""); }}
                                className="flex-1 px-4 py-2.5 bg-white/5 text-white rounded-xl hover:bg-white/10 text-sm font-medium"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={handleMarkPaid}
                                disabled={markLoading}
                                className="flex-1 px-4 py-2.5 bg-[#D0B078] text-[#131835] font-bold rounded-xl hover:opacity-90 disabled:opacity-50 text-sm"
                            >
                                {markLoading ? "..." : t.confirm}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg z-50 ${
                    toast.type === "ok" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                }`}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
