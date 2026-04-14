/**
 * GET /api/admin/bookings/stats
 * Returns at-a-glance booking stats for the admin bookings list header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/verifyAdmin';

export async function GET(req: NextRequest) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createServiceClient();

        const now = new Date();
        // Use Eastern time for "today" and "this month" boundaries
        const eastern = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
        const todayStart = new Date(eastern.getFullYear(), eastern.getMonth(), eastern.getDate()).toISOString();
        const monthStart = new Date(eastern.getFullYear(), eastern.getMonth(), 1).toISOString();

        const [todayRes, pendingRes, pendingPaymentRes, revenueRes, completedMonthRes] = await Promise.all([
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
        ]);

        const totalRevenue = (revenueRes.data ?? []).reduce(
            (s, b) => s + (Number(b.total_amount) || 0),
            0
        );

        return NextResponse.json({
            todayCount: todayRes.count ?? 0,
            pendingAssignment: pendingRes.count ?? 0,
            pendingPayment: pendingPaymentRes.count ?? 0,
            totalRevenue,
            completedThisMonth: completedMonthRes.count ?? 0,
        });
    } catch (err) {
        console.error('[admin/bookings/stats]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
