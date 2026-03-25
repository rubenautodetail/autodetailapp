"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";

interface ScheduleProps {
  params: Promise<{ lang: "en" | "es" }>;
}

interface Contractor {
  id: string;
  full_name: string | null;
  email: string | null;
  availability: {
    days: string[];
    start_hour: number;
    end_hour: number;
  } | null;
  is_available: boolean;
}

const DAYS = [
  { id: "monday",    en: "Mon", es: "Lun" },
  { id: "tuesday",   en: "Tue", es: "Mar" },
  { id: "wednesday", en: "Wed", es: "Mié" },
  { id: "thursday",  en: "Thu", es: "Jue" },
  { id: "friday",    en: "Fri", es: "Vie" },
  { id: "saturday",  en: "Sat", es: "Sáb" },
  { id: "sunday",    en: "Sun", es: "Dom" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`,
}));

const T = {
  en: {
    title: "Schedule Management",
    subtitle: "Set working hours and availability for each contractor",
    back: "← Dashboard",
    days: "Working Days",
    start: "Start",
    end: "End",
    available: "Available for jobs",
    save: "Save",
    saving: "Saving…",
    saved: "Saved ✓",
    error: "Failed to save",
    loading: "Loading…",
    none: "No active contractors",
  },
  es: {
    title: "Gestión de Horarios",
    subtitle: "Establece horas de trabajo y disponibilidad por contratista",
    back: "← Panel",
    days: "Días de Trabajo",
    start: "Inicio",
    end: "Fin",
    available: "Disponible para trabajos",
    save: "Guardar",
    saving: "Guardando…",
    saved: "Guardado ✓",
    error: "Error al guardar",
    loading: "Cargando…",
    none: "Sin contratistas activos",
  },
};

export default function SchedulePage({ params }: ScheduleProps) {
  const { lang } = use(params);
  const t = T[lang];

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, "saved" | "error" | null>>({});

  useEffect(() => {
    adminFetch("/api/admin/contractors?status=active")
      .then((r) => r.json())
      .then((d) => setContractors(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (
    contractorId: string,
    days: string[],
    start_hour: number,
    end_hour: number,
    is_available: boolean
  ) => {
    setSaving((p) => ({ ...p, [contractorId]: true }));
    setFeedback((p) => ({ ...p, [contractorId]: null }));
    try {
      const res = await adminFetch(`/api/admin/contractors/${contractorId}`, {
        method: "PATCH",
        body: JSON.stringify({ availability: { days, start_hour, end_hour }, is_available }),
      });
      setFeedback((p) => ({ ...p, [contractorId]: res.ok ? "saved" : "error" }));
    } catch {
      setFeedback((p) => ({ ...p, [contractorId]: "error" }));
    } finally {
      setSaving((p) => ({ ...p, [contractorId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/${lang}/admin`}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            {t.back}
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{t.subtitle}</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {!loading && contractors.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">{t.none}</p>
          </div>
        )}

        {contractors.map((c) => (
          <ContractorCard
            key={c.id}
            contractor={c}
            lang={lang}
            t={t}
            saving={!!saving[c.id]}
            feedback={feedback[c.id] ?? null}
            onSave={(days, start, end, avail) => handleSave(c.id, days, start, end, avail)}
          />
        ))}
      </div>
    </div>
  );
}

function ContractorCard({
  contractor: c,
  lang,
  t,
  saving,
  feedback,
  onSave,
}: {
  contractor: Contractor;
  lang: "en" | "es";
  t: (typeof T)["en"];
  saving: boolean;
  feedback: "saved" | "error" | null;
  onSave: (days: string[], start: number, end: number, avail: boolean) => void;
}) {
  const initDays = c.availability?.days ?? [];
  const [days, setDays] = useState<string[]>(initDays);
  const [startHour, setStartHour] = useState(c.availability?.start_hour ?? 8);
  const [endHour, setEndHour] = useState(c.availability?.end_hour ?? 18);
  const [isAvailable, setIsAvailable] = useState(c.is_available);

  const toggleDay = (id: string) =>
    setDays((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-gray-900">
            {c.full_name ?? "—"}
          </p>
          <p className="text-sm text-gray-400">{c.email ?? ""}</p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            isAvailable
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {isAvailable ? (lang === "es" ? "Disponible" : "Available") : (lang === "es" ? "No disponible" : "Unavailable")}
        </span>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Days */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t.days}
          </p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const active = days.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    active
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-600 hover:border-blue-400"
                  }`}
                >
                  {lang === "es" ? day.es : day.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              {t.start}
            </label>
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {HOURS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              {t.end}
            </label>
            <select
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {HOURS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Available toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setIsAvailable((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              isAvailable ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                isAvailable ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">{t.available}</span>
        </label>

        {/* Save row */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(days, startHour, endHour, isAvailable)}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? t.saving : t.save}
          </button>
          {feedback === "saved" && (
            <span className="text-sm font-medium text-green-600">{t.saved}</span>
          )}
          {feedback === "error" && (
            <span className="text-sm font-medium text-red-600">{t.error}</span>
          )}
        </div>
      </div>
    </div>
  );
}
