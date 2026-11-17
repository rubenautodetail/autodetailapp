import { Inter, Playfair_Display } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';
import ContactClickTracker from '@/components/analytics/ContactClickTracker';
import AttributionCapture from '@/components/analytics/AttributionCapture';
import { Providers } from '../providers';
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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION;
const BING_VERIFICATION = process.env.NEXT_PUBLIC_BING_VERIFICATION;
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

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

    const homeTitle = validLang === 'es' ? 'Lavado de Carros a Domicilio y Car Wash Móvil en Miami-Dade' : 'Mobile Car Detailing & Car Wash in Miami | We Come to You';

    return {
        title: {
            default: homeTitle,
            template: `%s | ${siteName}`,
        },
        description,
        metadataBase: new URL(APP_URL),
        // canonical/hreflang are set by each page (here they would be inherited by every page)
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
      <html lang={validLang} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
       
        {GSC_VERIFICATION && (
          <meta name="google-site-verification" content={GSC_VERIFICATION} />
        )}
        {BING_VERIFICATION && (
          <meta name="msvalidate.01" content={BING_VERIFICATION} />
        )}
        <meta name="p:domain_verify" content="1a4e30075f1f40a53a175fccf1361202" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <Providers>
        <VehicleBodyStyleImagesProvider images={vehicleBodyStyleImages}>
            <JsonLd data={[getOrganizationSchema(siteName), getWebsiteSchema(siteName)]} />
            {/* Pad bottom on mobile so content doesn't hide behind the nav */}
            <div className="pb-20 md:pb-0">
                {children}
            </div>
            <MobileBottomNav lang={lang} />
            {process.env.NODE_ENV !== 'production' && <DevRoleSwitcher />}
        </VehicleBodyStyleImagesProvider>
          </Providers>
        {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
        {GA_MEASUREMENT_ID && <ContactClickTracker />}
        <AttributionCapture />
        {CLARITY_PROJECT_ID && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`}
          </Script>
        )}
      </body>
    </html>
    );
}
