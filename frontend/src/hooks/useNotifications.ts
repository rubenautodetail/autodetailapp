import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ToastMessage } from '@/components/dashboard/NotificationToast';

export interface AppNotification extends ToastMessage {
    user_id: string;
    is_read: boolean;
    link?: string;
    created_at: string;
    booking_id?: string;
}

function playNotificationSound(): void {
    try {
        const audioCtx = new AudioContext();
        const playTone = (freq: number, startTime: number, duration: number) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        const t = audioCtx.currentTime;
        playTone(880, t, 0.15);
        playTone(660, t + 0.18, 0.15);
    } catch {
        // Web Audio API not available (e.g. SSR or restricted context)
    }
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const supabase = createClient();

    useEffect(() => {
        let currentUserId: string | null = null;

        const fetchNotes = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            currentUserId = user.id;

            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) setNotifications(data as AppNotification[]);
        };

        fetchNotes();

        // Subscribe to new notifications — filter client-side so we only
        // process rows belonging to the authenticated user.
        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    const incoming = payload.new as AppNotification;

                    // Guard: only process if this notification is for the current user.
                    if (currentUserId && incoming.user_id !== currentUserId) return;

                    setNotifications((prev) => [incoming, ...prev]);

                    // Play two-tone sound for new job alerts.
                    if (incoming.title === 'New Job Available') {
                        playNotificationSound();
                    }

                    // Browser push notification if permission is granted.
                    if (typeof window !== 'undefined' && Notification.permission === 'granted') {
                        new Notification(incoming.title, {
                            body: incoming.message,
                            icon: '/icon.png',
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }, [supabase]);

    const dismissToast = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return { notifications, setNotifications, markAsRead, dismissToast, unreadCount };
}
