import { i18n } from '@/i18n-config';
import { getDictionary } from '@/lib/dictionaries';
import '../globals.css';
import type { Metadata } from 'next';

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params;
    const validLang = i18n.locales.includes(lang as 'en' | 'es') ? (lang as 'en' | 'es') : 'en';
    const dict = await getDictionary(validLang);

    return {
        title: {
            default: dict.common.siteName,
            template: `%s | ${dict.common.siteName}`,
        },
        description: dict.common.tagline,
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

    return (
        <html lang={lang} suppressHydrationWarning data-scroll-behavior="smooth">
            <body>
                {children}
            </body>
        </html>
    );
}
