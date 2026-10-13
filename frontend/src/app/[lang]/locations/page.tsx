import type { Metadata } from 'next';
import Link from 'next/link';
import { i18n, type Locale } from '@/i18n-config';
import { NEIGHBORHOODS } from '@/lib/seo/locations';
import { SERVICES } from '@/lib/seo/services';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbSchema } from '@/lib/seo/schema';

/**
 * /{lang}/locations — every area we serve, each linking to its city pages.
 * Built from NEIGHBORHOODS and SERVICES, so a new city or service shows up here automatically.
 */

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

const MAIN_SERVICE_ID = 'mobile-car-detailing';
// Express is the same visit as mobile detailing, so it is not repeated here.
const EXTRA_SERVICE_IDS = ['interior-detailing', 'exterior-detailing', 'ceramic-coating', 'headlight-restoration'];

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
        title: es ? 'Zonas de Servicio en Miami-Dade' : 'Service Areas in Miami-Dade',
        description: es
            ? `Detallado de autos a domicilio en ${NEIGHBORHOODS.length} zonas de Miami-Dade: Miami, Miami Beach, Hialeah, Doral, Kendall, Brickell y más. Elige tu zona.`
            : `Mobile car detailing in ${NEIGHBORHOODS.length} areas of Miami-Dade: Miami, Miami Beach, Hialeah, Doral, Kendall, Brickell and more. Find your area.`,
        alternates: {
            canonical: `/${locale}/locations`,
            languages: { en: '/en/locations', es: '/es/locations' },
        },
    };
}

export default async function LocationsPage({ params }: { params: Promise<{ lang: string }> }) {
    const locale = toLocale((await params).lang);
    const es = locale === 'es';

    const main = SERVICES.find((s) => s.id === MAIN_SERVICE_ID);
    const extras = EXTRA_SERVICE_IDS.map((id) => SERVICES.find((s) => s.id === id)).filter(
        (s): s is NonNullable<typeof s> => Boolean(s),
    );
    const waText = encodeURIComponent(
        es ? 'Hola, quiero confirmar si llegan a mi zona. Mi código postal es: ' : 'Hi, I want to confirm if you serve my area. My ZIP code is: ',
    );
    const cities = [...NEIGHBORHOODS].sort((a, b) => a.label[locale].localeCompare(b.label[locale]));

    const breadcrumb = getBreadcrumbSchema(
        [
            { name: es ? 'Inicio' : 'Home', path: '' },
            { name: es ? 'Zonas' : 'Locations', path: '/locations' },
        ],
        locale,
    );

    return (
        <div className="min-h-screen bg-[#131835] text-white">
            <JsonLd data={breadcrumb} />

            <div className="border-b border-white/5 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href={`/${locale}`} className="text-sm text-white/65 hover:text-white/90 transition-colors">
                        ← {es ? 'Volver al inicio' : 'Back to home'}
                    </Link>
                    <Link href={`/${locale}/booking/select`} className="text-sm text-[#D0B078] hover:underline">
                        {es ? 'Reservar' : 'Book now'} →
                    </Link>
                </div>
            </div>

            <main className="container mx-auto px-6 py-16 max-w-5xl">
                <h1 className="text-4xl font-bold mb-4">
                    {es ? 'Zonas donde trabajamos en Miami-Dade' : 'Areas We Serve in Miami-Dade'}
                </h1>
                <p className="text-white/75 leading-relaxed max-w-3xl mb-12">
                    {es
                        ? 'Llegamos a tu casa, oficina o al garaje de tu condominio y llevamos nuestra propia agua y equipo. Elige tu zona para ver los servicios y precios. El recubrimiento cerámico se aplica en nuestro taller de Doral.'
                        : 'We come to your home, office or condo garage and bring our own water and equipment. Pick your area to see services and prices. Ceramic coating is applied at our Doral facility.'}
                </p>

                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cities.map((city) => (
                        <li key={city.slug} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                            {main && (
                                <Link
                                    href={`/${locale}/${main.slug[locale]}/${city.slug}`}
                                    className="block text-lg font-semibold text-white hover:text-[#D0B078] transition-colors"
                                >
                                    {city.label[locale]}
                                </Link>
                            )}
                            <p className="mt-1 text-xs text-white/50">{city.landmarks.slice(0, 3).join(' · ')}</p>
                            <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                                {extras.map((service) => (
                                    <li key={service.id}>
                                        <Link
                                            href={`/${locale}/${service.slug[locale]}/${city.slug}`}
                                            className="text-white/70 hover:text-white underline-offset-2 hover:underline"
                                        >
                                            {service.name[locale]}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>

                <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6">
                    <p className="text-white/75 mb-4">
                        {es
                            ? '¿Tu zona no aparece? Mándanos tu código postal por WhatsApp y te confirmamos disponibilidad.'
                            : "Don't see your area? Send us your ZIP code on WhatsApp and we'll confirm availability."}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {WHATSAPP && (
                            <a
                                href={`https://wa.me/${WHATSAPP}?text=${waText}`}
                                className="rounded-full bg-[#D0B078] px-5 py-2.5 text-sm font-semibold text-[#131835] hover:opacity-90"
                            >
                                WhatsApp
                            </a>
                        )}
                        <Link
                            href={`/${locale}/booking/select`}
                            className={
                                WHATSAPP
                                    ? 'rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold hover:bg-white/5'
                                    : 'rounded-full bg-[#D0B078] px-5 py-2.5 text-sm font-semibold text-[#131835] hover:opacity-90'
                            }
                        >
                            {es ? 'Reservar en línea' : 'Book online'}
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
