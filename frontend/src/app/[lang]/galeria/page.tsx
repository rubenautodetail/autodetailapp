import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GalleryView, { galleryMetadata } from '@/components/gallery/GalleryView';

// Spanish address of the gallery (/es/galeria). The English one is /en/gallery.
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params;
    return lang === 'es' ? galleryMetadata('es') : {};
}

export default async function GaleriaPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    if (lang !== 'es') notFound();
    return <GalleryView locale="es" />;
}
