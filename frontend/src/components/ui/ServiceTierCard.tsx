import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Check, Star, Shield } from 'lucide-react';

interface ServiceTierCardProps {
    tierId: string;
    title: string;
    price: string | number;
    recommended?: boolean;
    features: { id: string; text: string; icon?: 'check' | 'star' | 'shield' }[];
    isSelected?: boolean;
    onSelect: (id: string) => void;
}

export function ServiceTierCard({
    tierId,
    title,
    price,
    recommended,
    features,
    isSelected,
    onSelect
}: ServiceTierCardProps) {
    return (
        <Card className={`relative p-6 transition-all duration-300 ${isSelected ? 'border-[var(--accent-gold)] ring-1 ring-[var(--accent-gold)]' : ''}`}>
            {recommended && (
                <div className="absolute -top-3 right-6 bg-[var(--accent-gold)] text-[#131835] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                </div>
            )}

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className={`text-2xl font-bold ${recommended ? 'text-[var(--accent-gold)]' : 'text-[var(--text-primary)]'}`}>
                        {title}
                    </h3>
                </div>
                <div className="text-right">
                    <span className="text-[var(--text-secondary)] text-sm font-semibold mr-1">$</span>
                    <span className="text-3xl font-bold text-[var(--accent-gold)]">{price}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6">
                {features.map((feature) => (
                    <div key={feature.id} className="flex items-center text-sm text-[var(--text-secondary)]">
                        {feature.icon === 'star' ? (
                            <Star className="w-4 h-4 mr-2 text-[var(--accent-gold)] fill-[var(--accent-gold)] opacity-50" />
                        ) : feature.icon === 'shield' ? (
                            <Shield className="w-4 h-4 mr-2 text-[var(--text-primary)] opacity-50" />
                        ) : (
                            <Check className="w-4 h-4 mr-2 text-[var(--text-primary)] opacity-50" />
                        )}
                        <span>{feature.text}</span>
                    </div>
                ))}
            </div>

            <Button
                fullWidth
                variant={isSelected ? "primary" : "secondary"}
                onClick={() => onSelect(tierId)}
                className={isSelected ? "!bg-[#131835] !text-white !bg-none border border-transparent" : ""}
            >
                {isSelected ? "TIER SELECTED" : `SELECT ${title.toUpperCase()}`}
            </Button>
        </Card>
    );
}
