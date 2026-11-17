/**
 * One-line summaries (and the "popular" flag) for the booking step.
 *
 * The database stores each service as a list of bullet points, so there is no
 * short description to show on a closed card. These summaries fill that gap.
 * Entries are matched by name, ignoring case and accents, and each entry lists
 * the English name plus the current and planned Spanish names, so a service
 * rename in the admin panel does not break the match.
 *
 * To change a sentence or move the "Most popular" badge, edit this file.
 */

type Locale = 'en' | 'es';

interface SummaryEntry {
    /** Names this entry matches (any language, any spelling). */
    names: string[];
    summary: { en: string; es: string };
    popular?: boolean;
}

const SERVICES: SummaryEntry[] = [
    {
        names: ['Express Detail', 'Detallado Express', 'Lavado Express'],
        summary: {
            en: 'A quick inside-and-out refresh: vacuum, wipe-down and hand wash.',
            es: 'Un repaso rápido por dentro y por fuera: aspirado, limpieza de superficies y lavado a mano.',
        },
        popular: true,
    },
    {
        names: ['Interior Detail', 'Detallado Interior', 'Limpieza Interior de Autos'],
        summary: {
            en: 'Deep clean of the whole cabin: seats, carpets, dashboard, vents and leather care.',
            es: 'Limpieza profunda de toda la cabina: asientos, alfombras, tablero, salidas de aire y cuidado del cuero.',
        },
    },
    {
        names: ['Exterior Detail', 'Detallado Exterior', 'Lavado Exterior y Encerado', 'Exterior Hand Wash & Wax'],
        summary: {
            en: 'More than a car wash: foam pre-wash, hand wash, wheels, door jambs and a wax finish.',
            es: 'Más que un lavado: espuma, lavado a mano, rines, marcos de puertas y cera para el brillo.',
        },
    },
    {
        names: ['Full Detail', 'Detallado Completo', 'Lavado Completo'],
        summary: {
            en: 'Interior and exterior in one visit, for a car that needs everything.',
            es: 'Interior y exterior en una sola visita, para un auto que necesita todo.',
        },
    },
    {
        names: ['1-Step Car Polish', 'Pulido de Carros de 1 Paso', 'Pulido de 1 Paso'],
        summary: {
            en: 'Wash, paint decontamination and one-step machine polish for more gloss and clarity.',
            es: 'Lavado, descontaminación de la pintura y pulido de un paso para más brillo y claridad.',
        },
    },
    {
        names: ['Headlight Restoration', 'Restauración de Faros', 'Pulido de Faros'],
        summary: {
            en: 'Removes yellowing and haze from headlights and seals them with UV protection.',
            es: 'Quita el amarillento y la opacidad de los faros y los sella con protección UV.',
        },
        // Popular as an add-on. Shown on the add-on row only (see isPopularAddOn).
    },
    {
        names: ['Car Interior Shampoo', 'Lavado de Asientos y Alfombras'],
        summary: {
            en: 'Machine extraction and steam for stained fabric seats, carpets, headliner and trunk.',
            es: 'Extracción con máquina y vapor para asientos de tela, alfombras, techo y cajuela con manchas.',
        },
    },
];

const ADD_ONS: SummaryEntry[] = [
    {
        names: ['Engine Cleaning', 'Limpieza de Motor', 'Limpieza del Motor'],
        summary: {
            en: 'We degrease and clean the engine bay and renew plastics and rubber.',
            es: 'Quitamos grasa y suciedad del motor y renovamos plásticos y gomas.',
        },
    },
    {
        names: ['Headlight Restoration', 'Restauración de Faros', 'Pulido de Faros'],
        summary: {
            en: 'Removes yellowing and haze from headlights and seals them with UV protection.',
            es: 'Quita el amarillento y la opacidad de los faros y los sella con protección UV.',
        },
        popular: true,
    },
    {
        names: ['Odor Elimination', 'Eliminación de Olores', 'Eliminación de Olor'],
        summary: {
            en: 'Neutralizes unwanted odors for a fresher cabin.',
            es: 'Neutraliza los malos olores para una cabina más fresca.',
        },
    },
];

const normalize = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');

const find = (list: SummaryEntry[], name: string): SummaryEntry | undefined => {
    const key = normalize(name);
    if (!key) return undefined;
    return list.find((entry) => entry.names.some((candidate) => normalize(candidate) === key));
};

export function getServiceSummary(name: string, locale: Locale): string | undefined {
    return find(SERVICES, name)?.summary[locale];
}

export function isPopularService(name: string): boolean {
    return find(SERVICES, name)?.popular === true;
}

export function getAddOnSummary(name: string, locale: Locale): string | undefined {
    return find(ADD_ONS, name)?.summary[locale];
}

export function isPopularAddOn(name: string): boolean {
    return find(ADD_ONS, name)?.popular === true;
}
