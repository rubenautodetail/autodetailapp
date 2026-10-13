import type { Metadata } from 'next';
import Link from 'next/link';
import { i18n, type Locale } from '@/i18n-config';
import { galleryPath } from '@/lib/gallery';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbSchema } from '@/lib/seo/schema';

/** /{lang}/about — who we are and how we work. No street address (service-area business). */

const PHONE = (process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+13059884449').trim();
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

function toLocale(lang: string): Locale {
    return (i18n.locales as readonly string[]).includes(lang) ? (lang as Locale) : i18n.defaultLocale;
}

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const locale = toLocale((await params).lang);
    const es = locale === 'es';
    return {
        title: es ? 'Quiénes Somos' : 'About Us',
        description: es
            ? 'Lux Auto Detail Services: detallado de autos a domicilio en Miami-Dade. Llevamos agua y equipo, y pagas solo después de aprobar el trabajo.'
            : 'Lux Auto Detail Services: mobile car detailing in Miami-Dade. We bring our own water and equipment, and you pay only after you approve the work.',
        alternates: {
            canonical: `/${locale}/about`,
            languages: { en: '/en/about', es: '/es/about' },
        },
    };
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
    const locale = toLocale((await params).lang);
    const es = locale === 'es';

    const points = es
        ? [
              'Llevamos nuestra propia agua y equipo: tú solo nos das acceso al auto.',
              'Revisas el trabajo antes de pagar. El pago se autoriza solo cuando lo apruebas.',
              'Te atendemos en español y en inglés.',
              'El recubrimiento cerámico se aplica en un ambiente controlado en nuestro taller de Doral.',
          ]
        : [
              'We bring our own water and equipment — you just give us access to the car.',
              'You check the work before you pay. The payment is authorized only after you approve it.',
              'We speak English and Spanish.',
              'Ceramic coating is applied in a controlled environment at our Doral facility.',
          ];

    const waText = encodeURIComponent(es ? 'Hola, tengo una pregunta.' : 'Hi, I have a question.');

    const breadcrumb = getBreadcrumbSchema(
        [
            { name: es ? 'Inicio' : 'Home', path: '' },
            { name: es ? 'Quiénes somos' : 'About', path: '/about' },
        ],
        locale,
    );

    return (
        <div className="min-h-screen bg-[#131835] text-white">
            <JsonLd data={breadcrumb} />

            <div className="border-b border-white/5 px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link href={`/${locale}`} className="text-sm text-white/65 hover:text-white/90 transition-colors">
                        ← {es ? 'Volver al inicio' : 'Back to home'}
                    </Link>
                    <Link href={`/${locale}/booking/select`} className="text-sm text-[#D0B078] hover:underline">
                        {es ? 'Reservar' : 'Book now'} →
                    </Link>
                </div>
            </div>

            <main className="container mx-auto px-6 py-16 max-w-3xl">
                <h1 className="text-4xl font-bold mb-6">
                    {es ? 'Quiénes somos' : 'About Lux Auto Detail Services'}
                </h1>

                <p className="text-white/75 leading-relaxed mb-10">
                    {es
                        ? 'Lux Auto Detail Services es una empresa de detallado de autos a domicilio en Miami-Dade. Vamos a tu casa, tu oficina o el garaje de tu condominio, para que no tengas que manejar ni esperar en un car wash.'
                        : 'Lux Auto Detail Services is a mobile car detailing company in Miami-Dade. We come to your home, office or condo garage, so you never have to drive anywhere or wait at a car wash.'}
                </p>

                <h2 className="text-lg font-semibold text-[#D0B078] mb-4">{es ? 'Cómo trabajamos' : 'How we work'}</h2>
                <ul className="space-y-3 mb-10">
                    {points.map((point) => (
                        <li key={point} className="flex gap-3 text-white/75 leading-relaxed">
                            <span className="text-[#D0B078]">✓</span>
                            <span>{point}</span>
                        </li>
                    ))}
                </ul>

                <h2 className="text-lg font-semibold text-[#D0B078] mb-4">{es ? 'Dónde trabajamos' : 'Where we work'}</h2>
                <p className="text-white/75 leading-relaxed mb-10">
                    {es
                        ? 'Miami, Miami Beach, Brickell, Hialeah, Doral, Kendall, Coral Gables y más zonas de Miami-Dade. '
                        : 'Miami, Miami Beach, Brickell, Hialeah, Doral, Kendall, Coral Gables and more areas of Miami-Dade. '}
                    <Link href={`/${locale}/locations`} className="text-[#D0B078] hover:underline">
                        {es ? 'Ver todas las zonas' : 'See all areas'}
                    </Link>
                    {' · '}
                    <Link href={galleryPath(locale)} className="text-[#D0B078] hover:underline">
                        {es ? 'Ver nuestros trabajos' : 'See our work'}
                    </Link>
                </p>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-wrap gap-3">
                    <Link
                        href={`/${locale}/booking/select`}
                        className="rounded-full bg-[#D0B078] px-5 py-2.5 text-sm font-semibold text-[#131835] hover:opacity-90"
                    >
                        {es ? 'Reservar en línea' : 'Book online'}
                    </Link>
                    <a href={`tel:${PHONE}`} className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold hover:bg-white/5">
                        {es ? 'Llamar' : 'Call us'}
                    </a>
                    {WHATSAPP && (
                        <a
                            href={`https://wa.me/${WHATSAPP}?text=${waText}`}
                            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold hover:bg-white/5"
                        >
                            WhatsApp
                        </a>
                    )}
                </div>
            </main>
        </div>
    );
}
