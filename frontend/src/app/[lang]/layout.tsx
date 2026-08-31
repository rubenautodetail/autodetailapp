import { i18n } from '@/i18n-config';
import { getDictionary } from '@/lib/dictionaries';
import '../globals.css';
import type { Metadata } from 'next';
import MobileBottomNav from '@/components/ui/MobileBottomNav';
import DevRoleSwitcher from '@/components/dev/DevRoleSwitcher';
import JsonLd from '@/components/seo/JsonLd';
import { getOrganizationSchema, getWebsiteSchema } from '@/lib/seo/schema';
import { getVehicleBodyStyleImages } from '@/lib/hygraph';
import { VehicleBodyStyleImagesProvider } from '@/contexts/VehicleBodyStyleImagesContext';

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dtailwash.com';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params;
    const validLang = i18n.locales.includes(lang as 'en' | 'es') ? (lang as 'en' | 'es') : 'en';
    const dict = await getDictionary(validLang);
    const siteName = dict.common.siteName;
    const description = dict.common.tagline;

    const homeTitle = validLang === 'es' ? 'Detallado a Domicilio Miami-Dade | Detailing on Demand' : 'Mobile Car Detailing in Miami-Dade | Detailing on Demand';

    return {
        title: {
            default: homeTitle,
            template: `%s | ${siteName}`,
        },
        description,
        metadataBase: new URL(APP_URL),
        alternates: {
            canonical: `/${validLang}`,
            languages: { en: '/en', es: '/es' },
        },
        openGraph: {
            type: 'website',
            siteName,
            title: siteName,
            description,
            locale: validLang === 'es' ? 'es_ES' : 'en_US',
            alternateLocale: validLang === 'es' ? 'en_US' : 'es_ES',
            url: `${APP_URL}/${validLang}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: siteName,
            description,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: { index: true, follow: true },
        },
    };
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const validLang = i18n.locales.includes(lang as 'en' | 'es') ? (lang as 'en' | 'es') : 'en';
    const [dict, vehicleBodyStyleImages] = await Promise.all([
        getDictionary(validLang),
        getVehicleBodyStyleImages(validLang),
    ]);
    const siteName = dict.common.siteName;

    return (
        <VehicleBodyStyleImagesProvider images={vehicleBodyStyleImages}>
            <JsonLd data={[getOrganizationSchema(siteName), getWebsiteSchema(siteName)]} />
            {/* Pad bottom on mobile so content doesn't hide behind the nav */}
            <div className="pb-20 md:pb-0">
                {children}
            </div>
            <MobileBottomNav lang={lang} />
            {process.env.NODE_ENV !== 'production' && <DevRoleSwitcher />}
        </VehicleBodyStyleImagesProvider>
    );
}
