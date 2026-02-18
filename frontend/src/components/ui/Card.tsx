import React from 'react';

export function Card({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`} {...props}>
            {children}
        </div>
    );
}
