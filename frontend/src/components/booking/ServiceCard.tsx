"use client";

/**
 * ServiceCard Component
 * Displays a selectable service card with pricing and duration
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

    return (
        <Card
            onClick={() => onSelect(service)}
            // The service step renders on a fixed dark canvas, so pin the surface
            // instead of inheriting the light/dark theme token.
            style={{ backgroundColor: isSelected ? '#232845' : '#1A2142' }}
            className={`
                relative cursor-pointer p-5 transition-all duration-300 flex flex-col h-full overflow-hidden
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
                <div className="absolute top-3 right-3 bg-[#D0B078] text-[#131835] p-1 rounded-full shadow-md">
                    <Check className="w-4 h-4" />
                </div>
            )}

            <div className="mb-3 pr-6">
                <h3 className={`text-base font-bold leading-tight break-words ${isSelected ? 'text-[#D0B078]' : 'text-[#FFFFFF]'}`}>
                    {service.name}
                </h3>
                <div className="mt-1" aria-live="polite">
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
                        {isPriceLoading
                            ? locale === 'es' ? 'Actualizando precio…' : 'Updating price…'
                            : priceCaption}
                    </p>
                </div>
            </div>

            <div className="mb-4 text-base leading-relaxed flex-grow min-h-[3rem]">
                <p className="text-[#A5B0D1]">
                    {displayDescription}
                </p>
                {needsTruncation && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded((prev) => !prev);
                        }}
                        className="text-[#D0B078] hover:text-[#D0B078]/80 font-semibold mt-1 text-xs transition-colors"
                    >
                        {isExpanded
                            ? isEs ? 'Ver menos' : 'View less'
                            : isEs ? 'Ver más' : 'View more'}
                    </button>
                )}
            </div>

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#2C355E] gap-2">
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
                        {service.duration} {locale === 'es' ? 'min' : 'mins'}
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
                        ? locale === 'es'
                            ? 'Seleccionado'
                            : 'Selected'
                        : locale === 'es'
                            ? 'Seleccionar'
                            : 'Select'}
                </div>
            </div>
        </Card>
    );
}
