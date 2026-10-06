import { MetadataRoute } from 'next';
import { getAllLandingParams } from '@/lib/seo/landing';
import { createServiceClient } from '@/lib/supabase/server';
import { servicePath } from '@/lib/seo/serviceNames';
import { galleryPath } from '@/lib/gallery';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dtailwash.com';
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

// Re-read the services table every hour so new or renamed services reach the sitemap.
export const revalidate = 3600;

/** General service pages (/{lang}/services/{slug}), one per active service and language. */
async function getServicePages(): Promise<MetadataRoute.Sitemap> {
    try {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('services')
            .select('name, name_es')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .limit(6);
        if (error) {
            console.error('[sitemap] services query error:', error.message);
            return [];
        }
        const rows = (data ?? []) as unknown as { name: string; name_es: string | null }[];
        return rows.flatMap((s) =>
            LOCALES.map((locale) => ({
                url: `${APP_URL}${servicePath(s, locale)}`,
                lastModified: new Date(),
                changeFrequency: 'monthly' as ChangeFreq,
                priority: 0.8,
            })),
        );
    } catch (e) {
        console.error('[sitemap] services fetch failed:', e);
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const servicePages = await getServicePages();
    return [
        // Home
        ...urls('', 'weekly', 1.0),
        // Booking flow
        ...urls('/booking/select', 'weekly', 0.9),
        // Gallery of real jobs
        ...LOCALES.map((locale) => ({
            url: `${APP_URL}${galleryPath(locale)}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as ChangeFreq,
            priority: 0.6,
        })),
        // Contractor landing
        ...urls('/contractors', 'monthly', 0.8),
        // Auth
        ...urls('/login', 'monthly', 0.5),
        ...urls('/register', 'monthly', 0.5),
        // Legal
        ...urls('/privacy', 'yearly', 0.3),
        ...urls('/terms', 'yearly', 0.3),
        // General service pages (educational)
        ...servicePages,
        // Programmatic [service]/[city] landing pages
        ...getAllLandingParams().map((p) => ({
            url: `${APP_URL}/${p.lang}/${p.service}/${p.city}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as ChangeFreq,
            priority: 0.7,
        })),
    ];
}
