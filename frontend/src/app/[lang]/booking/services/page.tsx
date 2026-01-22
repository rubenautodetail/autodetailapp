import { getDictionary } from '@/lib/dictionaries';
import { i18n } from '@/i18n-config';
import { strapiClient } from '@/lib/api';
import { redirect } from 'next/navigation';
import ServiceSelector from '@/components/ServiceSelector/ServiceSelector';

export default async function ServicesPage({
    params,
    searchParams,
}: {
    params: Promise<{ lang: string }>;
    searchParams: Promise<{ zip?: string }>;
}) {
    const { lang } = await params;
    const { zip } = await searchParams;
    const validLang = i18n.locales.includes(lang as 'en' | 'es') ? (lang as 'en' | 'es') : 'en';
    const dict = await getDictionary(validLang);

    // Redirect if no ZIP code provided
    if (!zip) {
        redirect(`/${lang}`);
    }

    // Validate ZIP and get services
    let validationResult;
    try {
        validationResult = await strapiClient.validateZip(zip);

        if (!validationResult.available) {
            redirect(`/${lang}`);
        }
    } catch (error) {
        console.error('Error validating ZIP:', error);
        redirect(`/${lang}`);
    }

    return (
        <main style={{ minHeight: '100vh', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    {dict.serviceSelection.title}
                </h1>
                <ServiceSelector
                    services={validationResult.services || []}
                    addOns={validationResult.addOns || []}
                    zipCode={zip}
                    dict={dict.serviceSelection}
                    lang={lang}
                />
            </div>
        </main>
    );
}
