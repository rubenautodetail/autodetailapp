import { getServices } from '@/lib/api/bookings';
import ServiceCard from '@/components/booking/ServiceCard';
import styles from './services.module.css';

export default async function ServicesPage({
    params,
    searchParams,
}: {
    params: Promise<{ lang: string }>;
    searchParams: Promise<{ zip?: string }>;
}) {
    const { lang } = await params;
    const { zip: zipCode } = await searchParams;
    const services = await getServices(lang);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Choose Your Service</h1>
                {zipCode && (
                    <p className={styles.subtitle}>
                        Available services for ZIP code: <strong>{zipCode}</strong>
                    </p>
                )}
            </div>

            <div className={styles.servicesGrid}>
                {services.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No services available at the moment.</p>
                        <p>Please check back later or contact support.</p>
                    </div>
                ) : (
                    services.map((service) => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            zipCode={zipCode}
                            lang={lang}
                        />
                    ))
                )}
            </div>

            {!zipCode && (
                <div className={styles.notice}>
                    <p>💡 Enter your ZIP code on the homepage to see available services in your area.</p>
                </div>
            )}
        </div>
    );
}
