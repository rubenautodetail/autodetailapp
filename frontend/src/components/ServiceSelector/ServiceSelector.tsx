'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { strapiClient, type PriceCalculation } from '@/lib/api';
import styles from './ServiceSelector.module.css';

interface Service {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    durationMinutes: number;
}

interface AddOn {
    id: string;
    name: string;
    description: string;
    price: number;
    durationMinutes: number;
}

interface ServiceSelectorProps {
    services: Service[];
    addOns: AddOn[];
    zipCode: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dict: Record<string, any>;
    lang: string;
}

export default function ServiceSelector({ services, addOns, zipCode, dict, lang }: ServiceSelectorProps) {
    const router = useRouter();
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
    const [priceData, setPriceData] = useState<PriceCalculation | null>(null);
    const [loading, setLoading] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(false);

    // Calculate price whenever selection changes
    useEffect(() => {
        if (!selectedService) {
            setPriceData(null);
            return;
        }

        const calculatePrice = async () => {
            setLoading(true);
            try {
                const result = await strapiClient.calculatePrice(selectedService, selectedAddOns, zipCode);
                setPriceData(result);
            } catch (error) {
                console.error('Error calculating price:', error);
            } finally {
                setLoading(false);
            }
        };

        calculatePrice();
    }, [selectedService, selectedAddOns, zipCode]);

    const toggleAddOn = (addOnId: string) => {
        setSelectedAddOns(prev =>
            prev.includes(addOnId)
                ? prev.filter(id => id !== addOnId)
                : [...prev, addOnId]
        );
    };

    const handleContinue = () => {
        if (!selectedService || !priceData) return;

        // Build URL params for schedule page
        const params = new URLSearchParams({
            zip: zipCode,
            service: selectedService,
            addons: selectedAddOns.join(','),
            price: priceData.breakdown.total.toFixed(2),
            duration: priceData.totalDuration.toString(),
        });

        router.push(`/${lang}/booking/schedule?${params.toString()}`);
    };

    return (
        <div className={styles.container}>
            {/* Services Section */}
            <section className={styles.servicesSection}>
                <h2>{dict.selectService}</h2>
                <div className={styles.serviceGrid}>
                    {services.map((service) => (
                        <div
                            key={service.id}
                            className={`${styles.serviceCard} ${selectedService === service.id ? styles.selected : ''}`}
                            onClick={() => setSelectedService(service.id)}
                        >
                            <h3>{service.name}</h3>
                            <p className={styles.price}>${service.basePrice}</p>
                            <p className={styles.description}>{service.description}</p>
                            <p className={styles.duration}>
                                {dict.duration}: {service.durationMinutes} {dict.minutes}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Add-Ons Section */}
            {selectedService && addOns.length > 0 && (
                <section className={styles.addOnsSection}>
                    <h2>{dict.addOns}</h2>
                    <div className={styles.addOnsList}>
                        {addOns.map((addOn) => (
                            <label key={addOn.id} className={styles.addOnItem}>
                                <input
                                    type="checkbox"
                                    checked={selectedAddOns.includes(addOn.id)}
                                    onChange={() => toggleAddOn(addOn.id)}
                                />
                                <div className={styles.addOnInfo}>
                                    <div>
                                        <strong>{addOn.name}</strong>
                                        <p>{addOn.description}</p>
                                    </div>
                                    <span className={styles.addOnPrice}>+${addOn.price}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </section>
            )}

            {/* Price Summary (Sticky Footer) */}
            {priceData && (
                <div className={styles.priceSummary}>
                    <div className={styles.summaryContent}>
                        <button
                            className={styles.breakdownToggle}
                            onClick={() => setShowBreakdown(!showBreakdown)}
                        >
                            {showBreakdown ? dict.priceSummary.hideBreakdown : dict.priceSummary.viewBreakdown}
                        </button>

                        {showBreakdown && (
                            <div className={styles.breakdown}>
                                <div className={styles.breakdownLine}>
                                    <span>{dict.priceSummary.baseService}</span>
                                    <span>${priceData.breakdown.basePrice.toFixed(2)}</span>
                                </div>
                                {priceData.breakdown.addOnsTotal > 0 && (
                                    <div className={styles.breakdownLine}>
                                        <span>{dict.priceSummary.addOns}</span>
                                        <span>${priceData.breakdown.addOnsTotal.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className={styles.breakdownLine}>
                                    <span>{dict.priceSummary.subtotal}</span>
                                    <span>${priceData.breakdown.subtotal.toFixed(2)}</span>
                                </div>
                                <div className={styles.breakdownLine}>
                                    <span>{dict.priceSummary.serviceFee}</span>
                                    <span>${priceData.breakdown.serviceFee.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        <div className={styles.total}>
                            <span>{dict.priceSummary.total}</span>
                            <span className={styles.totalAmount}>
                                ${loading ? '...' : priceData.breakdown.total.toFixed(2)}
                            </span>
                        </div>

                        <button
                            className={styles.continueButton}
                            onClick={handleContinue}
                            disabled={!selectedService}
                        >
                            {dict.continue}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
