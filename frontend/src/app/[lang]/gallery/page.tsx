import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import GalleryView, { galleryMetadata, toLocale } from '@/components/gallery/GalleryView';
import { galleryPath } from '@/lib/gallery';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params;
    return galleryMetadata(toLocale(lang));
}

export default async function GalleryPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const locale = toLocale(lang);
    // The Spanish gallery lives at /es/galeria; anyone arriving at the old
    // /es/gallery address is sent there permanently.
    if (locale === 'es') permanentRedirect(galleryPath('es'));
    return <GalleryView locale={locale} />;
}
