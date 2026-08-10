import type { VehicleBodyStyle, VehicleLocale } from '@/types/vehicle';

interface VehicleSilhouetteProps {
    style: VehicleBodyStyle;
    locale?: VehicleLocale;
    className?: string;
}

const wheel = (cx: number) => (
    <circle cx={cx} cy="58" r="6.5" fill="currentColor" stroke="none" />
);

export function VehicleSilhouette({ style, className = '' }: VehicleSilhouetteProps) {
    const commonProps = {
        fill: 'none',
        stroke: 'currentColor',
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        strokeWidth: 3,
    };

    return (
        <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 120 72"
            className={className}
            {...commonProps}
        >
            {style === 'sedan' && (
                <>
                    <path d="M13 55h8l7-18c1-3 4-5 8-5h38c4 0 7 2 10 5l12 18h11v6H13z" />
                    <path d="M35 36h37c3 0 6 2 8 5l5 8H28l4-10c.6-1.8 1.5-3 3-3z" />
                    <path d="M55 36v13" />
                    {wheel(35)}
                    {wheel(89)}
                </>
            )}
            {style === 'coupe' && (
                <>
                    <path d="M12 55h10l9-16c2-4 6-6 10-6h27c5 0 9 2 13 6l15 16h12v6H12z" />
                    <path d="M39 37h28c4 0 7 2 10 5l7 7H30l5-9c1-2 2-3 4-3z" />
                    <path d="M61 37l9 12" />
                    {wheel(34)}
                    {wheel(91)}
                </>
            )}
            {style === 'suv' && (
                <>
                    <path d="M12 54h9l7-23c1-3 4-5 8-5h44c4 0 8 2 10 6l9 22h9v7H12z" />
                    <path d="M37 31h41c3 0 6 2 7 5l5 13H28l5-15c.5-2 2-3 4-3z" />
                    <path d="M55 31v18M75 31v18" />
                    {wheel(35)}
                    {wheel(91)}
                </>
            )}
            {style === 'large_suv' && (
                <>
                    <path d="M8 53h9l7-28c1-3 4-5 8-5h54c4 0 7 2 9 6l9 27h8v8H8z" />
                    <path d="M34 26h49c3 0 5 2 7 5l6 17H23l5-19c1-2 3-3 6-3z" />
                    <path d="M52 26v22M73 26v22" />
                    {wheel(32)}
                    {wheel(91)}
                </>
            )}
            {style === 'pickup' && (
                <>
                    <path d="M10 54h8l7-23c1-3 4-5 8-5h25c4 0 7 2 9 6l8 15h34v14H10z" />
                    <path d="M34 31h22c3 0 5 2 7 5l6 12H25l5-14c.7-2 2-3 4-3z" />
                    <path d="M51 31v17M77 47v8h31" />
                    {wheel(32)}
                    {wheel(91)}
                </>
            )}
            {style === 'minivan' && (
                <>
                    <path d="M10 54h8l9-25c1-3 4-5 8-5h43c5 0 9 3 12 7l14 23h6v7H10z" />
                    <path d="M37 29h39c4 0 7 2 10 6l8 14H25l6-17c1-2 3-3 6-3z" />
                    <path d="M55 29v20M76 29v20" />
                    <path d="M61 53h18" />
                    {wheel(33)}
                    {wheel(91)}
                </>
            )}
            {style === 'van' && (
                <>
                    <path d="M10 53h10V20c0-4 3-7 7-7h55c7 0 12 4 15 10l10 20c2 3 3 7 3 10v8H10z" />
                    <path d="M29 21h49c5 0 9 3 11 7l10 20H20V30c0-5 4-9 9-9z" />
                    <path d="M56 21v27M78 21v27" />
                    {wheel(34)}
                    {wheel(91)}
                </>
            )}
            {style === 'other' && (
                <>
                    <path d="M12 54h10l8-17c2-4 5-6 10-6h35c5 0 8 2 12 6l11 17h10v7H12z" />
                    <path d="M39 36h34c4 0 7 2 9 5l5 8H30l5-10c1-2 2-3 4-3z" />
                    <path d="M57 42c0-4 3-7 7-7s7 3 7 7c0 5-7 5-7 10M64 56v1" />
                    {wheel(34)}
                    {wheel(92)}
                </>
            )}
        </svg>
    );
}
