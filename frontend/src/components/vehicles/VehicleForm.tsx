'use client';

import { useId, useState, type FormEvent, type InvalidEvent } from 'react';
import type { Vehicle } from '@/contexts/BookingStatusContext';
import type { VehicleBodyStyle, VehicleLocale } from '@/types/vehicle';
import { VehicleBodyStyleSelector } from './VehicleBodyStyleSelector';

interface VehicleFormProps {
    locale?: VehicleLocale;
    appearance?: 'dark' | 'light';
    onSubmit: (vehicle: Omit<Vehicle, 'id'>) => Promise<void> | void;
    onCancel?: () => void;
}

interface VehicleFields {
    make: string;
    model: string;
    year: string;
    color: string;
    licensePlate: string;
}

function getInitialFields(): VehicleFields {
    return {
        make: '',
        model: '',
        year: new Date().getFullYear().toString(),
        color: '',
        licensePlate: '',
    };
}

export function VehicleForm({
    locale = 'en',
    appearance = 'light',
    onSubmit,
    onCancel,
}: VehicleFormProps) {
    const formId = useId();
    const isEs = locale === 'es';
    const [fields, setFields] = useState<VehicleFields>(getInitialFields);
    const [bodyStyle, setBodyStyle] = useState<VehicleBodyStyle | null>(null);
    const [styleError, setStyleError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isDark = appearance === 'dark';

    const setField = (field: keyof VehicleFields, value: string) => {
        setFields((current) => ({ ...current, [field]: value }));
    };

    const handleInvalid = (event: InvalidEvent<HTMLFormElement>) => {
        const target = event.target;
        if (target instanceof HTMLInputElement && target.type === 'radio') {
            setStyleError(isEs ? 'Selecciona un estilo de vehículo.' : 'Select a vehicle body style.');
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!bodyStyle) {
            setStyleError(isEs ? 'Selecciona un estilo de vehículo.' : 'Select a vehicle body style.');
            const firstRadio = event.currentTarget.querySelector<HTMLInputElement>('input[type="radio"]');
            firstRadio?.focus();
            return;
        }

        setStyleError('');
        setSubmitError('');
        setIsSubmitting(true);

        try {
            await onSubmit({ ...fields, type: bodyStyle });
        } catch {
            setSubmitError(
                isEs
                    ? 'No se pudo guardar el vehículo. Inténtalo de nuevo.'
                    : 'We could not save the vehicle. Please try again.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClassName = isDark
        ? 'h-11 w-full rounded-xl border border-[#2C355E] bg-[#1A2142] px-4 text-white outline-none transition-colors placeholder:text-[#A5B0D1] focus:border-[#D0B078] focus:ring-2 focus:ring-[#D0B078]/40 disabled:opacity-50 motion-reduce:transition-none'
        : 'h-11 w-full rounded-xl border border-[var(--divider)] bg-[var(--background)] px-4 text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 disabled:opacity-50 motion-reduce:transition-none';
    const labelClassName = `mb-1.5 block text-sm font-semibold ${isDark ? 'text-white' : 'text-[var(--text-primary)]'}`;
    const primaryTextClass = isDark ? 'text-white' : 'text-[var(--text-primary)]';
    const secondaryTextClass = isDark ? 'text-[#A5B0D1]' : 'text-[var(--text-secondary)]';

    return (
        <form
            className="min-w-0 space-y-6"
            onSubmit={handleSubmit}
            onInvalidCapture={handleInvalid}
        >
            <div>
                <h2 className={`text-xl font-bold ${primaryTextClass}`}>
                    {isEs ? 'Agregar nuevo vehículo' : 'Add a new vehicle'}
                </h2>
                <p className={`mt-1 text-sm ${secondaryTextClass}`}>
                    {isEs
                        ? 'Primero elige el estilo y luego agrega los detalles.'
                        : 'Choose the body style first, then add the details.'}
                </p>
            </div>

            <VehicleBodyStyleSelector
                locale={locale}
                appearance={appearance}
                value={bodyStyle}
                onChange={(style) => {
                    setBodyStyle(style);
                    setStyleError('');
                }}
                name={`${formId}-body-style`}
                required
                disabled={isSubmitting}
                error={styleError}
            />

            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor={`${formId}-make`} className={labelClassName}>
                        {isEs ? 'Marca' : 'Make'}
                    </label>
                    <input
                        id={`${formId}-make`}
                        className={inputClassName}
                        value={fields.make}
                        onChange={(event) => setField('make', event.target.value)}
                        placeholder={isEs ? 'Ej. Toyota' : 'e.g. Toyota'}
                        autoComplete="organization"
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <div>
                    <label htmlFor={`${formId}-model`} className={labelClassName}>
                        {isEs ? 'Modelo' : 'Model'}
                    </label>
                    <input
                        id={`${formId}-model`}
                        className={inputClassName}
                        value={fields.model}
                        onChange={(event) => setField('model', event.target.value)}
                        placeholder={isEs ? 'Ej. Corolla' : 'e.g. Corolla'}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <div>
                    <label htmlFor={`${formId}-year`} className={labelClassName}>
                        {isEs ? 'Año' : 'Year'}
                    </label>
                    <input
                        id={`${formId}-year`}
                        className={inputClassName}
                        value={fields.year}
                        onChange={(event) => setField('year', event.target.value)}
                        placeholder="YYYY"
                        inputMode="numeric"
                        pattern="[0-9]{4}"
                        maxLength={4}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <div>
                    <label htmlFor={`${formId}-color`} className={labelClassName}>
                        Color
                    </label>
                    <input
                        id={`${formId}-color`}
                        className={inputClassName}
                        value={fields.color}
                        onChange={(event) => setField('color', event.target.value)}
                        placeholder={isEs ? 'Ej. Negro' : 'e.g. Black'}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor={`${formId}-plate`} className={labelClassName}>
                        {isEs ? 'Placa' : 'License plate'}{' '}
                        <span className={`font-normal ${secondaryTextClass}`}>
                            ({isEs ? 'opcional' : 'optional'})
                        </span>
                    </label>
                    <input
                        id={`${formId}-plate`}
                        className={inputClassName}
                        value={fields.licensePlate}
                        onChange={(event) => setField('licensePlate', event.target.value)}
                        placeholder="ABC-1234"
                        autoCapitalize="characters"
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            {submitError && (
                <p role="alert" className={`text-sm font-semibold ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                    {submitError}
                </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className={`min-h-11 rounded-xl border px-5 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 motion-reduce:transition-none ${isDark ? 'border-[#2C355E] text-[#A5B0D1] hover:bg-[#1A2142] focus-visible:ring-[#D0B078] focus-visible:ring-offset-[#131835]' : 'border-[var(--divider)] text-[var(--text-secondary)] hover:bg-[var(--background)] focus-visible:ring-[var(--accent)] focus-visible:ring-offset-[var(--background)]'}`}
                    >
                        {isEs ? 'Cancelar' : 'Cancel'}
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`min-h-11 rounded-xl px-6 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${isDark ? 'bg-[#D0B078] text-[#131835] hover:bg-[#C4A060] focus-visible:ring-[#D0B078] focus-visible:ring-offset-[#131835]' : 'bg-[var(--accent)] text-white hover:opacity-90 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-[var(--background)]'}`}
                >
                    {isSubmitting
                        ? isEs
                            ? 'Guardando…'
                            : 'Saving…'
                        : isEs
                          ? 'Guardar vehículo'
                          : 'Save vehicle'}
                </button>
            </div>
        </form>
    );
}
