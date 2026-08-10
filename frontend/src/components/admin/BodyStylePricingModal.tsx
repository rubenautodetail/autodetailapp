"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, X } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';
import { VehicleSilhouette } from '@/components/vehicles/VehicleSilhouette';
import {
    BODY_STYLES,
    getVehicleBodyStyleLabel,
    type VehicleBodyStyle,
    type VehicleLocale,
} from '@/types/vehicle';

interface BodyStylePriceRecord {
    id: number;
    service_id: number;
    body_style: VehicleBodyStyle;
    price_cents: number;
    currency: string;
    stripe_price_id: string | null;
    created_at: string;
    updated_at: string;
}

interface BodyStylePricingModalProps {
    service: { id: number; name: string; base_price: number | string };
    onClose: () => void;
    locale?: VehicleLocale;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'warning';

function emptyStyleRecord<T>(factory: () => T): Record<VehicleBodyStyle, T> {
    return Object.fromEntries(BODY_STYLES.map((style) => [style, factory()])) as Record<VehicleBodyStyle, T>;
}

function centsToInput(cents: number): string {
    return (cents / 100).toFixed(2);
}

function inputToCents(value: string): number | null {
    const match = value.trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
    if (!match) return null;
    const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
    return cents > 0 ? cents : null;
}

export function BodyStylePricingModal({
    service,
    onClose,
    locale = 'en',
}: BodyStylePricingModalProps) {
    const isEs = locale === 'es';
    const [records, setRecords] = useState<Partial<Record<VehicleBodyStyle, BodyStylePriceRecord>>>({});
    const [drafts, setDrafts] = useState<Record<VehicleBodyStyle, string>>(() => emptyStyleRecord(() => ''));
    const [states, setStates] = useState<Record<VehicleBodyStyle, SaveState>>(() => emptyStyleRecord(() => 'idle'));
    const [messages, setMessages] = useState<Record<VehicleBodyStyle, string>>(() => emptyStyleRecord(() => ''));
    const [operationIds, setOperationIds] = useState<Record<VehicleBodyStyle, string>>(() => emptyStyleRecord(() => crypto.randomUUID()));
    const [basePriceCents, setBasePriceCents] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const errorRef = useRef<HTMLDivElement>(null);

    const currency = useMemo(
        () => new Intl.NumberFormat(locale === 'es' ? 'es-US' : 'en-US', { style: 'currency', currency: 'USD' }),
        [locale],
    );

    const loadPrices = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const response = await adminFetch(`/api/admin/services/${service.id}/body-style-prices`);
            const json = await response.json() as {
                basePriceCents?: number;
                prices?: BodyStylePriceRecord[];
                error?: string;
            };
            if (!response.ok) throw new Error(json.error ?? 'Load failed');
            const nextRecords: Partial<Record<VehicleBodyStyle, BodyStylePriceRecord>> = {};
            const nextDrafts = emptyStyleRecord(() => '');
            for (const price of json.prices ?? []) {
                if (BODY_STYLES.includes(price.body_style)) {
                    nextRecords[price.body_style] = price;
                    nextDrafts[price.body_style] = centsToInput(price.price_cents);
                }
            }
            setRecords(nextRecords);
            setDrafts(nextDrafts);
            setBasePriceCents(json.basePriceCents ?? 0);
        } catch {
            setLoadError(isEs ? 'No se pudieron cargar los precios por tamaño.' : 'Could not load body-style prices.');
        } finally {
            setLoading(false);
        }
    }, [isEs, service.id]);

    useEffect(() => { void loadPrices(); }, [loadPrices]);
    useEffect(() => {
        if (loadError) errorRef.current?.focus();
    }, [loadError]);

    const hasUnsavedChanges = BODY_STYLES.some((style) => {
        const saved = records[style] ? centsToInput(records[style].price_cents) : '';
        return drafts[style] !== saved;
    });

    function requestClose() {
        if (hasUnsavedChanges && !window.confirm(isEs
            ? 'Tienes cambios sin guardar. ¿Quieres salir?'
            : 'You have unsaved changes. Leave anyway?')) return;
        onClose();
    }

    function setCellState(style: VehicleBodyStyle, state: SaveState, message = '') {
        setStates((current) => ({ ...current, [style]: state }));
        setMessages((current) => ({ ...current, [style]: message }));
    }

    async function saveStyle(style: VehicleBodyStyle) {
        const priceCents = inputToCents(drafts[style]);
        if (!priceCents) {
            setCellState(style, 'error', isEs ? 'Ingresa un precio válido.' : 'Enter a valid price.');
            return;
        }
        setCellState(style, 'saving', isEs ? 'Guardando y sincronizando…' : 'Saving and syncing…');
        try {
            const response = await adminFetch(`/api/admin/services/${service.id}/body-style-prices/${style}`, {
                method: 'PUT',
                body: JSON.stringify({
                    priceCents,
                    currency: 'usd',
                    expectedUpdatedAt: records[style]?.updated_at ?? null,
                    operationId: operationIds[style],
                }),
            });
            const json = await response.json() as {
                data?: BodyStylePriceRecord;
                error?: string;
                stripeArchiveWarning?: boolean;
            };
            if (response.status === 409) {
                await loadPrices();
                throw new Error(isEs
                    ? 'Otro administrador cambió este precio. Revísalo e inténtalo de nuevo.'
                    : 'Another admin changed this price. Review it and try again.');
            }
            if (!response.ok || !json.data) throw new Error(json.error ?? 'Save failed');
            setRecords((current) => ({ ...current, [style]: json.data }));
            setDrafts((current) => ({ ...current, [style]: centsToInput(json.data!.price_cents) }));
            setOperationIds((current) => ({ ...current, [style]: crypto.randomUUID() }));
            setCellState(
                style,
                json.stripeArchiveWarning ? 'warning' : 'saved',
                json.stripeArchiveWarning
                    ? (isEs ? 'Guardado; Stripe no archivó el precio anterior.' : 'Saved; Stripe could not archive the previous price.')
                    : (isEs ? 'Guardado y sincronizado con Stripe.' : 'Saved and synced with Stripe.'),
            );
        } catch (error) {
            setCellState(style, 'error', error instanceof Error ? error.message : (isEs ? 'No se pudo guardar.' : 'Could not save.'));
        }
    }

    async function inheritBase(style: VehicleBodyStyle) {
        const existing = records[style];
        if (!existing) {
            setDrafts((current) => ({ ...current, [style]: '' }));
            setCellState(style, 'idle');
            return;
        }
        setCellState(style, 'saving', isEs ? 'Restaurando precio base…' : 'Restoring base price…');
        try {
            const response = await adminFetch(`/api/admin/services/${service.id}/body-style-prices/${style}`, {
                method: 'DELETE',
                body: JSON.stringify({ expectedUpdatedAt: existing.updated_at }),
            });
            const json = await response.json() as { error?: string; stripeArchiveWarning?: boolean };
            if (response.status === 409) {
                await loadPrices();
                throw new Error(isEs ? 'El precio cambió. Revisa los datos actuales.' : 'The price changed. Review the current value.');
            }
            if (!response.ok) throw new Error(json.error ?? 'Delete failed');
            setRecords((current) => {
                const next = { ...current };
                delete next[style];
                return next;
            });
            setDrafts((current) => ({ ...current, [style]: '' }));
            setCellState(
                style,
                json.stripeArchiveWarning ? 'warning' : 'saved',
                json.stripeArchiveWarning
                    ? (isEs ? 'Hereda el precio base; revisa el archivo en Stripe.' : 'Now inherits base price; review Stripe archival.')
                    : (isEs ? 'Ahora usa el precio base.' : 'Now using the base price.'),
            );
        } catch (error) {
            setCellState(style, 'error', error instanceof Error ? error.message : (isEs ? 'No se pudo actualizar.' : 'Could not update.'));
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6">
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="body-style-pricing-title"
                className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
                <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                            {isEs ? 'Precios por tamaño' : 'Body-style pricing'}
                        </p>
                        <h2 id="body-style-pricing-title" className="mt-1 text-xl font-bold text-slate-950">
                            {service.name}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                            {isEs ? 'Vacío significa que usa el precio base de ' : 'A blank field inherits the base price of '}
                            <strong className="text-slate-900">{currency.format(basePriceCents / 100)}</strong>.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={requestClose}
                        aria-label={isEs ? 'Cerrar' : 'Close'}
                        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </header>

                <div className="overflow-y-auto px-5 py-5 sm:px-6">
                    {loadError && (
                        <div ref={errorRef} tabIndex={-1} role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 outline-none">
                            {loadError}
                            <button type="button" onClick={() => void loadPrices()} className="ml-3 font-semibold underline">
                                {isEs ? 'Reintentar' : 'Retry'}
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex min-h-64 items-center justify-center text-slate-600" role="status">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin motion-reduce:animate-none" />
                            {isEs ? 'Cargando precios…' : 'Loading prices…'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {BODY_STYLES.map((style) => {
                                const state = states[style];
                                const current = records[style];
                                const inputId = `body-style-price-${style}`;
                                return (
                                    <article key={style} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200">
                                                <VehicleSilhouette style={style} locale={locale} className="h-11 w-16" />
                                            </div>
                                            <div className="min-w-0">
                                                <label htmlFor={inputId} className="block font-semibold text-slate-950">
                                                    {getVehicleBodyStyleLabel(style, locale)}
                                                </label>
                                                <p className="text-xs text-slate-500">
                                                    {current
                                                        ? `${isEs ? 'Precio personalizado' : 'Custom price'} · Stripe`
                                                        : `${isEs ? 'Heredado' : 'Inherited'} · ${currency.format(basePriceCents / 100)}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <div className="relative flex-1">
                                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">$</span>
                                                <input
                                                    id={inputId}
                                                    inputMode="decimal"
                                                    value={drafts[style]}
                                                    onChange={(event) => {
                                                        setDrafts((currentDrafts) => ({ ...currentDrafts, [style]: event.target.value }));
                                                        setCellState(style, 'idle');
                                                    }}
                                                    placeholder={centsToInput(basePriceCents)}
                                                    aria-describedby={`${inputId}-status`}
                                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-7 pr-3 text-sm text-slate-950 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => void saveStyle(style)}
                                                disabled={state === 'saving' || drafts[style].trim() === ''}
                                                className="h-11 cursor-pointer rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {state === 'saving' ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : (isEs ? 'Guardar' : 'Save')}
                                            </button>
                                        </div>

                                        <div className="mt-3 flex min-h-6 items-center justify-between gap-2">
                                            <p id={`${inputId}-status`} aria-live="polite" className={`flex items-center gap-1 text-xs ${
                                                state === 'error' ? 'text-red-700' : state === 'warning' ? 'text-amber-700' : state === 'saved' ? 'text-emerald-700' : 'text-slate-500'
                                            }`}>
                                                {state === 'saved' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                                {(state === 'error' || state === 'warning') && <AlertTriangle className="h-3.5 w-3.5" />}
                                                {messages[style]}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => void inheritBase(style)}
                                                disabled={state === 'saving' || (!current && drafts[style] === '')}
                                                className="flex shrink-0 cursor-pointer items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <RotateCcw className="h-3.5 w-3.5" />
                                                {isEs ? 'Usar precio base' : 'Use base price'}
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
