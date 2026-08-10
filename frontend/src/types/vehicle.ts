export const BODY_STYLES = [
    'sedan',
    'coupe',
    'suv',
    'large_suv',
    'pickup',
    'minivan',
    'van',
    'other',
] as const;

export type VehicleBodyStyle = (typeof BODY_STYLES)[number];
export type VehicleLocale = 'en' | 'es';

const BODY_STYLE_LABELS: Record<VehicleBodyStyle, Record<VehicleLocale, string>> = {
    sedan: { en: 'Sedan', es: 'Sedán' },
    coupe: { en: 'Coupe', es: 'Coupé' },
    suv: { en: 'SUV', es: 'SUV' },
    large_suv: { en: 'Large SUV', es: 'SUV grande' },
    pickup: { en: 'Pickup', es: 'Camioneta pickup' },
    minivan: { en: 'Minivan', es: 'Miniván' },
    van: { en: 'Van', es: 'Furgoneta' },
    other: { en: 'Other', es: 'Otro' },
};

export const VEHICLE_BODY_STYLE_DESCRIPTIONS: Record<
    VehicleBodyStyle,
    Record<VehicleLocale, string>
> = {
    sedan: {
        en: 'Four doors with a separate trunk.',
        es: 'Cuatro puertas y baúl separado.',
    },
    coupe: {
        en: 'Two doors with a fixed roof.',
        es: 'Dos puertas y techo fijo.',
    },
    suv: {
        en: 'Compact or midsize SUV with two or three rows.',
        es: 'SUV compacta o mediana de dos o tres filas.',
    },
    large_suv: {
        en: 'Full-size SUV with a taller, longer body.',
        es: 'SUV de tamaño completo, más alta y larga.',
    },
    pickup: {
        en: 'Passenger cab with an open cargo bed.',
        es: 'Cabina de pasajeros con caja de carga abierta.',
    },
    minivan: {
        en: 'Passenger van with sliding side doors.',
        es: 'Vehículo de pasajeros con puertas laterales corredizas.',
    },
    van: {
        en: 'Full-size passenger or cargo van.',
        es: 'Furgoneta grande de pasajeros o carga.',
    },
    other: {
        en: 'Choose this when none of the styles match.',
        es: 'Elige esta opción si ningún estilo coincide.',
    },
};

export function getVehicleBodyStyleLabel(
    style: VehicleBodyStyle,
    locale: VehicleLocale = 'en',
): string {
    return BODY_STYLE_LABELS[style][locale];
}

export function isVehicleBodyStyle(value: unknown): value is VehicleBodyStyle {
    return typeof value === 'string' && BODY_STYLES.some((style) => style === value);
}

/** Normalizes persisted legacy values at the application boundary. */
export function normalizeVehicleBodyStyle(value: unknown): VehicleBodyStyle {
    if (value === 'truck') return 'pickup';
    return isVehicleBodyStyle(value) ? value : 'other';
}
