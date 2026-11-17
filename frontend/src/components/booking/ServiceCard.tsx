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
import { slugify, toDisplayName } from '@/lib/seo/serviceNames';
import { getServiceSummary, isPopularService } from '@/lib/booking/serviceSummaries';

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
    const displayDescription = description;
    const visiblePrice = displayPrice ?? service.basePrice;
    // service.name already comes in the customer's language, so this matches the
    // address of the full service page (/en/services/express-detail, /es/services/detallado-express).
    const fullServiceHref = `/${locale}/services/${slugify(toDisplayName(service.name))}`;
    const summary = getServiceSummary(service.name, locale);
    const popular = isPopularService(service.name);
    // Until a vehicle is chosen the price is a "from" price; the list heading already
    // says so once, so the card doesn't repeat it.
    const metaCaption = isPriceLoading
        ? isEs ? 'Actualizando precio…' : 'Updating price…'
        : isEstimate ? undefined : priceCaption;

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
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-base font-bold leading-tight break-words ${isSelected ? 'text-[#D0B078]' : 'text-[#FFFFFF]'}`}>
                            {service.name}
                        </h3>
                        {popular && (
                            <span className="rounded-full bg-[#D0B078] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#131835]">
                                {isEs ? 'Más popular' : 'Most popular'}
                            </span>
                        )}
                    </div>

                    {summary && (
                        <p className="mt-1.5 text-sm leading-snug text-[#A5B0D1]">{summary}</p>
                    )}

                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#8994B8]" aria-live="polite">
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                            {service.duration} {isEs ? 'min' : 'mins'}
                            {metaCaption ? ` · ${metaCaption}` : ''}
                        </span>
                    </p>

                    {description && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded((prev) => !prev);
                            }}
                            aria-expanded={isExpanded}
                            className="mt-2 text-sm font-semibold text-[#D0B078] transition-colors hover:text-[#D0B078]/80"
                        >
                            {isExpanded
                                ? isEs ? 'Ocultar' : 'Hide'
                                : isEs ? 'Ver qué incluye' : 'What\u2019s included'}
                            <span aria-hidden="true"> {isExpanded ? '▴' : '▾'}</span>
                        </button>
                    )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2" aria-live="polite">
                    <span key={`${visiblePrice}-${isEstimate}`} className="price-changed whitespace-nowrap text-right">
                        {isEstimate && (
                            <span className="mr-1 text-xs font-semibold text-[#8994B8]">
                                {isEs ? 'desde' : 'from'}
                            </span>
                        )}
                        <span className="text-sm font-semibold text-[#A5B0D1]">$</span>
                        <span className={`ml-0.5 text-xl font-bold ${isEstimate ? 'text-[#A5B0D1]' : 'text-[#D0B078]'}`}>
                            {(Number(visiblePrice) || 0).toFixed(2)}
                        </span>
                    </span>
                    <span
                        aria-hidden="true"
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-black ${isSelected
                            ? 'bg-[#D0B078] text-[#131835]'
                            : 'border-2 border-[#4A5580]'
                            }`}
                    >
                        {isSelected ? '✓' : ''}
                    </span>
                </div>
            </div>

            <div
                className={`${isExpanded ? 'mt-3 block border-t border-[#2C355E] pt-3' : 'hidden'} text-sm leading-relaxed sm:text-base`}
            >
                <ul className="text-[#A5B0D1] leading-snug space-y-0.5 sm:columns-2 sm:gap-x-8">
                    {displayDescription
                        .split('\n')
                        .map((line: string) => line.trim())
                        .filter((line: string) => line.length > 0)
                        .map((line: string, idx: number) => {
                            const isHeader = line.startsWith('>>>>') || (line.startsWith('—') && line.endsWith('—'));
                            if (isHeader) {
                                const label = line.replace(/[>—<]/g, '').trim();
                                return (
                                    <li key={idx} className="text-center text-[#D0B078] font-bold text-sm sm:text-base uppercase tracking-wide pt-1 first:pt-0 sm:[column-span:all]">
                                        {label}
                                    </li>
                                );
                            }
                            return (
                                <li key={idx} className="flex gap-2 break-inside-avoid">
                                    <span className="text-white/40 shrink-0">•</span>
                                    <span>{line}</span>
                                </li>
                            );
                        })}
                </ul>
                {/* Opens in a new tab so the customer keeps their booking progress. */}
                <a
                    href={fullServiceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#D0B078] hover:underline"
                >
                    {isEs ? 'Ver servicio completo' : 'See full service'} <span aria-hidden="true">→</span>
                </a>
            </div>

        </Card>
    );
}
