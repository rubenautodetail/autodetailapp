/**
 * ServiceCard Component
 * Displays a selectable service card with pricing and duration
 */

import React from 'react';
import { Service } from '@/contexts';
import { Card } from '@/components/ui/Card';
import { Check } from 'lucide-react';

interface ServiceCardProps {
    service: Service;
    isSelected: boolean;
    onSelect: (service: Service) => void;
    locale: 'en' | 'es';
}

export function ServiceCard({ service, isSelected, onSelect, locale }: ServiceCardProps) {
    return (
        <Card
            onClick={() => onSelect(service)}
            className={`
                relative cursor-pointer p-6 transition-all duration-300 flex flex-col h-full
                ${isSelected
                    ? 'border-[#D0B078] ring-1 ring-[#D0B078] bg-[#D0B078]/5'
                    : 'border-[var(--divider)] hover:border-[#D0B078]/50 hover:shadow-lg'
                }
            `}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${service.name} - $${service.basePrice.toFixed(2)}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(service);
                }
            }}
        >
            {isSelected && (
                <div className="absolute -top-3 right-6 bg-[#D0B078] text-[#131835] p-1 rounded-full shadow-md">
                    <Check className="w-4 h-4" />
                </div>
            )}

            <div className="flex justify-between items-start mb-4">
                <h3 className={`text-xl font-bold ${isSelected ? 'text-[#D0B078]' : 'text-[var(--text-primary)]'}`}>
                    {service.name}
                </h3>
                <div className="text-right">
                    <span className="text-[var(--text-secondary)] text-sm font-semibold mr-1">$</span>
                    <span className="text-2xl font-bold text-[#D0B078]">
                        {service.basePrice.toFixed(2)}
                    </span>
                </div>
            </div>

            <p className="text-[var(--text-secondary)] mb-6 text-sm flex-grow">
                {service.description}
            </p>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--divider)]">
                <div className="flex items-center text-[var(--text-muted)] text-sm">
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
                        px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300
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
