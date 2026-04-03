'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { catalogClient, type ZipValidationResponse } from '@/lib/api';

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
    // Defensive defaults in case dict is missing
    const t = {
        ...dict,
        placeholder: dict?.placeholder || "Enter Zip Code",
        button: dict?.button || "Check Availability",
    };

    const [zipCode, setZipCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ZipValidationResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [waitlistJoined, setWaitlistJoined] = useState(false);

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await catalogClient.validateZip(zipCode);

            if (response.available) {
                sessionStorage.setItem('serviceZipCode', zipCode);
                router.push(`/${lang}/booking/select?zip=${zipCode}`);
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
        <div className="w-full">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="relative glass-card rounded-2xl overflow-hidden ring-1 ring-white/10 focus-within:ring-accent-gold/40 transition-all duration-300">
                    <input
                        type="text"
                        value={zipCode}
                        onChange={handleZipChange}
                        placeholder={t.placeholder}
                        className="w-full bg-transparent text-white text-2xl sm:text-3xl py-4 sm:py-5 px-4 sm:px-6 focus:outline-none placeholder:text-white/20 text-center tracking-[0.15em] font-light"
                        style={{ fontFamily: 'var(--font-display)' }}
                        maxLength={5}
                        inputMode="numeric"
                        pattern="\d{5}"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="btn-primary w-full py-4 px-6 rounded-xl font-semibold text-sm tracking-widest uppercase transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                    disabled={loading || zipCode.length !== 5}
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        t.button
                    )}
                </button>
            </form>

            {error && (
                <div className="mt-4 text-red-400 text-sm font-light animate-fade-in">
                    {error}
                </div>
            )}

            {result && (
                <div className="mt-8 animate-fade-in-up">
                    <div className="glass p-8 rounded-none border-l-2 border-accent-gold bg-bg-secondary/80">
                        <h3 className="text-2xl font-display text-white mb-2">{result.message}</h3>

                        {result.available && result.services && (
                            <div className="space-y-6">
                                <p className="text-text-secondary font-light">
                                    We are pleased to serve your area with {result.services.length} signature treatments.
                                </p>
                                <div className="space-y-3">
                                    {result.services.map((service) => (
                                        <div key={service.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 transition-colors">
                                            <span className="font-display text-lg text-white">{service.name}</span>
                                            <span className="text-accent-gold font-medium">${service.basePrice}</span>
                                        </div>
                                    ))}
                                </div>
                                <Link
                                    href={`/${lang}/booking/select?zip=${zipCode}`}
                                    className="block w-full text-center bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-accent-gold hover:text-white transition-all mt-6"
                                >
                                    {dict.continue || "Proceed to Booking"}
                                </Link>
                            </div>
                        )}

                        {!result.available && (
                            <div className="space-y-4">
                                <p className="text-text-secondary">
                                    {dict.waitlist.description}
                                </p>
                                {waitlistJoined ? (
                                    <p className="text-green-400 text-sm font-medium">
                                        You&apos;re on the list &mdash; we&apos;ll notify you when we expand to your area.
                                    </p>
                                ) : (
                                <form
                                    className="flex gap-4 border-b border-white/20 pb-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        setWaitlistJoined(true);
                                    }}
                                >
                                    <input
                                        type="email"
                                        placeholder={dict.waitlist.emailPlaceholder}
                                        className="flex-1 bg-transparent text-white focus:outline-none placeholder:text-white/20"
                                        required
                                    />
                                    <button type="submit" className="text-accent-gold text-sm uppercase tracking-widest hover:text-white transition-colors">
                                        Join
                                    </button>
                                </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
