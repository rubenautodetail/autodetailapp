import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '@/i18n-config';
import { redirect } from 'next/navigation';
import DateSelector from '@/components/DateSelector/DateSelector';

interface SchedulePageProps {
    params: Promise<{ lang: Locale }>;
    searchParams: Promise<{
        zip?: string;
        service?: string;
        addons?: string;
        price?: string;
        duration?: string;
    }>;
}

export default async function SchedulePage({ params, searchParams }: SchedulePageProps) {
    const { lang } = await params;
    const { zip, service, addons, price, duration } = await searchParams;

    // Validate required params
    if (!zip || !service) {
        redirect(`/${lang}`);
    }

    const dict = await getDictionary(lang);
    const addOnIds = addons ? addons.split(',').filter(Boolean) : [];
    const totalPrice = price ? parseFloat(price) : 0;
    const totalDuration = duration ? parseInt(duration) : 120;

    return (
        <main>
            <DateSelector
                zipCode={zip}
                serviceId={service}
                addOnIds={addOnIds}
                totalPrice={totalPrice}
                totalDuration={totalDuration}
                dict={dict}
                lang={lang}
            />
        </main>
    );
}
