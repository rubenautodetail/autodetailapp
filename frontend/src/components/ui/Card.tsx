import React from 'react';

export function Card({ className = '', children, ...props }: React.ComponentProps<'div'>) {
    return (
        <div className={`bg-[var(--card)] rounded-[24px] shadow-[var(--shadow-card)] border border-[var(--divider)] ${className}`} {...props}>
            {children}
        </div>
    );
}
