"use client";

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationToast } from '@/components/dashboard/NotificationToast';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}

export default function DashboardLayout({
    children,
    params,
}: DashboardLayoutProps) {
    const { lang } = use(params);
    const { user, profile, isLoading } = useAuth();
    const router = useRouter();
    const { notifications, dismissToast } = useNotifications();

    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.replace(`/${lang}/login`);
            return;
        }
        // Prevent contractors/admins from accessing customer dashboard
        if (profile?.role === 'contractor') {
            router.replace(`/${lang}/contractor/dashboard`);
        } else if (profile?.role === 'admin') {
            router.replace(`/${lang}/admin`);
        }
    }, [isLoading, user, profile, lang, router]);

    if (isLoading || !user || (profile && profile.role !== 'user')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <NotificationToast notifications={notifications.filter(n => !n.is_read)} onDismiss={dismissToast} />
            {children}
        </div>
    );
}
