'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { strapiClient, type ZipValidationResponse } from '@/lib/api';
import styles from './ZipChecker.module.css';

interface ZipCheckerProps {
    dict: {
        placeholder: string;
        button: string;
        checking: string;
        available: string;
        unavailable: string;
        error: string;
        continue: string;
        waitlist: {
            title: string;
            description: string;
            emailPlaceholder: string;
            submit: string;
        };
    };
    lang: string;
}

export default function ZipChecker({ dict, lang }: ZipCheckerProps) {
    const [zipCode, setZipCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ZipValidationResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await strapiClient.validateZip(zipCode);

            if (response.available) {
                router.push(`/${lang}/booking/services?zip=${zipCode}`);
                // Don't set loading to false here - keep it loading until page transitions
            } else {
                setResult(response);
                setLoading(false);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLoading(false);
        }
    };

    const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 5);
        setZipCode(value);
    };

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                    <input
                        type="text"
                        value={zipCode}
                        onChange={handleZipChange}
                        placeholder={dict.placeholder}
                        className={styles.input}
                        maxLength={5}
                        pattern="\d{5}"
                        required
                    />
                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading || zipCode.length !== 5}
                    >
                        {loading ? dict.checking : dict.button}
                    </button>
                </div>
            </form>

            {error && (
                <div className={styles.error}>
                    <p>{error}</p>
                </div>
            )}

            {result && (
                <div className={result.available ? styles.success : styles.waitlist}>
                    <h3>{result.message}</h3>

                    {result.available && result.services && (
                        <div className={styles.servicesPreview}>
                            <p className={styles.servicesCount}>
                                {result.services.length} services available in your area
                            </p>
                            <div className={styles.serviceCards}>
                                {result.services.map((service) => (
                                    <div key={service.id} className={styles.serviceCard}>
                                        <h4>{service.name}</h4>
                                        <p className={styles.price}>${service.basePrice}</p>
                                        <p className={styles.description}>{service.description}</p>
                                    </div>
                                ))}
                            </div>
                            {result.addOns && result.addOns.length > 0 && (
                                <p className={styles.addOnsNote}>
                                    + {result.addOns.length} add-ons available
                                </p>
                            )}
                            <Link
                                href={`/${lang}/booking/services?zip=${zipCode}`}
                                className={styles.continueButton}
                            >
                                {dict.continue}
                            </Link>
                        </div>
                    )}

                    {!result.available && (
                        <div className={styles.waitlistForm}>
                            <h4>{dict.waitlist.title}</h4>
                            <p>{dict.waitlist.description}</p>
                            <form
                                className={styles.emailForm}
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    alert('Waitlist feature coming soon! Thank you for your interest.');
                                }}
                            >
                                <input
                                    type="email"
                                    placeholder={dict.waitlist.emailPlaceholder}
                                    className={styles.emailInput}
                                    required
                                />
                                <button type="submit" className={styles.submitButton}>
                                    {dict.waitlist.submit}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
