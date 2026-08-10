import type { VehicleBodyStyle, VehicleLocale } from '@/types/vehicle';

interface VehicleSilhouetteProps {
    style: VehicleBodyStyle;
    locale?: VehicleLocale;
    className?: string;
}

const palette = {
    body: '#D0B078',
    highlight: '#F2D69A',
    shadow: '#9A7947',
    glass: '#111936',
    glassHighlight: '#34416D',
    tire: '#070910',
    rim: '#F6F0E5',
    hub: '#B98E4F',
    lamp: '#FFF4CE',
};

function Wheel({ cx, cy = 63, r = 9 }: { cx: number; cy?: number; r?: number }) {
    return (
        <g>
            <circle cx={cx} cy={cy} r={r + 1.5} fill={palette.tire} stroke="#283154" strokeWidth="1.5" />
            <circle cx={cx} cy={cy} r={r - 3} fill={palette.rim} />
            <circle cx={cx} cy={cy} r={r - 5.5} fill={palette.hub} />
            <path d={`M${cx - 4} ${cy}h8M${cx} ${cy - 4}v8`} stroke="#6F5635" strokeWidth="1" opacity=".7" />
        </g>
    );
}

function StudioShadow({ width = 122 }: { width?: number }) {
    return <ellipse cx="80" cy="75" rx={width / 2} ry="4" fill="#020308" opacity=".34" />;
}

function FinishDetails({ front = 142, rear = 16 }: { front?: number; rear?: number }) {
    return (
        <>
            <path d={`M${rear} 57h7`} stroke="#F6DFAF" strokeWidth="2" strokeLinecap="round" />
            <path d={`M${front - 7} 55h7`} stroke={palette.lamp} strokeWidth="3" strokeLinecap="round" />
            <path d={`M${front - 3} 61h4`} stroke="#6E5431" strokeWidth="1.5" strokeLinecap="round" />
        </>
    );
}

export function VehicleSilhouette({ style, className = '' }: VehicleSilhouetteProps) {
    return (
        <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 160 84"
            className={className}
            fill="none"
        >
            <StudioShadow width={style === 'large_suv' || style === 'van' ? 138 : 124} />

            {style === 'sedan' && (
                <>
                    <path d="M12 57c1-5 5-8 11-9l13-2 13-17c3-4 7-6 12-6h30c7 0 11 3 16 8l14 15 18 4c5 1 8 5 8 10v5H12z" fill={palette.body} />
                    <path d="M42 45l12-15c2-2 5-3 8-3h12v18zM79 27h11c5 0 8 2 12 6l11 12H79z" fill={palette.glass} />
                    <path d="M45 43l11-13c2-2 4-2 7-2" stroke={palette.glassHighlight} strokeWidth="2" strokeLinecap="round" />
                    <path d="M78 27v29M113 46l6 11M28 52h89" stroke={palette.shadow} strokeWidth="1.5" opacity=".8" />
                    <path d="M57 51h9M91 51h9" stroke="#6E5431" strokeWidth="2" strokeLinecap="round" />
                    <path d="M18 58c22 1 32-2 42-7M108 33c5 5 10 10 13 15" stroke={palette.highlight} strokeWidth="2" strokeLinecap="round" opacity=".9" />
                    <FinishDetails />
                    <Wheel cx={39} />
                    <Wheel cx={122} />
                </>
            )}

            {style === 'coupe' && (
                <>
                    <path d="M10 59c2-6 7-9 14-10l19-3 16-15c5-5 11-7 18-7h14c8 0 14 3 20 9l14 13 17 4c5 1 8 5 8 10v5H10z" fill={palette.body} />
                    <path d="M51 45l13-12c4-4 8-5 14-5h5v17zM88 28h4c6 0 10 2 15 7l10 10H88z" fill={palette.glass} />
                    <path d="M55 42l11-9c4-3 7-4 12-4" stroke={palette.glassHighlight} strokeWidth="2" strokeLinecap="round" />
                    <path d="M87 28v29M121 47l5 10" stroke={palette.shadow} strokeWidth="1.5" />
                    <path d="M68 51h10M21 56c26 0 39-4 51-10" stroke={palette.highlight} strokeWidth="2" strokeLinecap="round" />
                    <FinishDetails front={145} />
                    <Wheel cx={39} />
                    <Wheel cx={124} />
                </>
            )}

            {style === 'suv' && (
                <>
                    <path d="M10 57c1-5 5-8 11-9l12-2 10-23c2-5 6-7 12-7h45c7 0 11 3 14 9l10 20 17 4c5 1 8 5 8 11v6H10z" fill={palette.body} />
                    <path d="M40 45l9-21c1-3 4-4 8-4h13v25zM75 20h22c5 0 8 2 11 7l9 18H75z" fill={palette.glass} />
                    <path d="M45 41l7-17c1-2 3-3 6-3M74 20v36M100 22v23" stroke={palette.glassHighlight} strokeWidth="2" strokeLinecap="round" />
                    <path d="M119 45l5 12M31 52h92M56 51h9M87 51h9" stroke={palette.shadow} strokeWidth="1.5" />
                    <path d="M18 56c20 0 30-3 39-8" stroke={palette.highlight} strokeWidth="2" strokeLinecap="round" />
                    <FinishDetails front={146} />
                    <Wheel cx={38} r={9.5} />
                    <Wheel cx={124} r={9.5} />
                </>
            )}

            {style === 'large_suv' && (
                <>
                    <path d="M6 56c1-5 5-8 11-9l8-2 8-28c2-6 6-9 13-9h62c7 0 12 3 15 10l11 26 13 4c5 2 7 6 7 11v7H6z" fill={palette.body} />
                    <path d="M32 44l7-25c1-4 4-6 9-6h15v31zM68 13h37c5 0 9 2 11 7l9 24H68z" fill={palette.glass} />
                    <path d="M39 38l5-19c1-3 3-4 6-4M67 13v32M91 13v31M115 19v25" stroke={palette.glassHighlight} strokeWidth="2" strokeLinecap="round" />
                    <path d="M126 44l6 14M24 51h109M51 50h9M78 50h9M106 50h9" stroke={palette.shadow} strokeWidth="1.5" />
                    <path d="M13 55c20 0 30-3 39-8" stroke={palette.highlight} strokeWidth="2" strokeLinecap="round" />
                    <FinishDetails front={151} rear={10} />
                    <Wheel cx={34} r={10} />
                    <Wheel cx={128} r={10} />
                </>
            )}

            {style === 'pickup' && (
                <>
                    <path d="M7 57c1-5 5-8 11-9l10-2 9-23c2-5 6-7 12-7h27c7 0 11 3 15 9l8 15h48c4 0 7 3 7 7v19H7z" fill={palette.body} />
                    <path d="M35 45l8-21c1-3 4-4 8-4h10v25zM66 20h8c5 0 8 2 11 7l9 18H66z" fill={palette.glass} />
                    <path d="M42 39l6-15c1-2 3-3 6-3M65 20v35M99 40v15M102 44h43" stroke={palette.glassHighlight} strokeWidth="2" strokeLinecap="round" />
                    <path d="M98 51h48M25 52h70M52 51h9M78 51h8" stroke={palette.shadow} strokeWidth="1.5" />
                    <path d="M14 56c17 0 25-3 34-8M102 43h41" stroke={palette.highlight} strokeWidth="2" strokeLinecap="round" />
                    <FinishDetails front={152} rear={10} />
                    <Wheel cx={34} r={9.5} />
                    <Wheel cx={126} r={9.5} />
                </>
            )}

            {style === 'minivan' && (
                <>
                    <path d="M8 57c1-5 5-8 11-9l9-2 10-27c2-5 6-8 13-8h40c8 0 13 3 18 10l18 24 18 4c5 1 8 5 8 11v6H8z" fill={palette.body} />
                    <path d="M35 45l9-24c1-4 4-5 9-5h13v29zM71 16h17c6 0 10 2 14 7l16 22H71z" fill={palette.glass} />
                    <path d="M43 39l7-18c1-2 3-3 6-3M70 16v39M94 19v26M119 45l7 12" stroke={palette.glassHighlight} strokeWidth="2" strokeLinecap="round" />
                    <path d="M31 52h96M57 51h9M83 51h9M72 56h30" stroke={palette.shadow} strokeWidth="1.5" />
                    <path d="M16 56c18 0 27-3 36-8" stroke={palette.highlight} strokeWidth="2" strokeLinecap="round" />
                    <FinishDetails front={150} rear={11} />
                    <Wheel cx={36} r={9.5} />
                    <Wheel cx={126} r={9.5} />
                </>
            )}

            {style === 'van' && (
                <>
                    <path d="M7 57c1-4 4-7 9-8l7-2V16c0-7 5-12 12-12h61c8 0 14 4 18 11l22 31 12 4c4 2 6 5 6 10v6H7z" fill={palette.body} />
                    <path d="M30 44V17c0-5 3-8 8-8h20v35zM64 9h29c6 0 10 3 13 8l18 27H64z" fill={palette.glass} />
                    <path d="M37 12h17M63 9v46M91 9v35M112 24l12 20" stroke={palette.glassHighlight} strokeWidth="2" strokeLinecap="round" />
                    <path d="M24 52h108M51 51h9M80 51h9M111 51h9" stroke={palette.shadow} strokeWidth="1.5" />
                    <path d="M14 56c16 0 24-3 32-8" stroke={palette.highlight} strokeWidth="2" strokeLinecap="round" />
                    <FinishDetails front={151} rear={10} />
                    <Wheel cx={36} r={10} />
                    <Wheel cx={127} r={10} />
                </>
            )}

            {style === 'other' && (
                <>
                    <path d="M10 58c1-6 6-9 13-10l14-2 13-19c3-5 8-7 14-7h28c7 0 12 3 17 8l17 18 16 4c5 1 8 5 8 10v6H10z" fill={palette.body} />
                    <path d="M43 45l13-18c2-3 5-4 9-4h10v22zM80 23h10c5 0 9 2 13 6l15 16H80z" fill={palette.glass} />
                    <path d="M51 39l9-12c1-2 4-3 7-3M79 23v33M120 46l6 11" stroke={palette.glassHighlight} strokeWidth="2" strokeLinecap="round" />
                    <path d="M29 52h96M57 51h9M94 51h9" stroke={palette.shadow} strokeWidth="1.5" />
                    <path d="M17 57c20 0 30-3 39-8" stroke={palette.highlight} strokeWidth="2" strokeLinecap="round" />
                    <circle cx="102" cy="34" r="8" fill="#111936" stroke={palette.highlight} strokeWidth="1.5" />
                    <path d="M99 31a3.3 3.3 0 016.4 1.2c0 2.5-3.2 2.7-3.2 4.8M102.2 40v.3" stroke={palette.lamp} strokeWidth="1.7" strokeLinecap="round" />
                    <FinishDetails front={147} />
                    <Wheel cx={38} />
                    <Wheel cx={124} />
                </>
            )}
        </svg>
    );
}
