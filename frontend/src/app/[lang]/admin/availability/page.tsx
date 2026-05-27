"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";

interface PageProps {
    params: Promise<{ lang: "en" | "es" }>;
}

type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

interface Settings {
    weekday_defaults: Record<WeekdayKey, boolean>;
    booking_window_days: number;
    min_lead_time_hours: number;
}

interface BlockedDate {
    id: string;
    date: string; // YYYY-MM-DD
    reason: string | null;
    created_at: string;
}

const WEEKDAY_ORDER: WeekdayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const DEFAULT_SETTINGS: Settings = {
    weekday_defaults: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
    booking_window_days: 14,
    min_lead_time_hours: 1,
};

function pad2(n: number): string {
    return n.toString().padStart(2, "0");
}

function ymd(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getMonthDays(viewMonth: Date): (Date | null)[] {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const out: (Date | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) out.push(null);
    for (let d = 1; d <= last.getDate(); d++) out.push(new Date(year, month, d));
    return out;
}

export default function AdminAvailabilityPage({ params }: PageProps) {
    const { lang } = use(params);
    const locale = lang || "en";
    const isEs = locale === "es";

    const t = {
        title: isEs ? "Disponibilidad de la Plataforma" : "Platform Availability",
        subtitle: isEs
            ? "Controla qué días están abiertos a reservas, días bloqueados, ventana de reserva y tiempo mínimo."
            : "Control which days are open for booking, blocked dates, booking window, and minimum lead time.",
        back: isEs ? "← Volver al Panel" : "← Back to Dashboard",
        weekdayTitle: isEs ? "Días Abiertos por Defecto" : "Default Open Days",
        weekdayHelp: isEs
            ? "Apaga un día para que ningún cliente pueda reservar ese día de la semana."
            : "Turn a day off to prevent customers from booking on that weekday.",
        windowTitle: isEs ? "Ventana y Tiempo Mínimo" : "Window & Lead Time",
        windowDaysLabel: isEs ? "Días de Anticipación" : "Booking Window (days)",
        windowDaysHelp: isEs
            ? "Cuántos días en adelante puede reservar el cliente (1 a 90)."
            : "How many days ahead a customer can book (1 to 90).",
        leadLabel: isEs ? "Tiempo Mínimo (horas)" : "Minimum Lead Time (hours)",
        leadHelp: isEs
            ? "Para reservas del mismo día, mínimo de horas de anticipación (0 a 168)."
            : "For same-day bookings, minimum hours of notice (0 to 168).",
        saveSettings: isEs ? "Guardar Configuración" : "Save Settings",
        blockedTitle: isEs ? "Días Bloqueados" : "Blocked Dates",
        blockedHelp: isEs
            ? "Haz clic en una fecha para bloquearla. Vuelve a hacer clic para desbloquearla."
            : "Click a date to block it. Click again to unblock.",
        reasonPlaceholder: isEs ? "Razón (opcional)" : "Reason (optional)",
        addBlocked: isEs ? "Bloquear Fecha" : "Block Date",
        loading: isEs ? "Cargando..." : "Loading...",
        saving: isEs ? "Guardando..." : "Saving...",
        saved: isEs ? "Guardado" : "Saved",
        prevMonth: isEs ? "Mes anterior" : "Previous month",
        nextMonth: isEs ? "Mes siguiente" : "Next month",
        days: isEs ? ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        weekdayLabels: isEs
            ? { mon: "Lun", tue: "Mar", wed: "Mié", thu: "Jue", fri: "Vie", sat: "Sáb", sun: "Dom" }
            : { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" },
        errorLoad: isEs ? "Error al cargar configuración" : "Failed to load settings",
        errorSave: isEs ? "Error al guardar" : "Failed to save",
    };

    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
    const [viewMonth, setViewMonth] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [flash, setFlash] = useState<string | null>(null);

    const blockedSet = new Set(blockedDates.map((b) => b.date));

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminFetch("/api/admin/platform-schedule");
            if (!res.ok) throw new Error("load failed");
            const json = (await res.json()) as { settings: Settings; blockedDates: BlockedDate[] };
            setSettings({
                ...DEFAULT_SETTINGS,
                ...json.settings,
                weekday_defaults: { ...DEFAULT_SETTINGS.weekday_defaults, ...(json.settings.weekday_defaults || {}) },
            });
            setBlockedDates(json.blockedDates ?? []);
        } catch (e) {
            console.error("load platform schedule:", e);
            setError(t.errorLoad);
        } finally {
            setLoading(false);
        }
    }, [t.errorLoad]);

    useEffect(() => {
        load();
    }, [load]);

    const toggleWeekday = (key: WeekdayKey) => {
        setSettings((prev) => ({
            ...prev,
            weekday_defaults: { ...prev.weekday_defaults, [key]: !prev.weekday_defaults[key] },
        }));
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        setError(null);
        try {
            const res = await adminFetch("/api/admin/platform-schedule", {
                method: "PATCH",
                body: JSON.stringify({
                    weekday_defaults: settings.weekday_defaults,
                    booking_window_days: settings.booking_window_days,
                    min_lead_time_hours: settings.min_lead_time_hours,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || "save failed");
            setFlash(t.saved);
            setTimeout(() => setFlash(null), 2000);
        } catch (e) {
            setError((e as Error).message || t.errorSave);
        } finally {
            setSavingSettings(false);
        }
    };

    const handleToggleBlockedDate = async (date: Date, reason: string | null = null) => {
        const key = ymd(date);
        const existing = blockedDates.find((b) => b.date === key);
        try {
            if (existing) {
                const res = await adminFetch(`/api/admin/platform-schedule/blocked-dates?date=${key}`, { method: "DELETE" });
                if (!res.ok) throw new Error("delete failed");
                setBlockedDates((prev) => prev.filter((b) => b.date !== key));
            } else {
                const res = await adminFetch("/api/admin/platform-schedule/blocked-dates", {
                    method: "POST",
                    body: JSON.stringify({ date: key, reason }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || "block failed");
                setBlockedDates((prev) => [...prev, json.blockedDate as BlockedDate].sort((a, b) => a.date.localeCompare(b.date)));
            }
        } catch (e) {
            setError((e as Error).message || t.errorSave);
        }
    };

    const days = getMonthDays(viewMonth);
    const monthLabel = viewMonth.toLocaleDateString(locale, { month: "long", year: "numeric" });

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <Link href={`/${locale}/admin`} className="text-sm text-blue-600 hover:underline mb-2 block">
                    {t.back}
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
                <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
                {flash && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        {flash}
                    </div>
                )}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                        {t.loading}
                    </div>
                ) : (
                    <>
                        {/* ── Weekday defaults ─────────────────────────────────── */}
                        <section className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="mb-4">
                                <h2 className="text-base font-semibold text-gray-900">{t.weekdayTitle}</h2>
                                <p className="text-xs text-gray-500 mt-1">{t.weekdayHelp}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {WEEKDAY_ORDER.map((key) => {
                                    const active = settings.weekday_defaults[key];
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => toggleWeekday(key)}
                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                                active
                                                    ? "bg-blue-50 border-blue-300 text-blue-700"
                                                    : "bg-gray-50 border-gray-200 text-gray-400"
                                            }`}
                                        >
                                            {t.weekdayLabels[key]}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* ── Window & lead time ───────────────────────────────── */}
                        <section className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">{t.windowTitle}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.windowDaysLabel}</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={90}
                                        value={settings.booking_window_days}
                                        onChange={(e) =>
                                            setSettings((s) => ({ ...s, booking_window_days: Math.max(1, Math.min(90, Number(e.target.value) || 1)) }))
                                        }
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">{t.windowDaysHelp}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.leadLabel}</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={168}
                                        value={settings.min_lead_time_hours}
                                        onChange={(e) =>
                                            setSettings((s) => ({ ...s, min_lead_time_hours: Math.max(0, Math.min(168, Number(e.target.value) || 0)) }))
                                        }
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">{t.leadHelp}</p>
                                </div>
                            </div>
                        </section>

                        {/* Save settings button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveSettings}
                                disabled={savingSettings}
                                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                            >
                                {savingSettings ? t.saving : t.saveSettings}
                            </button>
                        </div>

                        {/* ── Blocked dates calendar ───────────────────────────── */}
                        <section className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">{t.blockedTitle}</h2>
                                    <p className="text-xs text-gray-500 mt-1">{t.blockedHelp}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                                        aria-label={t.prevMonth}
                                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                                    >
                                        ‹
                                    </button>
                                    <span className="text-sm font-medium text-gray-700 capitalize min-w-[10ch] text-center">
                                        {monthLabel}
                                    </span>
                                    <button
                                        onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                                        aria-label={t.nextMonth}
                                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                                    >
                                        ›
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                                {t.days.map((d) => (
                                    <div key={d} className="py-2 text-gray-400 font-medium uppercase tracking-wider">{d}</div>
                                ))}
                                {days.map((d, idx) => {
                                    if (!d) return <div key={`empty-${idx}`} className="aspect-square" />;
                                    const key = ymd(d);
                                    const isBlocked = blockedSet.has(key);
                                    const isPast = d < new Date(new Date().setHours(0, 0, 0, 0));
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => handleToggleBlockedDate(d)}
                                            disabled={isPast}
                                            className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                                isPast
                                                    ? "text-gray-300 cursor-not-allowed"
                                                    : isBlocked
                                                        ? "bg-red-100 text-red-700 border border-red-300 hover:bg-red-200"
                                                        : "bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent"
                                            }`}
                                            title={isBlocked ? (blockedDates.find((b) => b.date === key)?.reason ?? undefined) : undefined}
                                        >
                                            {d.getDate()}
                                        </button>
                                    );
                                })}
                            </div>

                            {blockedDates.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        {isEs ? "Todas las Fechas Bloqueadas" : "All Blocked Dates"}
                                    </h3>
                                    <ul className="space-y-1.5">
                                        {blockedDates.map((b) => (
                                            <li key={b.id} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-800">
                                                    {b.date}
                                                    {b.reason && <span className="text-gray-500 ml-2">— {b.reason}</span>}
                                                </span>
                                                <button
                                                    onClick={() => handleToggleBlockedDate(new Date(b.date + "T00:00:00"))}
                                                    className="text-xs text-red-600 hover:underline"
                                                >
                                                    {isEs ? "Desbloquear" : "Unblock"}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
