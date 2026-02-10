import { getServiceBySlug, getAddOns } from '@/lib/api/bookings';
import { notFound } from 'next/navigation';
import BookingForm from '@/components/booking/BookingForm';
import styles from './booking.module.css';

export default async function BookingPage({
    params,
    searchParams,
}: {
    params: { lang: string };
    searchParams: { service?: string; zip?: string };
}) {
    const serviceId = searchParams.service;
    const zipCode = searchParams.zip;

    if (!serviceId) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h1>No Service Selected</h1>
                    <p>Please select a service from the services page.</p>
                    <a href={`/${params.lang}/services`} className={styles.backButton}>
                        ← Back to Services
                    </a>
                </div>
            </div>
        );
    }

    // Fetch service and add-ons
    const [services, addOns] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/services/${serviceId}?populate=*`, {
            cache: 'no-store',
        }).then(res => res.json()),
        getAddOns(params.lang),
    ]);

    if (!services.data) {
        notFound();
    }

    const service = {
        id: services.data.id,
        ...services.data.attributes,
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <a href={`/${params.lang}/services${zipCode ? `?zip=${zipCode}` : ''}`} className={styles.backLink}>
                    ← Back to Services
                </a>
                <h1 className={styles.title}>Complete Your Booking</h1>
                <p className={styles.subtitle}>
                    You're booking: <strong>{service.name}</strong>
                </p>
            </div>

            <BookingForm
                service={service}
                addOns={addOns}
                zipCode={zipCode}
                lang={params.lang}
            />
        </div>
    );
}
