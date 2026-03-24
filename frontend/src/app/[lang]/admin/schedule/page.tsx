"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";

interface ScheduleProps {
  params: Promise<{ lang: "en" | "es" }>;
}

interface Contractor {
  id: string;
  full_name: string;
  email: string;
  availability: {
    days: string[];
    start_hour: number;
    end_hour: number;
  } | null;
  is_available: boolean;
}

const daysOfWeek = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
];

const timeOptions = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i.toString().padStart(2, "0") + ":00",
}));

export default function ContractorSchedule({ params }: ScheduleProps) {
  const { lang } = use(params);
  const t = {
    en: {
      title: "Contractor Schedule Management",
      subtitle: "Set working hours and availability for contractors",
      contractor: "Contractor",
      days: "Days",
      startTime: "Start Time",
      endTime: "End Time",
      available: "Available for jobs",
      notAvailable: "Not available",
      saveChanges: "Save Changes",
      saving: "Saving...",
      error: "Error saving schedule",
      success: "Schedule saved",
      loading: "Loading contractors...",
      noContractors: "No contractors found",
    },
    es: {
      title: "Gestión de Horarios de Contratistas",
      subtitle: "Establece horas de trabajo y disponibilidad para contratistas",
      contractor: "Contratista",
      days: "Días",
      startTime: "Hora de inicio",
      endTime: "Hora de finalización",
      available: "Disponible para trabajos",
      notAvailable: "No disponible",
      saveChanges: "Guardar Cambios",
      saving: "Guardando...",
      error: "Error al guardar el horario",
      success: "Horario guardado",
      loading: "Cargando contratistas...",
      noContractors: "No se encontraron contratistas",
    },
  }[lang];

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [successMsg, setSuccessMsg] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchContractors();
  }, []);

  const fetchContractors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/contractors?status=active");
      if (!res.ok) throw new Error("Failed to fetch contractors");
      const data = await res.json();
      setContractors(data.data || []);
    } catch (err) {
      setError("Failed to load contractors");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (contractorId: string, formData: { days: string[]; start_hour: number; end_hour: number; is_available: boolean }) => {
    setSaving((prev) => ({ ...prev, [contractorId]: true }));
    setSuccessMsg((prev) => ({ ...prev, [contractorId]: false }));
    try {
      const res = await adminFetch(`/api/admin/contractors/${contractorId}`, {
        method: "PATCH",
        body: JSON.stringify({
          availability: {
            days: formData.days,
            start_hour: formData.start_hour,
            end_hour: formData.end_hour,
          },
          is_available: formData.is_available,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccessMsg((prev) => ({ ...prev, [contractorId]: true }));
    } catch (err) {
      setError(t.error);
      console.error(err);
    } finally {
      setSaving((prev) => ({ ...prev, [contractorId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">{t.title}</h1>
          <p className="text-gray-600 mb-6">{t.subtitle}</p>
          <div className="animate-pulse rounded-xl bg-white p-6 h-96">
            {/* Loading skeleton */}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">{t.title}</h1>
          <p className="text-red-600">{error}</p>
          <Link
            href={`/${lang}/admin`}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (contractors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
          <p className="mt-6 text-gray-500">{t.noContractors}</p>
          <Link
            href={`/${lang}/admin`}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">{t.title}</h1>
        <p className="text-gray-600 mb-6">{t.subtitle}</p>

        <div className="space-y-6">
          {contractors.map((contractor) => (
            <div key={contractor.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{contractor.full_name}</h2>
                <p className="text-sm text-gray-500">{contractor.email}</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget as HTMLFormElement);
                  const days = formData.getAll("days") as string[];
                  handleSave(contractor.id, {
                    days,
                    start_hour: parseInt(formData.get("start_hour") as string, 10),
                    end_hour: parseInt(formData.get("end_hour") as string, 10),
                    is_available: formData.get("is_available") === "true",
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">{t.days}</label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <label key={day.id} className="flex items-center">
                        <input
                          type="checkbox"
                          value={day.id}
                          name="days"
                          defaultChecked={
                            contractor.availability?.days.includes(day.id) ||
                            false
                          }
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="ml-2">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.startTime}</label>
                    <select
                      name="start_hour"
                      value={contractor.availability?.start_hour ?? 9}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {timeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.endTime}</label>
                    <select
                      name="end_hour"
                      value={contractor.availability?.end_hour ?? 17}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {timeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_available"
                    checked={contractor.is_available}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm font-medium">
                    {contractor.is_available ? t.available : t.notAvailable}
                  </label>
                </div>

                <div className="mt-4 flex items-center space-x-3">
                  <button
                    type="submit"
                    disabled={saving[contractor.id]}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving[contractor.id] ? t.saving : t.saveChanges}
                  </button>
                  {successMsg[contractor.id] && (
                    <span className="text-green-600 text-sm">{t.success}</span>
                  )}
                </div>
              </form>
            </div>
          ))}
        </div>

        <Link
          href={`/${lang}/admin`}
          className="mt-8 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}