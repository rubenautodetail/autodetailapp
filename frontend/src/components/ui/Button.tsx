import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    fullWidth?: boolean;
}

export function Button({ className = '', variant = 'primary', fullWidth = false, ...props }: ButtonProps) {
    const baseStyle = "inline-flex justify-center items-center px-6 py-4 rounded-full font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
    const widthStyle = fullWidth ? "w-full" : "";

    const variants = {
        primary: "btn-primary", // Uses the utility from globals.css
        secondary: "bg-[var(--card)] text-[var(--text-primary)] hover:bg-[var(--divider)] shadow-sm",
        outline: "border-2 border-[var(--divider)] text-[var(--text-primary)] hover:bg-[var(--divider)]",
        ghost: "text-[var(--text-secondary)] hover:bg-[var(--divider)]"
    };

    return (
        <button
            className={`${baseStyle} ${widthStyle} ${variants[variant] || variants.primary} ${className}`}
            {...props}
        />
    );
}
