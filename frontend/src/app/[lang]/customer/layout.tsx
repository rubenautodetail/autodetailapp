import React from 'react';
import { BookingStatusProvider } from '@/contexts/BookingStatusContext';
import Sidebar from '@/components/dashboard/Sidebar';

export default async function CustomerLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;

    return (
        <BookingStatusProvider>
            <div className="min-h-screen bg-bg-primary">
                {/* Desktop Sidebar */}
                <Sidebar lang={lang} />

                {/* Main Content Area */}
                {/* Add left margin on desktop to account for sidebar width */}
                <main className="lg:pl-64 min-h-screen transition-all duration-300">
                    {children}
                </main>

                {/* Mobile Bottom Nav could go here if we wanted one for mobile */}
            </div>
        </BookingStatusProvider>
    );
}
