'use client';

import { useId } from 'react';
import {
    BODY_STYLES,
    getVehicleBodyStyleLabel,
    VEHICLE_BODY_STYLE_DESCRIPTIONS,
    type VehicleBodyStyle,
    type VehicleLocale,
} from '@/types/vehicle';
import { VehicleBodyStyleArtwork } from './VehicleBodyStyleArtwork';

interface VehicleBodyStyleSelectorProps {
    locale?: VehicleLocale;
    appearance?: 'dark' | 'light';
    value: VehicleBodyStyle | null;
    onChange: (style: VehicleBodyStyle) => void;
    name?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    /** Overrides the default question, e.g. when the selector is nested in a larger vehicle picker. */
    legend?: string;
    /** Overrides the default helper line under the legend. */
    description?: string;
}

export function VehicleBodyStyleSelector({
    locale = 'en',
    appearance = 'light',
    value,
    onChange,
    name,
    required = false,
    disabled = false,
    error,
    legend,
    description,
}: VehicleBodyStyleSelectorProps) {
    const generatedId = useId();
    const groupName = name ?? `vehicle-body-style-${generatedId}`;
    const hintId = `${generatedId}-hint`;
    const errorId = `${generatedId}-error`;
    const isEs = locale === 'es';
    const isDark = appearance === 'dark';
    const primaryTextClass = isDark ? 'text-white' : 'text-[var(--text-primary)]';
    const secondaryTextClass = isDark ? 'text-[#A5B0D1]' : 'text-[var(--text-secondary)]';
    const cardClass = isDark
        ? 'border-[#2C355E] bg-[#1A2142] hover:border-[#D0B078]/60 peer-checked:border-[#D0B078] peer-checked:ring-1 peer-checked:ring-[#D0B078] peer-focus-visible:ring-[#D0B078] peer-focus-visible:ring-offset-[#131835]'
        : 'border-[var(--divider)] bg-[var(--card)] hover:border-[var(--accent)]/60 peer-checked:border-[var(--accent)] peer-checked:ring-1 peer-checked:ring-[var(--accent)] peer-focus-visible:ring-[var(--accent)] peer-focus-visible:ring-offset-[var(--background)]';

    return (
        <fieldset
            className="min-w-0"
            disabled={disabled}
            aria-describedby={`${hintId}${error ? ` ${errorId}` : ''}`}
        >
            <legend className={`text-base font-bold ${primaryTextClass}`}>
                {legend ?? (isEs ? '¿Qué estilo de vehículo tienes?' : 'What body style is your vehicle?')}
                {required && <span aria-hidden="true"> *</span>}
            </legend>
            <p className={`mt-1 text-sm ${secondaryTextClass}`}>
                {description ?? (isEs
                    ? 'Selecciona la opción que mejor coincida. Esto nos ayuda a mostrar el precio correcto.'
                    : 'Choose the closest match. This helps us show the correct price.')}
            </p>

            <div className="mt-4 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
                {BODY_STYLES.map((style) => {
                    const optionId = `${generatedId}-${style}`;
                    const descriptionId = `${optionId}-description`;
                    const selected = value === style;

                    return (
                        <div key={style} className="relative min-w-0">
                            <input
                                id={optionId}
                                className="peer sr-only"
                                type="radio"
                                name={groupName}
                                value={style}
                                checked={selected}
                                required={required}
                                aria-describedby={`${descriptionId} ${hintId}`}
                                onChange={() => onChange(style)}
                            />
                            <label
                                htmlFor={optionId}
                                className={`group relative flex min-h-[4.5rem] min-w-0 cursor-pointer flex-row items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 sm:min-h-[11rem] sm:flex-col sm:items-stretch sm:gap-0 sm:p-3 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${cardClass}`}
                            >
                                {selected && (
                                    <span
                                        aria-hidden="true"
                                        className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-sm font-black ${isDark ? 'bg-[#D0B078] text-[#131835]' : 'bg-[var(--accent)] text-white'}`}
                                    >
                                        ✓
                                    </span>
                                )}
                                <div className={`flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border sm:mb-1 sm:h-[4.5rem] sm:w-full ${
                                    isDark
                                        ? 'border-white/[0.06] bg-[radial-gradient(circle_at_50%_28%,rgba(208,176,120,0.16),rgba(8,12,27,0.2)_72%)]'
                                        : 'border-black/[0.06] bg-[radial-gradient(circle_at_50%_28%,rgba(208,176,120,0.2),rgba(255,255,255,0.45)_72%)]'
                                }`}>
                                    <VehicleBodyStyleArtwork
                                        style={style}
                                        locale={locale}
                                        className="h-[2.75rem] w-full min-w-0 shrink-0 transition-transform duration-200 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:h-[4.75rem]"
                                    />
                                </div>
                                <span className="flex min-w-0 flex-col sm:contents">
                                    <span className={`pr-7 text-sm font-bold sm:mt-0.5 ${primaryTextClass}`}>
                                        {getVehicleBodyStyleLabel(style, locale)}
                                    </span>
                                    <span
                                        id={descriptionId}
                                        className={`mt-0.5 pr-7 text-xs leading-4 sm:mt-1 sm:pr-0 ${secondaryTextClass}`}
                                    >
                                        {VEHICLE_BODY_STYLE_DESCRIPTIONS[style][locale]}
                                    </span>
                                </span>
                            </label>
                        </div>
                    );
                })}
            </div>

            <p id={hintId} className={`mt-3 text-xs leading-5 ${secondaryTextClass}`}>
                <strong className={primaryTextClass}>
                    {isEs ? '¿No estás seguro?' : 'Not sure?'}
                </strong>{' '}
                {isEs
                    ? 'Elige SUV grande para modelos de tamaño completo; miniván tiene puertas corredizas y furgoneta es un vehículo grande de pasajeros o carga.'
                    : 'Choose Large SUV for full-size models; a minivan has sliding doors, while a van is a full-size passenger or cargo vehicle.'}
            </p>

            <p className="sr-only" aria-live="polite">
                {value
                    ? isEs
                        ? `${getVehicleBodyStyleLabel(value, locale)} seleccionado.`
                        : `${getVehicleBodyStyleLabel(value, locale)} selected.`
                    : ''}
            </p>

            {error && (
                <p id={errorId} role="alert" className={`mt-2 text-sm font-semibold ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                    {error}
                </p>
            )}
        </fieldset>
    );
}
