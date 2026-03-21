"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface EarningsProps {
    params: Promise<{ lang: "en" | "es" }>;
}

interface PayoutRecord {
    id: number;
    period_start: string;
    period_end: string;
    total_bookings: number;
    gross_amount: number;
    platform_fee: number;
    contractor_amount: number;
    status: "pending" | "paid";
    payment_method: "ach" | "zelle" | "check" | "cash" | null;
    paid_at: string | null;
}

const t = {
    en: {
        title: "Earnings",
        back: "← Dashboard",
        thisWeek: "This Week",
        totalEarned: "Total Earned",
        completedJobs: "Completed Jobs",
        avgPerJob: "Avg / Job",
        history: "Payment History",
        noHistory: "No completed jobs yet",
        noHistoryDesc: "Completed jobs will appear here.",
        loading: "Loading earnings...",
        error: "Error loading earnings",
        retry: "Retry",
        date: "Date",
        service: "Service",
        amount: "Amount",
        platformFee: "Platform Fee (30%)",
        yourPayout: "Your Payout (70%)",
        total: "Total",
        payoutHistory: "Weekly Payouts",
        noPayouts: "No payout records yet",
        noPayoutsDesc: "Payouts are processed weekly.",
        period: "Period",
        paidBadge: "Paid",
        pendingBadge: "Pending",
        via: "via",
    },
    es: {
        title: "Ganancias",
        back: "← Panel",
        thisWeek: "Esta Semana",
        totalEarned: "Total Ganado",
        completedJobs: "Trabajos Completados",
        avgPerJob: "Promedio / Trabajo",
        history: "Historial de Pagos",
        noHistory: "Aún no hay trabajos completados",
        noHistoryDesc: "Los trabajos completados aparecerán aquí.",
        loading: "Cargando ganancias...",
        error: "Error al cargar ganancias",
        retry: "Reintentar",
        date: "Fecha",
        service: "Servicio",
        amount: "Monto",
        platformFee: "Comisión Plataforma (30%)",
        yourPayout: "Tu Pago (70%)",
        total: "Total",
        payoutHistory: "Pagos Semanales",
        noPayouts: "Sin registros de pago aún",
        noPayoutsDesc: "Los pagos se procesan semanalmente.",
        period: "Período",
        paidBadge: "Pagado",
        pendingBadge: "Pendiente",
        via: "vía",
    },
};

export default function EarningsPage({ params }: EarningsProps) {
    const { lang } = use(params);
    const labels = t[lang];
    const { session } = useAuth();

    const [data, setData] = useState<{
        earnings: { thisWeek: number; total: number };
        completedJobs: { id: number; service_name: string | null; date: string; total_amount: string | number }[];
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [payouts, setPayouts] = useState<PayoutRecord[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const headers: Record<string, string> = session?.access_token
                ? { Authorization: `Bearer ${session.access_token}` }
                : {};
            const [dashRes, payoutsRes] = await Promise.all([
                fetch("/api/contractors/dashboard", { headers }),
                fetch("/api/contractor/payouts", { headers }),
            ]);
            if (!dashRes.ok) throw new Error("Failed");
            const json = await dashRes.json();
            setData(json);
            if (payoutsRes.ok) {
                const pJson = await payoutsRes.json();
                setPayouts(pJson.data ?? []);
            }
        } catch {
            setError(labels.error);
        } finally {
            setLoading(false);
        }
    }, [session, labels.error]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#131835] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D0B078]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#131835] flex items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={load}
                        className="px-6 py-2.5 bg-[#D0B078] text-[#131835] font-bold rounded-xl hover:opacity-90"
                    >
                        {labels.retry}
                    </button>
                </div>
            </div>
        );
    }

    const earnings = data?.earnings ?? { thisWeek: 0, total: 0 };
    const completed = data?.completedJobs ?? [];
    const PLATFORM_FEE = 0.30;
    const avgPerJob =
        completed.length > 0
            ? earnings.total / completed.length
            : 0;

    return (
        <div className="min-h-screen bg-[#131835] py-8 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Back */}
                <Link
                    href={`/${lang}/contractor/dashboard`}
                    className="text-sm text-[#A5B0D1] hover:text-white transition-colors"
                >
                    {labels.back}
                </Link>

                <h1 className="text-3xl font-bold text-white">{labels.title}</h1>

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: labels.thisWeek, value: `$${earnings.thisWeek.toFixed(2)}`, color: "text-green-400" },
                        { label: labels.totalEarned, value: `$${earnings.total.toFixed(2)}`, color: "text-white" },
                        { label: labels.completedJobs, value: String(completed.length), color: "text-blue-400" },
                        { label: labels.avgPerJob, value: `$${avgPerJob.toFixed(2)}`, color: "text-[#D0B078]" },
                    ].map((card) => (
                        <div
                            key={card.label}
                            className="bg-[#1A2142] border border-[#2C355E] rounded-xl px-4 py-4"
                        >
                            <p className="text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider mb-1">
                                {card.label}
                            </p>
                            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                        </div>
                    ))}
                </div>

                {/* Completed jobs table */}
                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#2C355E]">
                        <h2 className="text-lg font-semibold text-white">{labels.history}</h2>
                    </div>

                    {completed.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-[#5E698F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-white font-medium mb-1">{labels.noHistory}</p>
                            <p className="text-[#5E698F] text-sm">{labels.noHistoryDesc}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#2C355E]">
                            {completed.map((job) => {
                                const gross = Number(job.total_amount) || 0;
                                const fee = gross * PLATFORM_FEE;
                                const payout = gross - fee;
                                const dateStr = job.date
                                    ? new Date(job.date + "T12:00:00").toLocaleDateString(
                                        lang === "es" ? "es-US" : "en-US",
                                        { month: "short", day: "numeric", year: "numeric" }
                                    )
                                    : "—";
                                return (
                                    <div
                                        key={job.id}
                                        className="px-6 py-4 hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div className="space-y-0.5">
                                                <p className="font-medium text-white">
                                                    {job.service_name || "Auto Detail"}
                                                </p>
                                                <p className="text-sm text-[#5E698F]">{dateStr}</p>
                                            </div>
                                            <div className="text-sm space-y-0.5 sm:text-right">
                                                <p className="text-[#5E698F]">
                                                    {labels.total}: <span className="text-white">${gross.toFixed(2)}</span>
                                                </p>
                                                <p className="text-red-400/80">
                                                    {labels.platformFee}: −${fee.toFixed(2)}
                                                </p>
                                                <p className="text-green-400 font-semibold">
                                                    {labels.yourPayout}: ${payout.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Payout history */}
            <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#2C355E]">
                    <h2 className="text-lg font-semibold text-white">{labels.payoutHistory}</h2>
                </div>
                {payouts.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-white font-medium mb-1">{labels.noPayouts}</p>
                        <p className="text-[#5E698F] text-sm">{labels.noPayoutsDesc}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#2C355E]">
                        {payouts.map((p) => {
                            const startStr = new Date(p.period_start + "T12:00:00Z")
                                .toLocaleDateString(lang === "es" ? "es-US" : "en-US", { month: "short", day: "numeric" });
                            const endStr = new Date(p.period_end + "T12:00:00Z")
                                .toLocaleDateString(lang === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", year: "numeric" });
                            const methodMap: Record<string, string> = {
                                ach: "ACH", zelle: "Zelle", check: lang === "es" ? "Cheque" : "Check",
                                cash: lang === "es" ? "Efectivo" : "Cash",
                            };
                            return (
                                <div key={p.id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="space-y-0.5">
                                            <p className="font-medium text-white">{startStr} – {endStr}</p>
                                            <p className="text-sm text-[#5E698F]">
                                                {p.total_bookings} {lang === "es" ? "trabajos" : "jobs"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-sm space-y-0.5 text-right">
                                                <p className="text-[#5E698F]">
                                                    {labels.total}: <span className="text-white">${Number(p.gross_amount).toFixed(2)}</span>
                                                </p>
                                                <p className="text-red-400/80">
                                                    {labels.platformFee}: −${Number(p.platform_fee).toFixed(2)}
                                                </p>
                                                <p className="text-green-400 font-semibold">
                                                    {labels.yourPayout}: ${Number(p.contractor_amount).toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    p.status === "paid"
                                                        ? "bg-green-500/20 text-green-400"
                                                        : "bg-yellow-500/20 text-yellow-400"
                                                }`}>
                                                    {p.status === "paid" ? labels.paidBadge : labels.pendingBadge}
                                                </span>
                                                {p.status === "paid" && p.payment_method && (
                                                    <span className="text-xs text-[#A5B0D1]">
                                                        {labels.via} {methodMap[p.payment_method] ?? p.payment_method}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
