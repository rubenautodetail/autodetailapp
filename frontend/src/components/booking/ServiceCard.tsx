"use client";

/**
 * ServiceCard Component
 *
 * Two layouts from one component:
 * - Mobile (<sm): a compact tappable row. Name and meta on the left, the price
 *   lined up on the right edge so every service can be compared in one glance,
 *   selection shown as a fill-in circle, description behind a Details toggle.
 *   Five services fit in about one screen instead of five.
 * - sm and up: the full card with description, duration and Select pill.
 */

import React, { useState } from 'react';
import { Service } from '@/contexts';
import { Card } from '@/components/ui/Card';
import { Check } from 'lucide-react';

const DESCRIPTION_TRUNCATE_LENGTH = 110;

interface ServiceCardProps {
    service: Service;
    isSelected: boolean;
    onSelect: (service: Service) => void;
    locale: 'en' | 'es';
    displayPrice?: number;
    priceCaption?: string;
    isPriceLoading?: boolean;
    /** True until a vehicle/body style is chosen — the price shown is a starting price, not the final one. */
    isEstimate?: boolean;
}

export function ServiceCard({
    service,
    isSelected,
    onSelect,
    locale,
    displayPrice,
    priceCaption,
    isPriceLoading = false,
    isEstimate = false,
}: ServiceCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isEs = locale === 'es';
    const description = service.description ?? '';
    const needsTruncation = description.length > DESCRIPTION_TRUNCATE_LENGTH;
    const displayDescription = needsTruncation && !isExpanded
        ? description.slice(0, DESCRIPTION_TRUNCATE_LENGTH).trimEnd() + '...'
        : description;
    const visiblePrice = displayPrice ?? service.basePrice;
    const metaCaption = isPriceLoading
        ? isEs ? 'Actualizando precio…' : 'Updating price…'
        : priceCaption;

    return (
        <Card
            onClick={() => onSelect(service)}
            // The service step renders on a fixed dark canvas, so pin the surface
            // instead of inheriting the light/dark theme token.
            style={{ backgroundColor: isSelected ? '#232845' : '#1A2142' }}
            className={`
                relative cursor-pointer p-3.5 sm:p-5 transition-all duration-300 flex flex-col h-full overflow-hidden
                ${isSelected
                    ? 'border-[#D0B078] ring-1 ring-[#D0B078]'
                    : 'border-[#2C355E] hover:border-[#D0B078]/50 hover:shadow-lg'
                }
            `}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${service.name} - $${(Number(visiblePrice) || 0).toFixed(2)}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(service);
                }
            }}
        >
            {isSelected && (
                <div className="absolute top-3 right-3 hidden bg-[#D0B078] text-[#131835] p-1 rounded-full shadow-md sm:block">
                    <Check className="w-4 h-4" />
                </div>
            )}

            <div className="flex items-center justify-between gap-3 sm:mb-3 sm:block sm:pr-6">
                <div className="min-w-0">
                    <h3 className={`text-sm sm:text-base font-bold leading-tight break-words ${isSelected ? 'text-[#D0B078]' : 'text-[#FFFFFF]'}`}>
                        {service.name}
                    </h3>

                    {/* Mobile meta line: duration and price context in one glance. */}
                    <p className="mt-0.5 text-[11px] font-medium text-[#8994B8] sm:hidden" aria-live="polite">
                        {service.duration} {isEs ? 'min' : 'mins'}
                        {metaCaption ? ` · ${metaCaption}` : ''}
                    </p>

                    {/* Desktop price block */}
                    <div className="mt-1 hidden sm:block" aria-live="polite">
                        {/* Re-keyed on the amount so the flash replays each time the price moves. */}
                        <span key={`${visiblePrice}-${isEstimate}`} className="price-changed">
                            {isEstimate && (
                                <span className="mr-1 text-sm font-semibold text-[#8994B8]">
                                    {isEs ? 'Desde' : 'From'}
                                </span>
                            )}
                            <span className="text-[#A5B0D1] text-sm font-semibold">$</span>
                            <span className={`text-xl font-bold ml-0.5 ${isEstimate ? 'text-[#A5B0D1]' : 'text-[#D0B078]'}`}>
                                {(Number(visiblePrice) || 0).toFixed(2)}
                            </span>
                        </span>
                        <p className="mt-0.5 min-h-4 text-[11px] font-medium text-[#8994B8]">
                            {metaCaption}
                        </p>
                    </div>
                </div>

                {/* Mobile right edge: price plus selection circle. */}
                <div className="flex shrink-0 items-center gap-2.5 sm:hidden" aria-live="polite">
                    <span key={`m-${visiblePrice}-${isEstimate}`} className="price-changed whitespace-nowrap text-right">
                        {isEstimate && (
                            <span className="mr-1 text-[11px] font-semibold text-[#8994B8]">
                                {isEs ? 'Desde' : 'From'}
                            </span>
                        )}
                        <span className="text-xs font-semibold text-[#A5B0D1]">$</span>
                        <span className={`ml-0.5 text-base font-bold ${isEstimate ? 'text-[#A5B0D1]' : 'text-[#D0B078]'}`}>
                            {(Number(visiblePrice) || 0).toFixed(2)}
                        </span>
                    </span>
                    <span
                        aria-hidden="true"
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                            isSelected
                                ? 'bg-[#D0B078] text-[#131835]'
                                : 'border-2 border-[#4A5580]'
                        }`}
                    >
                        {isSelected ? '✓' : ''}
                    </span>
                </div>
            </div>

            {/* Mobile disclosure: the description is on demand, not in the way. */}
            {description && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded((prev) => !prev);
                    }}
                    aria-expanded={isExpanded}
                    className="mt-1 self-start text-[11px] font-semibold text-[#D0B078] hover:text-[#D0B078]/80 transition-colors sm:hidden"
                >
                    {isExpanded
                        ? isEs ? 'Ocultar detalles' : 'Hide details'
                        : isEs ? 'Ver detalles' : 'Details'}
                </button>
            )}

            <div
                className={`${isExpanded ? 'mt-2 block border-t border-[#2C355E] pt-2' : 'hidden'} text-sm leading-relaxed sm:mt-0 sm:mb-4 sm:block sm:border-0 sm:pt-0 sm:text-base sm:flex-grow sm:min-h-[3rem]`}
            >
               <ul className="text-[#A5B0D1] space-y-1 max-h-56 overflow-y-auto pr-1 -mr-4 gold-scrollbar">
    {displayDescription
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .map((line: string, idx: number) => (
            <li key={idx} className="flex gap-2">
                <span className="text-white/40 shrink-0">•</span>
                <span>{line}</span>
            </li>
        ))}
</ul>
                {needsTruncation && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded((prev) => !prev);
                        }}
                        className="hidden text-[#D0B078] hover:text-[#D0B078]/80 font-semibold mt-1 text-xs transition-colors sm:inline"
                    >
                        {isExpanded
                            ? isEs ? 'Ver menos' : 'View less'
                            : isEs ? 'Ver más' : 'View more'}
                    </button>
                )}
            </div>

            <div className="hidden items-center justify-between mt-auto pt-3 border-t border-[#2C355E] gap-2 sm:flex">
                <div className="flex items-center text-[#8994B8] text-xs shrink-0">
                    <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span>
                        {service.duration} {isEs ? 'min' : 'mins'}
                    </span>
                </div>

                <div
                    className={`
                        px-3 py-1.5 rounded-full font-semibold text-xs transition-all duration-300 shrink-0
                        ${isSelected
                            ? 'bg-[#131835] border border-[#D0B078] text-[#D0B078]'
                            : 'bg-[#D0B078] text-[#131835] hover:shadow-[var(--shadow-glow)]'
                        }
                    `}
                >
                    {isSelected
                        ? isEs ? 'Seleccionado' : 'Selected'
                        : isEs ? 'Seleccionar' : 'Select'}
                </div>
            </div>
        </Card>
    );
}
