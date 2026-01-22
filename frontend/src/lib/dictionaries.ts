import 'server-only';
import type { Locale } from '@/i18n-config';

// Type for dictionary structure
export interface Dictionary {
    common: {
        siteName: string;
        tagline: string;
        getStarted: string;
        learnMore: string;
        bookNow: string;
        contactUs: string;
    };
    home: {
        hero: {
            title: string;
            subtitle: string;
            cta: string;
        };
        services: {
            title: string;
            interior: string;
            exterior: string;
            full: string;
        };
    };
    booking: {
        enterZip: string;
        checkAvailability: string;
        selectService: string;
        selectDate: string;
        selectTime: string;
        checkout: string;
        confirmed: string;
    };
    zipChecker: {
        placeholder: string;
        button: string;
        checking: string;
        available: string;
        unavailable: string;
        error: string;
        continue: string;
        waitlist: {
            title: string;
            description: string;
            emailPlaceholder: string;
            submit: string;
        };
    };
    serviceSelection: {
        title: string;
        selectService: string;
        addOns: string;
        whatsIncluded: string;
        duration: string;
        minutes: string;
        continue: string;
        priceSummary: {
            title: string;
            baseService: string;
            addOns: string;
            subtotal: string;
            serviceFee: string;
            total: string;
            viewBreakdown: string;
            hideBreakdown: string;
        };
    };
}

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
    en: () => import('@/dictionaries/en.json').then((module) => module.default),
    es: () => import('@/dictionaries/es.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
    return dictionaries[locale]();
};
