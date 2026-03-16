import { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rubensautodetail.com';
const LOCALES = ['en', 'es'] as const;

type ChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

function urls(path: string, changeFrequency: ChangeFreq, priority: number): MetadataRoute.Sitemap {
    return LOCALES.map((locale) => ({
        url: `${APP_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
    }));
}

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        // Home
        ...urls('', 'weekly', 1.0),
        // Booking flow
        ...urls('/booking/select', 'weekly', 0.9),
        // Contractor landing
        ...urls('/contractors', 'monthly', 0.8),
        // Auth
        ...urls('/login', 'monthly', 0.5),
        ...urls('/register', 'monthly', 0.5),
    ];
}
