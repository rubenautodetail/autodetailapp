import type { Locale } from '@/i18n-config';
import { SERVICES, t } from '@/lib/seo/services';

/**
 * Photos of real jobs, grouped by service. Files live in /public/images/services
 * as {prefix}-01.jpg … {prefix}-NN.jpg. Add a photo by dropping the file in that
 * folder and raising `count`; add a service by adding a row (the id must match an
 * entry in lib/seo/services.ts so its name stays in sync with the rest of the site).
 */
const PHOTO_SETS = [
    { id: 'mobile-car-detailing', prefix: 'mobile-car-detailing', count: 6 },
    { id: 'ceramic-coating', prefix: 'ceramic-coating', count: 12 },
    { id: 'express-detail', prefix: 'express-detail', count: 6 },
    { id: 'headlight-restoration', prefix: 'headlight-restoration', count: 6 },
    { id: 'exterior-detailing', prefix: 'exterior-detailing', count: 5 },
] as const;

/** The gallery's address in each language (Spanish uses a Spanish word, like the rest of the site). */
export function galleryPath(locale: Locale): string {
    return locale === 'es' ? '/es/galeria' : '/en/gallery';
}

export interface GalleryPhoto {
    src: string;
    category: string;
    alt: string;
}

export interface GalleryCategory {
    id: string;
    label: string;
    count: number;
}

export function getGallery(locale: Locale): { photos: GalleryPhoto[]; categories: GalleryCategory[] } {
    const es = locale === 'es';

    const sets = PHOTO_SETS.map((set) => {
        const service = SERVICES.find((s) => s.id === set.id);
        const label = service ? t(service.name, locale) : set.id;
        const photos: GalleryPhoto[] = Array.from({ length: set.count }, (_, i) => {
            const n = String(i + 1).padStart(2, '0');
            return {
                src: `/images/services/${set.prefix}-${n}.jpg`,
                category: set.id,
                alt: es
                    ? `${label} en Miami – Lux Auto Detail Services (foto ${i + 1})`
                    : `${label} in Miami – Lux Auto Detail Services (photo ${i + 1})`,
            };
        });
        return { id: set.id, label, photos };
    });

    // "All" mixes the services (one from each in turn) so the first photos shown
    // are not all the same service.
    const longest = Math.max(...sets.map((s) => s.photos.length));
    const photos: GalleryPhoto[] = [];
    for (let i = 0; i < longest; i++) {
        for (const set of sets) {
            if (set.photos[i]) photos.push(set.photos[i]);
        }
    }

    const categories: GalleryCategory[] = sets.map((s) => ({ id: s.id, label: s.label, count: s.photos.length }));
    return { photos, categories };
}
