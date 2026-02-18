/**
 * ServiceCard Component
 * Displays a selectable service card with pricing and duration
 */

import React from 'react';
import { Service } from '@/contexts';

interface ServiceCardProps {
    service: Service;
    isSelected: boolean;
    onSelect: (service: Service) => void;
    locale: 'en' | 'es';
}

export function ServiceCard({ service, isSelected, onSelect, locale }: ServiceCardProps) {
    return (
        <div
            onClick={() => onSelect(service)}
            className={`
        relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200
        ${isSelected
                    ? 'border-accent-gold bg-accent-gold/10 shadow-glow ring-1 ring-accent-gold'
                    : 'border-white/10 bg-white/5 hover:border-accent-gold/50 hover:shadow-lg'
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
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-text-primary">
                    {service.name}
                </h3>
                <span className="text-accent-gold font-bold text-lg">
                    ${service.basePrice.toFixed(2)}
                </span>
            </div>

            <p className="text-text-secondary mb-6 text-sm min-h-[40px]">
                {service.description}
            </p>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center text-text-muted text-sm">
                    <svg
                        className="w-5 h-5 mr-2"
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
            px-4 py-2 rounded-lg font-semibold text-sm transition-colors
            ${isSelected
                            ? 'bg-accent-gold text-bg-primary'
                            : 'bg-white/10 text-text-secondary hover:bg-accent-gold/20 hover:text-accent-gold'
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
        </div>
    );
}
