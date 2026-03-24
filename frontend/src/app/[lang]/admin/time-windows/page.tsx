"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";

interface AdminTimeWindowsProps {
  params: Promise<{ lang: "en" | "es" }>;
}

interface TimeWindowConfig {
  id: number;
  slot: string; // e.g., "09:00"
  label: string; // e.g., "9:00 AM"
  labelEs: string; // e.g., "9:00 AM"
  range: string; // e.g., "9:00 AM"
  rangeEs: string; // e.g., "9:00 AM"
  is_active: boolean;
  sort_order: number;
}

const DEFAULT_TIME_WINDOWS: TimeWindowConfig[] = [
  { id: 1, slot: "08:00", label: "8:00 AM", labelEs: "8:00 AM", range: "8:00 AM", rangeEs: "8:00 AM", is_active: true, sort_order: 1 },
  { id: 2, slot: "08:30", label: "8:30 AM", labelEs: "8:30 AM", range: "8:30 AM", rangeEs: "8:30 AM", is_active: true, sort_order: 2 },
  { id: 3, slot: "09:00", label: "9:00 AM", labelEs: "9:00 AM", range: "9:00 AM", rangeEs: "9:00 AM", is_active: true, sort_order: 3 },
  { id: 4, slot: "09:30", label: "9:30 AM", labelEs: "9:30 AM", range: "9:30 AM", rangeEs: "9:30 AM", is_active: true, sort_order: 4 },
  { id: 5, slot: "10:00", label: "10:00 AM", labelEs: "10:00 AM", range: "10:00 AM", rangeEs: "10:00 AM", is_active: true, sort_order: 5 },
  { id: 6, slot: "10:30", label: "10:30 AM", labelEs: "10:30 AM", range: "10:30 AM", rangeEs: "10:30 AM", is_active: true, sort_order: 6 },
  { id: 7, slot: "11:00", label: "11:00 AM", labelEs: "11:00 AM", range: "11:00 AM", rangeEs: "11:00 AM", is_active: true, sort_order: 7 },
  { id: 8, slot: "11:30", label: "11:30 AM", labelEs: "11:30 AM", range: "11:30 AM", rangeEs: "11:30 AM", is_active: true, sort_order: 8 },
  { id: 9, slot: "12:00", label: "12:00 PM", labelEs: "12:00 PM", range: "12:00 PM", rangeEs: "12:00 PM", is_active: true, sort_order: 9 },
  { id: 10, slot: "12:30", label: "12:30 PM", labelEs: "12:30 PM", range: "12:30 PM", rangeEs: "12:30 PM", is_active: true, sort_order: 10 },
  { id: 11, slot: "13:00", label: "1:00 PM", labelEs: "1:00 PM", range: "1:00 PM", rangeEs: "1:00 PM", is_active: true, sort_order: 11 },
  { id: 12, slot: "13:30", label: "1:30 PM", labelEs: "1:30 PM", range: "1:30 PM", rangeEs: "1:30 PM", is_active: true, sort_order: 12 },
  { id: 13, slot: "14:00", label: "2:00 PM", labelEs: "2:00 PM", range: "2:00 PM", rangeEs: "2:00 PM", is_active: true, sort_order: 13 },
  { id: 14, slot: "14:30", label: "2:30 PM", labelEs: "2:30 PM", range: "2:30 PM", rangeEs: "2:30 PM", is_active: true, sort_order: 14 },
  { id: 15, slot: "15:00", label: "3:00 PM", labelEs: "3:00 PM", range: "3:00 PM", rangeEs: "3:00 PM", is_active: true, sort_order: 15 },
  { id: 16, slot: "15:30", label: "3:30 PM", labelEs: "3:30 PM", range: "3:30 PM", rangeEs: "3:30 PM", is_active: true, sort_order: 16 },
  { id: 17, slot: "16:00", label: "4:00 PM", labelEs: "4:00 PM", range: "4:00 PM", rangeEs: "4:00 PM", is_active: true, sort_order: 17 },
  { id: 18, slot: "16:30", label: "4:30 PM", labelEs: "4:30 PM", range: "4:30 PM", rangeEs: "4:30 PM", is_active: true, sort_order: 18 },
  { id: 19, slot: "17:00", label: "5:00 PM", labelEs: "5:00 PM", range: "5:00 PM", rangeEs: "5:00 PM", is_active: true, sort_order: 19 },
  { id: 20, slot: "17:30", label: "5:30 PM", labelEs: "5:30 PM", range: "5:30 PM", rangeEs: "5:30 PM", is_active: true, sort_order: 20 },
];

export default function AdminTimeWindowsPage({ params }: AdminTimeWindowsProps) {
  const { lang } = use(params);
  const locale = lang || "en";
  const isEs = locale === "es";

  const [timeWindows, setTimeWindows] = useState<TimeWindowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editWindow, setEditWindow] = useState<TimeWindowConfig | null>(null);
  const [showForm, setShowForm] = useState(false);

  const t = {
    title: isEs ? "Configuración de Horarios" : "Time Window Settings",
    back: isEs ? "← Volver al Panel" : "← Back to Dashboard",
    slot: isEs ? "Horario" : "Time Slot",
    label: isEs ? "Etiqueta" : "Label",
    active: isEs ? "Activo" : "Active",
    inactive: isEs ? "Inactivo" : "Inactive",
    edit: isEs ? "Editar" : "Edit",
    delete: isEs ? "Eliminar" : "Delete",
    save: isEs ? "Guardar" : "Save",
    cancel: isEs ? "Cancelar" : "Cancel",
    newWindow: isEs ? "+ Nuevo Horario" : "+ New Time Slot",
    sortOrder: isEs ? "Orden" : "Sort Order",
    loading: isEs ? "Guardando..." : "Saving...",
    saved: isEs ? "Guardado correctamente!" : "Saved successfully!",
    errorLoad: isEs ? "Error al cargar horarios" : "Failed to load time windows",
    errorSave: isEs ? "Error al guardar cambios" : "Failed to save changes",
  };

  const fetchTimeWindows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/time-windows");
      if (!res.ok) {
        // Fallback to default if API doesn't exist yet
        setTimeWindows(DEFAULT_TIME_WINDOWS);
      } else {
        const json = await res.json();
        setTimeWindows(json.timeWindows || []);
      }
    } catch (err) {
      console.error("Load time windows error:", err);
      setTimeWindows(DEFAULT_TIME_WINDOWS); // Fallback to defaults
      setError(isEs ? "Error al cargar horarios" : "Failed to load time windows");
    } finally {
      setLoading(false);
    }
  }, [isEs]);

  useEffect(() => {
    fetchTimeWindows();
  }, [fetchTimeWindows]);

  function openNew() {
    setEditWindow({
      id: 0,
      slot: "",
      label: "",
      labelEs: "",
      range: "",
      rangeEs: "",
      is_active: true,
      sort_order: timeWindows.length + 1,
    });
    setShowForm(true);
  }

  function openEdit(window: TimeWindowConfig) {
    setEditWindow({ ...window });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditWindow(null);
    setError(null);
  }

  async function handleSave() {
    if (!editWindow) return;
    setSaving(true);
    setError(null);

    try {
      const isNew = !editWindow.id || editWindow.id === 0; // Temporary IDs for new items
      const url = isNew ? "/api/admin/time-windows" : `/api/admin/time-windows/${editWindow.id}`;
      const method = isNew ? "POST" : "PATCH";

      // Format data for API
      const windowData = {
        slot: editWindow.slot,
        label: editWindow.label,
        label_es: editWindow.labelEs,
        range: editWindow.range,
        range_es: editWindow.rangeEs,
        is_active: editWindow.is_active,
        sort_order: editWindow.sort_order,
      };

      const res = await adminFetch(url, {
        method,
        body: JSON.stringify(windowData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');

      setSuccess(isEs ? '¡Guardado correctamente!' : 'Saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      closeForm();
      await fetchTimeWindows(); // Refresh list
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(isEs ? '¿Eliminar este horario permanentemente?' : 'Delete this time slot permanently?')) return;
    try {
      await adminFetch(`/api/admin/time-windows/${id}`, { method: 'DELETE' });
      await fetchTimeWindows(); // Refresh list
    } catch (err) {
      console.error("Delete error:", err);
      setError(isEs ? 'Error al eliminar' : 'Failed to delete');
    }
  }

  // Sort by sort_order
  const sortedWindows = [...timeWindows].sort((a, b) => a.sort_order - b.sort_order);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">{t.title}</h1>
          <p className="text-gray-600 mb-6">{t.back}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Link href={`/${locale}/admin`} className="text-sm text-blue-600 hover:underline mb-2 block">
          {t.back}
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-sm text-gray-500">
              {isEs ? 'Configure los horarios disponibles para la reserva de clientes' : 'Configure time slots available for client booking'}
            </p>
          </div>
          <button
            onClick={openNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {t.newWindow}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}
        {error && !showForm && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {sortedWindows.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {isEs ? 'No hay horarios configurados. Agrega el primero.' : 'No time windows configured. Add the first one.'}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #{' '}
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.slot}
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.label} (EN)
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.label} (ES)
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.active}
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.sortOrder}
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedWindows.map((window, index) => (
                    <tr key={window.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-center text-gray-500">{index + 1}</td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {window.slot}
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={window.label ?? ''}
                          onChange={(e) => {
                            setEditWindow(prev => prev ? { ...prev, label: e.target.value } : null);
                            // For new items, we need to handle differently
                            if (!editWindow || editWindow.id !== window.id) {
                              const newWindow = { ...window, label: e.target.value };
                              setEditWindow(newWindow);
                            }
                          }}
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
                          disabled={!!(showForm && editWindow && editWindow.id !== window.id)}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={window.labelEs ?? ''}
                          onChange={(e) => {
                            if (!editWindow || editWindow.id !== window.id) {
                              const newWindow = { ...window, labelEs: e.target.value };
                              setEditWindow(newWindow);
                            }
                          }}
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
                          disabled={!!(showForm && editWindow && editWindow.id !== window.id)}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={window.is_active ?? true}
                            onChange={(e) => {
                              if (!editWindow || editWindow.id !== window.id) {
                                const newWindow = { ...window, is_active: e.target.checked };
                                setEditWindow(newWindow);
                              }
                            }}
                            className="w-4 h-4 accent-blue-600"
                          />
                          <span className="text-sm text-gray-700">{window.is_active ? t.active : t.inactive}</span>
                        </label>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {window.sort_order}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEdit(window)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            {t.edit}
                          </button>
                          <button
                            onClick={() => handleDelete(window.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            {t.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit / Create Form */}
        {showForm && editWindow && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editWindow.id
                    ? (isEs ? 'Editar' : 'Edit')
                    : (isEs ? 'Nuevo' : 'New')}
                  {t.slot}
                </h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t.slot} (HH:MM format)
                  </label>
                  <input
                    type="text"
                    value={editWindow.slot ?? ''}
                    onChange={(e) => setEditWindow({ ...editWindow, slot: e.target.value })}
                    placeholder="09:00"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Format: HH:MM (24-hour format, e.g., 09:00, 13:30)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t.label} (English)
                  </label>
                  <input
                    type="text"
                    value={editWindow.label ?? ''}
                    onChange={(e) => setEditWindow({ ...editWindow, label: e.target.value })}
                    placeholder="9:00 AM"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t.label} (Spanish)
                  </label>
                  <input
                    type="text"
                    value={editWindow.labelEs ?? ''}
                    onChange={(e) => setEditWindow({ ...editWindow, labelEs: e.target.value })}
                    placeholder="9:00 AM"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t.active}
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editWindow.is_active ?? true}
                      onChange={(e) => setEditWindow({ ...editWindow, is_active: e.target.checked })}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm font-medium">
                      {editWindow.is_active ? t.active : t.inactive}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t.sortOrder}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editWindow.sort_order ?? 1}
                    onChange={(e) => setEditWindow({ ...editWindow, sort_order: parseInt(e.target.value) || 1 })}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
                  <button
                    onClick={closeForm}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    {saving ? t.save : t.save}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}