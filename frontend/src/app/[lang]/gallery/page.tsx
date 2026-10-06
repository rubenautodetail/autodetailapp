import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { i18n, type Locale } from '@/i18n-config';
import JsonLd from '@/components/seo/JsonLd';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import { getGallery } from '@/lib/gallery';
import { getBreadcrumbSchema } from '@/lib/seo/schema';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dtailwash.com';
const SITE_NAME = 'Lux Auto Detail Services';
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131835]';

const COPY = {
    en: {
        title: 'Our Work: Mobile Detailing Photos in Miami | Lux Auto Detail',
        description:
            'See real results from our mobile detailing jobs across Miami-Dade, including ceramic coating, express and exterior details, and headlight restoration.',
        eyebrow: 'Our work',
        h1: 'Real cars. Real results.',
        sub: 'Every photo is from a job we did across Miami-Dade.',
        book: 'Book now',
        bookLong: 'Reserve your detail',
        ctaTitle: 'Want this for your car?',
        ctaText: 'You inspect the work first, then authorize the payment.',
        waText: "Hi, I'd like to book a detail.",
        galleryName: 'Our work',
        home: 'Home',
        terms: 'Terms',
        privacy: 'Privacy',
    },
    es: {
        title: 'Nuestro Trabajo: Fotos de Detallado en Miami | Lux Auto Detail',
        description:
            'Mira resultados reales de nuestros trabajos de detallado a domicilio en Miami-Dade: recubrimiento cerámico, detallados express y exteriores, y restauración de faros.',
        eyebrow: 'Nuestro trabajo',
        h1: 'Autos reales. Resultados reales.',
        sub: 'Cada foto es de un trabajo que hicimos en Miami-Dade.',
        book: 'Reservar',
        bookLong: 'Reserva tu detallado',
        ctaTitle: '¿Quieres esto para tu auto?',
        ctaText: 'Primero revisas el trabajo y después autorizas el pago.',
        waText: 'Hola, quiero reservar un detallado.',
        galleryName: 'Nuestro trabajo',
        home: 'Inicio',
        terms: 'Términos',
        privacy: 'Privacidad',
    },
} as const;

function toLocale(lang: string): Locale {
    return i18n.locales.includes(lang as Locale) ? (lang as Locale) : 'en';
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params;
    const locale = toLocale(lang);
    const copy = COPY[locale];

    return {
        title: { absolute: copy.title },
        description: copy.description,
        alternates: {
            canonical: `/${locale}/gallery`,
            languages: { en: '/en/gallery', es: '/es/gallery' },
        },
        openGraph: {
            type: 'website',
            siteName: SITE_NAME,
            title: copy.title,
            description: copy.description,
            url: `/${locale}/gallery`,
            locale: locale === 'es' ? 'es_ES' : 'en_US',
        },
    };
}

export default async function GalleryPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const locale = toLocale(lang);
    const copy = COPY[locale];
    const otherLocale = locale === 'es' ? 'en' : 'es';

    const { photos, categories } = getGallery(locale);

    const bookHref = `/${locale}/booking/select`;
    const waHref = WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(copy.waText)}` : null;

    const gallerySchema = {
        '@context': 'https://schema.org',
        '@type': 'ImageGallery',
        name: copy.galleryName,
        description: copy.description,
        url: `${APP_URL}/${locale}/gallery`,
        inLanguage: locale,
        image: photos.map((p) => ({
            '@type': 'ImageObject',
            contentUrl: `${APP_URL}${p.src}`,
            name: p.alt,
            caption: p.alt,
        })),
    };

    return (
        <div className="min-h-screen bg-[#131835] text-white">
            <JsonLd
                data={[
                    gallerySchema,
                    getBreadcrumbSchema(
                        [
                            { name: copy.home, path: '' },
                            { name: copy.galleryName, path: '/gallery' },
                        ],
                        locale
                    ),
                ]}
            />

            <header className="sticky top-0 z-30 border-b border-white/5 bg-[#131835]/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link href={`/${locale}`} aria-label={copy.home} className={`flex items-center gap-2 rounded ${focusRing}`}>
                        <Image
                            src="/dtailwash_logo_final.png"
                            alt={SITE_NAME}
                            width={1942}
                            height={809}
                            className="h-8 w-auto"
                            style={{ width: 'auto' }}
                            priority
                        />
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/${otherLocale}/gallery`}
                            className="text-xs uppercase tracking-widest text-white/50 transition-colors hover:text-white"
                        >
                            {otherLocale}
                        </Link>
                        {waHref && (
                            <a
                                href={waHref}
                                className="hidden rounded-full bg-[#25D366] px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03] sm:inline-block"
                            >
                                WhatsApp
                            </a>
                        )}
                        <Link
                            href={bookHref}
                            className="rounded-full bg-[#D0B078] px-5 py-2 text-sm font-semibold text-[#131835] shadow-[0_0_24px_rgba(208,176,120,0.25)] transition-transform hover:scale-[1.03]"
                        >
                            {copy.book}
                        </Link>
                    </div>
                </div>
            </header>

            <main>
                <section className="relative overflow-hidden px-6 pb-8 pt-14 sm:pt-20">
                    <div className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_90%_at_50%_-10%,rgba(208,176,120,0.14),transparent_60%)]" />
                    <div className="relative mx-auto max-w-3xl text-center">
                        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-[#D0B078]">{copy.eyebrow}</p>
                        <h1
                            className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            {copy.h1}
                        </h1>
                        <p className="mx-auto mt-4 max-w-xl text-lg font-light leading-relaxed text-white/75">{copy.sub}</p>
                        <div className="mt-7 flex flex-wrap justify-center gap-3">
                            <Link
                                href={bookHref}
                                className={`rounded-full bg-[#D0B078] px-6 py-3 text-sm font-semibold text-[#131835] shadow-[0_0_24px_rgba(208,176,120,0.25)] transition-transform hover:scale-[1.03] ${focusRing}`}
                            >
                                {copy.book}
                            </Link>
                            {waHref && (
                                <a
                                    href={waHref}
                                    className={`rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.03] ${focusRing}`}
                                >
                                    WhatsApp
                                </a>
                            )}
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-5xl px-6 pb-14 pt-4">
                    <GalleryGrid photos={photos} categories={categories} locale={locale} />
                </section>

                <section className="mx-auto max-w-5xl px-6 pb-16">
                    <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-[#2C355E] bg-[#151B3A] p-8 sm:flex-row sm:items-center sm:p-10">
                        <div>
                            <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                                {copy.ctaTitle}
                            </h2>
                            <p className="mt-2 max-w-xl text-white/70">{copy.ctaText}</p>
                        </div>
                        <Link
                            href={bookHref}
                            className={`whitespace-nowrap rounded-full bg-[#D0B078] px-7 py-3 text-sm font-semibold text-[#131835] transition-colors hover:bg-[#dcc08d] ${focusRing}`}
                        >
                            {copy.bookLong}
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="border-t border-white/5 px-6 py-8 text-xs text-white/55">
                <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
                    <p>
                        © {new Date().getFullYear()} {SITE_NAME}
                    </p>
                    <div className="flex gap-6">
                        <Link href={`/${locale}`} className={`hover:text-white ${focusRing}`}>
                            {copy.home}
                        </Link>
                        <Link href={`/${locale}/terms`} className={`hover:text-white ${focusRing}`}>
                            {copy.terms}
                        </Link>
                        <Link href={`/${locale}/privacy`} className={`hover:text-white ${focusRing}`}>
                            {copy.privacy}
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
