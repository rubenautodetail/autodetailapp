"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";

interface AdminServicesProps {
    params: Promise<{ lang: "en" | "es" }>;
}

interface Service {
    id: number;
    name: string;
    name_es: string | null;
    description: string | null;
    description_es: string | null;
    base_price: number | string;
    duration_minutes: number | null;
    is_active: boolean | null;
    sort_order: number | null;
    stripe_product_id: string | null;
}

interface AddOn {
    id: number;
    name: string;
    name_es: string | null;
    description: string | null;
    description_es: string | null;
    price: number | string;
    duration_minutes: number | null;
    is_active: boolean | null;
    sort_order: number | null;
    stripe_product_id: string | null;
}

type Tab = 'services' | 'addons';

type EditItem = (Partial<Service> & { type: 'service' }) | (Partial<AddOn> & { type: 'addon' });

const EMPTY_SERVICE: EditItem = {
    type: 'service',
    name: '', name_es: '', description: '', description_es: '',
    base_price: '', duration_minutes: 60, sort_order: 10, is_active: true,
};

const EMPTY_ADDON: EditItem = {
    type: 'addon',
    name: '', name_es: '', description: '', description_es: '',
    price: '', duration_minutes: 30, sort_order: 10, is_active: true,
};

export default function AdminServicesPage({ params }: AdminServicesProps) {
    const { lang } = use(params);
    const locale = lang || "en";
    const isEs = locale === "es";

    const [tab, setTab] = useState<Tab>('services');
    const [services, setServices] = useState<Service[]>([]);
    const [addOns, setAddOns] = useState<AddOn[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<EditItem | null>(null);
    const [showForm, setShowForm] = useState(false);

    const t = {
        title: isEs ? "Servicios y Complementos" : "Services & Add-ons",
        back: isEs ? "← Volver al Panel" : "← Back to Dashboard",
        services: isEs ? "Servicios" : "Services",
        addons: isEs ? "Complementos" : "Add-ons",
        newService: isEs ? "+ Nuevo Servicio" : "+ New Service",
        newAddon: isEs ? "+ Nuevo Complemento" : "+ New Add-on",
        price: isEs ? "Precio" : "Price",
        duration: isEs ? "Duración (min)" : "Duration (min)",
        active: isEs ? "Activo" : "Active",
        inactive: isEs ? "Inactivo" : "Inactive",
        edit: isEs ? "Editar" : "Edit",
        deactivate: isEs ? "Desactivar" : "Deactivate",
        hide: isEs ? "Ocultar" : "Hide",
        makeLive: isEs ? "Publicar" : "Live",
        deleteItem: isEs ? "Eliminar" : "Delete",
        save: isEs ? "Guardar" : "Save",
        cancel: isEs ? "Cancelar" : "Cancel",
        stripeSync: isEs ? "Sincronizado con Stripe" : "Synced with Stripe",
        noStripe: isEs ? "Sin producto Stripe" : "No Stripe product",
        nameEn: isEs ? "Nombre (EN)" : "Name (EN)",
        nameEs: isEs ? "Nombre (ES)" : "Name (ES)",
        descEn: isEs ? "Descripción (EN)" : "Description (EN)",
        descEs: isEs ? "Descripción (ES)" : "Description (ES)",
        sortOrder: isEs ? "Orden" : "Sort Order",
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminFetch('/api/admin/services');
            if (!res.ok) throw new Error('Failed to load');
            const json = await res.json();
            setServices(json.services ?? []);
            setAddOns(json.addOns ?? []);
        } catch {
            setError(isEs ? 'Error al cargar datos' : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [isEs]);

    useEffect(() => { fetchData(); }, [fetchData]);

    function openNew() {
        setEditItem(tab === 'services' ? { ...EMPTY_SERVICE } : { ...EMPTY_ADDON });
        setShowForm(true);
    }

    function openEdit(item: Service | AddOn, type: 'service' | 'addon') {
        setEditItem({ ...item, type } as EditItem);
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditItem(null);
        setError(null);
    }

    async function handleSave() {
        if (!editItem) return;
        setSaving(true);
        setError(null);

        try {
            const isNew = !editItem.id;
            const url = isNew ? '/api/admin/services' : `/api/admin/services/${editItem.id}`;
            const method = isNew ? 'POST' : 'PATCH';

            const res = await adminFetch(url, {
                method,
                body: JSON.stringify(editItem),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Save failed');

            setSuccess(isEs ? '¡Guardado correctamente!' : 'Saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
            closeForm();
            fetchData();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDeactivate(id: number, type: 'service' | 'addon') {
        if (!confirm(isEs ? '¿Desactivar este elemento?' : 'Deactivate this item?')) return;
        const url = `/api/admin/services/${id}?type=${type === 'addon' ? 'addon' : 'service'}`;
        await adminFetch(url, { method: 'DELETE' });
        fetchData();
    }

    async function handleToggleActive(item: Service | AddOn, type: 'service' | 'addon') {
        try {
            const url = `/api/admin/services/${item.id}`;
            await adminFetch(url, {
                method: 'PATCH',
                body: JSON.stringify({ type, is_active: !item.is_active })
            });
            fetchData();
        } catch (err) {
            console.error(err);
            alert(isEs ? 'Error al actualizar el estado.' : 'Failed to update status.');
        }
    }

    async function handleDelete(id: number, type: 'service' | 'addon') {
        if (!confirm(isEs
            ? '¿Eliminar permanentemente? Esta acción no se puede deshacer.'
            : 'Permanently delete? This cannot be undone.'
        )) return;
        const url = `/api/admin/services/${id}?type=${type === 'addon' ? 'addon' : 'service'}&permanent=true`;
        await adminFetch(url, { method: 'DELETE' });
        fetchData();
    }

    const items = tab === 'services' ? services : addOns;
    const priceKey = tab === 'services' ? 'base_price' : 'price';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <Link href={`/${locale}/admin`} className="text-sm text-blue-600 hover:underline mb-2 block">
                    {t.back}
                </Link>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
                        <p className="text-sm text-gray-500">
                            {isEs ? 'Gestiona precios y sincroniza con Stripe' : 'Manage prices and sync with Stripe'}
                        </p>
                    </div>
                    <button
                        onClick={openNew}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        {tab === 'services' ? t.newService : t.newAddon}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-4 border-b border-gray-200">
                    {(['services', 'addons'] as Tab[]).map((t_) => (
                        <button
                            key={t_}
                            onClick={() => setTab(t_)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t_
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {t_ === 'services' ? t.services : t.addons}
                        </button>
                    ))}
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

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {isEs ? 'Nombre' : 'Name'}
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t.price}
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t.duration}
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stripe
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {isEs ? 'Estado' : 'Status'}
                                        </th>
                                        <th className="px-6 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                                                {isEs ? 'No hay elementos aún. Crea el primero.' : 'No items yet. Create the first one.'}
                                            </td>
                                        </tr>
                                    ) : items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{item.name}</div>
                                                {item.name_es && (
                                                    <div className="text-xs text-gray-400">{item.name_es}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                                ${parseFloat(String((item as Service).base_price ?? (item as AddOn).price ?? 0)).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {item.duration_minutes ? `${item.duration_minutes} min` : '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.stripe_product_id ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                                        {t.stripeSync}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">{t.noStripe}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                                    {item.is_active ? t.active : t.inactive}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => openEdit(item as Service, tab === 'services' ? 'service' : 'addon')}
                                                        className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                                                    >
                                                        {t.edit}
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleActive(item, tab === 'services' ? 'service' : 'addon')}
                                                        className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
                                                            item.is_active
                                                                ? 'text-orange-600 border-orange-200 hover:bg-orange-50'
                                                                : 'text-green-600 border-green-200 hover:bg-green-50'
                                                        }`}
                                                    >
                                                        {item.is_active ? t.hide : t.makeLive}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id, tab === 'services' ? 'service' : 'addon')}
                                                        className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                                                    >
                                                        {t.deleteItem}
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
            </div>

            {/* Edit / Create Modal */}
            {showForm && editItem && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {editItem.id
                                    ? (isEs ? 'Editar' : 'Edit')
                                    : (isEs ? 'Nuevo' : 'New')
                                } {editItem.type === 'service' ? (isEs ? 'Servicio' : 'Service') : (isEs ? 'Complemento' : 'Add-on')}
                            </h2>
                            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
                            )}

                            <FormField label={t.nameEn} required>
                                <input
                                    type="text"
                                    value={editItem.name ?? ''}
                                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
                                />
                            </FormField>

                            <FormField label={t.nameEs}>
                                <input
                                    type="text"
                                    value={editItem.name_es ?? ''}
                                    onChange={(e) => setEditItem({ ...editItem, name_es: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
                                />
                            </FormField>

                            <FormField label={`${t.price} (USD)`} required>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editItem.type === 'service'
                                        ? ((editItem as Partial<Service>).base_price ?? '')
                                        : ((editItem as Partial<AddOn>).price ?? '')}
                                    onChange={(e) => {
                                        if (editItem.type === 'service') {
                                            setEditItem({ ...editItem, base_price: e.target.value } as EditItem);
                                        } else {
                                            setEditItem({ ...editItem, price: e.target.value } as EditItem);
                                        }
                                    }}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
                                />
                            </FormField>

                            <FormField label={t.duration}>
                                <input
                                    type="number"
                                    min="0"
                                    value={editItem.duration_minutes ?? ''}
                                    onChange={(e) => setEditItem({ ...editItem, duration_minutes: parseInt(e.target.value) || null })}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
                                />
                            </FormField>

                            <FormField label={t.descEn}>
                                <textarea
                                    rows={2}
                                    value={editItem.description ?? ''}
                                    onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400 resize-none"
                                />
                            </FormField>

                            <FormField label={t.descEs}>
                                <textarea
                                    rows={2}
                                    value={editItem.description_es ?? ''}
                                    onChange={(e) => setEditItem({ ...editItem, description_es: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400 resize-none"
                                />
                            </FormField>

                            <FormField label={t.sortOrder}>
                                <input
                                    type="number"
                                    value={editItem.sort_order ?? ''}
                                    onChange={(e) => setEditItem({ ...editItem, sort_order: parseInt(e.target.value) || 10 })}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
                                />
                            </FormField>

                            {editItem.id && (
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editItem.is_active ?? true}
                                            onChange={(e) => setEditItem({ ...editItem, is_active: e.target.checked })}
                                            className="w-4 h-4 accent-blue-600"
                                        />
                                        <span className="text-sm text-gray-700">{t.active}</span>
                                    </label>
                                </div>
                            )}

                            {editItem.id && editItem.stripe_product_id && (
                                <p className="text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2">
                                    Stripe ID: <code className="font-mono">{editItem.stripe_product_id}</code>
                                </p>
                            )}

                            {!editItem.id && (
                                <p className="text-xs text-gray-400">
                                    {isEs
                                        ? 'Se creará automáticamente un producto en Stripe al guardar.'
                                        : 'A Stripe product will be created automatically on save.'}
                                </p>
                            )}
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
                                {saving ? (isEs ? 'Guardando...' : 'Saving...') : t.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
                {label}{required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {children}
        </div>
    );
}
