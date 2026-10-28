import Link from 'next/link';

interface LanguageSwitchProps {
    /** language the page is shown in now */
    locale: 'en' | 'es';
    /** the same page in the other language (not always the home page) */
    href: string;
}

/** Small "ES" / "EN" pill: shows the language you can switch TO. */
export default function LanguageSwitch({ locale, href }: LanguageSwitchProps) {
    const toEs = locale === 'en';
    return (
        <Link
            href={href}
            hrefLang={toEs ? 'es' : 'en'}
            lang={toEs ? 'es' : 'en'}
            aria-label={toEs ? 'Ver esta página en español' : 'View this page in English'}
            className="flex h-9 items-center rounded-full border border-white/30 bg-black/20 px-3 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur-sm transition-colors hover:border-[#D0B078] hover:text-[#D0B078]"
        >
            {toEs ? 'ES' : 'EN'}
        </Link>
    );
}
