'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BookingStatusProvider } from '@/contexts/BookingStatusContext';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const lang = (params?.lang as string) || 'en';

    // Client-side auth guard (middleware handles server-side)
    useEffect(() => {
        if (!isLoading && !user) {
            router.replace(`/${lang}/login`);
        }
    }, [isLoading, user, lang, router]);

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
            </div>
        );
    }

    return (
        <BookingStatusProvider>
            <div className="min-h-screen bg-bg-primary">
                <Sidebar lang={lang} />
                <main className="lg:pl-64 min-h-screen transition-all duration-300">
                    {children}
                </main>
            </div>
        </BookingStatusProvider>
    );
}

