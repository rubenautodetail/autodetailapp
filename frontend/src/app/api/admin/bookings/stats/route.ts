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
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

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

            // Total revenue from all completed+paid bookings
            supabase
                .from('bookings')
                .select('total_amount')
                .eq('status', 'completed')
                .eq('payment_status', 'paid'),

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
