'use client';

import { useEffect, useId, useRef } from 'react';
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
    layout?: 'grid' | 'carousel';
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
    layout = 'grid',
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
    const trackRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<Partial<Record<VehicleBodyStyle, HTMLLabelElement | null>>>({});
    const isEs = locale === 'es';
    const isDark = appearance === 'dark';
    const primaryTextClass = isDark ? 'text-white' : 'text-[var(--text-primary)]';
    const secondaryTextClass = isDark ? 'text-[#A5B0D1]' : 'text-[var(--text-secondary)]';
    const cardClass = isDark
        ? 'border-[#2C355E] bg-[#1A2142] hover:border-[#D0B078]/60 peer-checked:border-[#D0B078] peer-checked:ring-1 peer-checked:ring-[#D0B078] peer-focus-visible:ring-[#D0B078] peer-focus-visible:ring-offset-[#131835]'
        : 'border-[var(--divider)] bg-[var(--card)] hover:border-[var(--accent)]/60 peer-checked:border-[var(--accent)] peer-checked:ring-1 peer-checked:ring-[var(--accent)] peer-focus-visible:ring-[var(--accent)] peer-focus-visible:ring-offset-[var(--background)]';
    const arrowClass = isDark
        ? 'border-[#2C355E] bg-[#151B3A]/90 text-[#A5B0D1] hover:text-[#D0B078] focus-visible:ring-[#D0B078]'
        : 'border-[var(--divider)] bg-[var(--card)]/90 text-[var(--text-secondary)] hover:text-[var(--accent)] focus-visible:ring-[var(--accent)]';

    // Center the selected card by scrolling the track directly: scrollIntoView
    // gets cancelled by the picker's focus management when the panel reopens,
    // and it can also scroll the page vertically. The track is ours alone.
    useEffect(() => {
        if (layout !== 'carousel' || !value) {
            return;
        }

        const frame = requestAnimationFrame(() => {
            const track = trackRef.current;
            const selectedOption = optionRefs.current[value];
            if (!track || !selectedOption) {
                return;
            }

            const trackRect = track.getBoundingClientRect();
            const cardRect = selectedOption.getBoundingClientRect();
            const target = track.scrollLeft
                + (cardRect.left - trackRect.left)
                - (trackRect.width - cardRect.width) / 2;
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            track.scrollTo({
                left: Math.max(0, target),
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
            });
        });
        return () => cancelAnimationFrame(frame);
    }, [layout, value]);

    const scrollCarousel = (direction: -1 | 1) => {
        const track = trackRef.current;
        if (!track) {
            return;
        }

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        track.scrollBy({
            left: direction * 240,
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
    };

    const renderOptions = () => BODY_STYLES.map((style) => {
        const optionId = `${generatedId}-${style}`;
        const descriptionId = `${optionId}-description`;
        const selected = value === style;

        return (
            <div key={style} className={layout === 'carousel' ? 'relative w-[6.75rem] shrink-0 snap-start' : 'relative min-w-0'}>
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
                    ref={layout === 'carousel' ? (element) => {
                        optionRefs.current[style] = element;
                    } : undefined}
                    htmlFor={optionId}
                    className={layout === 'carousel'
                        ? `group relative flex w-[6.75rem] shrink-0 snap-start cursor-pointer flex-col gap-1.5 rounded-xl border-2 p-2 text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${cardClass}`
                        : `group relative flex min-h-[4.5rem] min-w-0 cursor-pointer flex-row items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 sm:min-h-[11rem] sm:flex-col sm:items-stretch sm:gap-0 sm:p-3 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${cardClass}`}
                >
                    {selected && (
                        <span
                            aria-hidden="true"
                            className={`absolute right-2 top-2 flex ${layout === 'carousel' ? 'h-5 w-5 text-xs' : 'h-6 w-6 text-sm'} items-center justify-center rounded-full font-black ${isDark ? 'bg-[#D0B078] text-[#131835]' : 'bg-[var(--accent)] text-white'}`}
                        >
                            ✓
                        </span>
                    )}
                    <div className={layout === 'carousel'
                        ? `flex h-12 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border ${isDark
                            ? 'border-white/[0.06] bg-[radial-gradient(circle_at_50%_28%,rgba(208,176,120,0.16),rgba(8,12,27,0.2)_72%)]'
                            : 'border-black/[0.06] bg-[radial-gradient(circle_at_50%_28%,rgba(208,176,120,0.2),rgba(255,255,255,0.45)_72%)]'}`
                        : `flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border sm:mb-1 sm:h-[4.5rem] sm:w-full ${
                            isDark
                                ? 'border-white/[0.06] bg-[radial-gradient(circle_at_50%_28%,rgba(208,176,120,0.16),rgba(8,12,27,0.2)_72%)]'
                                : 'border-black/[0.06] bg-[radial-gradient(circle_at_50%_28%,rgba(208,176,120,0.2),rgba(255,255,255,0.45)_72%)]'
                        }`}>
                        <VehicleBodyStyleArtwork
                            style={style}
                            locale={locale}
                            className={layout === 'carousel'
                                ? 'h-11 w-full min-w-0 shrink-0'
                                : 'h-[2.75rem] w-full min-w-0 shrink-0 transition-transform duration-200 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:h-[4.75rem]'}
                        />
                    </div>
                    {layout === 'carousel' ? (
                        <span className={`truncate pr-5 text-xs font-bold ${primaryTextClass}`}>
                            {getVehicleBodyStyleLabel(style, locale)}
                        </span>
                    ) : (
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
                    )}
                </label>
            </div>
        );
    });

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

            {layout === 'carousel' ? (
                <>
                    <div className="relative mt-4">
                        <div
                            ref={trackRef}
                            className="flex min-w-0 gap-2 overflow-x-auto snap-x snap-mandatory overscroll-x-contain pb-1 [&::-webkit-scrollbar]:hidden"
                            style={{ scrollbarWidth: 'none' }}
                        >
                            {renderOptions()}
                        </div>
                        <div
                            aria-hidden="true"
                            className={`pointer-events-none absolute inset-y-0 left-0 hidden w-8 sm:block ${isDark ? 'bg-gradient-to-r from-[#151B3A] to-transparent' : 'bg-gradient-to-r from-[var(--card)] to-transparent'}`}
                        />
                        <div
                            aria-hidden="true"
                            className={`pointer-events-none absolute inset-y-0 right-0 hidden w-8 sm:block ${isDark ? 'bg-gradient-to-l from-[#151B3A] to-transparent' : 'bg-gradient-to-l from-[var(--card)] to-transparent'}`}
                        />
                        <button
                            type="button"
                            aria-label={isEs ? 'Desplazar a la izquierda' : 'Scroll left'}
                            onClick={() => scrollCarousel(-1)}
                            className={`absolute left-1 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 sm:flex ${arrowClass}`}
                        >
                            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                                <path d="m12.5 4.5-5 5 5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            aria-label={isEs ? 'Desplazar a la derecha' : 'Scroll right'}
                            onClick={() => scrollCarousel(1)}
                            className={`absolute right-1 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 sm:flex ${arrowClass}`}
                        >
                            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                                <path d="m7.5 4.5 5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                            </svg>
                        </button>
                    </div>
                    {value && (
                        <p className={`mt-2 truncate text-xs ${secondaryTextClass}`}>
                            {VEHICLE_BODY_STYLE_DESCRIPTIONS[value][locale]}
                        </p>
                    )}
                    <div className="sr-only">
                        {BODY_STYLES.map((style) => (
                            <span key={style} id={`${generatedId}-${style}-description`}>
                                {VEHICLE_BODY_STYLE_DESCRIPTIONS[style][locale]}
                            </span>
                        ))}
                    </div>
                </>
            ) : (
                <div className="mt-4 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
                    {renderOptions()}
                </div>
            )}

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
