import type { Locale } from '@/i18n-config';

type Localized = Record<Locale, string>;

/** Mobile packages listed in the hero. Prices must match the booking prices in Supabase. */
export const CITY_PACKAGES: {
    key: string;
    price: number;
    recommended: boolean;
    name: Localized;
    desc: Localized;
}[] = [
    {
        key: 'express',
        price: 70,
        recommended: false,
        name: { en: 'Express Detail', es: 'Detallado Express' },
        desc: {
            en: 'Hand wash, wheels, quick interior vacuum & wipe-down',
            es: 'Lavado a mano, rines, aspirado y limpieza rápida del interior',
        },
    },
    {
        key: 'interior-exterior',
        price: 200,
        recommended: false,
        name: { en: 'Interior or Exterior', es: 'Interior o Exterior' },
        desc: {
            en: 'Deep interior (steam, stains, pet hair) or full exterior + protection',
            es: 'Interior profundo (vapor, manchas, pelo de mascota) o exterior completo + protección',
        },
    },
    {
        key: 'full',
        price: 400,
        recommended: true,
        name: { en: 'Full Detail', es: 'Detallado Completo' },
        desc: {
            en: 'Complete inside & out — the reset for your car',
            es: 'Completo por dentro y por fuera — tu auto como nuevo',
        },
    },
];

/** Only this service shows the 3 packages. Other services show just their own price. */
export const PACKAGE_SERVICE_IDS = ['mobile-car-detailing'];
