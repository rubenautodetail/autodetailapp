import { i18n } from '@/i18n-config';
import { getDictionary } from '@/lib/dictionaries';
import '../globals.css';
import type { Metadata } from 'next';
import MobileBottomNav from '@/components/ui/MobileBottomNav';
import DevRoleSwitcher from '@/components/dev/DevRoleSwitcher';

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
        <>
            {/* Pad bottom on mobile so content doesn't hide behind the nav */}
            <div className="pb-20 md:pb-0">
                {children}
            </div>
            <MobileBottomNav lang={lang} />
            {process.env.NODE_ENV !== 'production' && <DevRoleSwitcher />}
        </>
    );
}
