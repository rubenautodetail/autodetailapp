import React from 'react';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
}

export function ToggleSwitch({ checked, onChange, label, disabled = false }: ToggleSwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`
                relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${checked ? 'bg-[var(--accent-gold)]' : 'bg-[var(--divider)]'}
            `}
        >
            {label && <span className="sr-only">{label}</span>}
            <span
                aria-hidden="true"
                className={`
                    pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 
                    transition duration-200 ease-in-out
                    ${checked ? 'translate-x-5' : 'translate-x-0'}
                `}
            />
        </button>
    );
}
