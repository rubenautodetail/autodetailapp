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
                relative inline-flex h-8 w-16 shrink-0 cursor-pointer items-center rounded-full
                border-2 overflow-hidden transition-colors duration-200 ease-in-out
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${checked
                    ? 'bg-green-500 border-green-400'
                    : 'bg-[#2A3155] border-[#3D4F7C]'}
            `}
        >
            {label && <span className="sr-only">{label}</span>}
            <span
                aria-hidden="true"
                className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md ring-0
                    transition duration-200 ease-in-out
                    ${checked ? 'translate-x-9 bg-white' : 'translate-x-1 bg-[#A5B0D1]'}
                `}
            />
        </button>
    );
}
