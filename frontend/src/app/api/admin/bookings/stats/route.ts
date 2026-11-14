/**
 * GET /api/admin/bookings/stats
 * Returns at-a-glance booking stats for the admin bookings list header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/verifyAdmin';

/** The exact moment (UTC) when a day or month starts in Miami (Eastern time). */
function easternStart(unit: 'day' | 'month', now: Date): string {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const y = get('year');
    const m = get('month');
    const d = unit === 'month' ? 1 : get('day');
    const etHour = (x: Date) =>
        Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false }).format(x)) % 24;
    // Midnight Eastern is 05:00 UTC in winter (EST) and 04:00 UTC in summer (EDT).
    let candidate = new Date(Date.UTC(y, m - 1, d, 5));
    if (etHour(candidate) !== 0) candidate = new Date(Date.UTC(y, m - 1, d, 4));
    return candidate.toISOString();
}

export async function GET(req: NextRequest) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createServiceClient();

        const now = new Date();
        // Use Eastern time for "today" and "this month" boundaries
        const todayStart = easternStart('day', now);
        const monthStart = easternStart('month', now);

        const [todayRes, pendingRes, pendingPaymentRes, revenueRes, completedMonthRes, monthRevenueRes] = await Promise.all([
            // Bookings created today
            supabase
                .from('bookings')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', todayStart),

            // Pending assignment (awaiting contractor)
            supabase
                .from('bookings')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending_assignment'),

            // Stuck in pending_payment (payment authorized but booking not transitioned)
            supabase
                .from('bookings')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending_payment'),

            // Total revenue from completed bookings with valid payment
            supabase
                .from('bookings')
                .select('total_amount, payment_status')
                .eq('status', 'completed')
                .in('payment_status', ['paid', 'captured', 'partially_refunded']),

            // Completed this calendar month
            supabase
                .from('bookings')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'completed')
                .gte('updated_at', monthStart),

            // Revenue from bookings completed this calendar month
            supabase
                .from('bookings')
                .select('total_amount')
                .eq('status', 'completed')
                .in('payment_status', ['paid', 'captured', 'partially_refunded'])
                .gte('updated_at', monthStart),
        ]);

        const monthRevenue = (monthRevenueRes.data ?? []).reduce(
            (s, b) => s + (Number(b.total_amount) || 0),
            0
        );

        const totalRevenue = (revenueRes.data ?? []).reduce(
            (s, b) => s + (Number(b.total_amount) || 0),
            0
        );

        return NextResponse.json({
            todayCount: todayRes.count ?? 0,
            pendingAssignment: pendingRes.count ?? 0,
            pendingPayment: pendingPaymentRes.count ?? 0,
            totalRevenue,
            monthRevenue,
            completedThisMonth: completedMonthRes.count ?? 0,
        });
    } catch (err) {
        console.error('[admin/bookings/stats]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
