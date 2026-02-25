/**
 * GET /api/contractors/dashboard
 * Returns today's schedule, active jobs count, and earnings for the
 * authenticated contractor. Reads directly from Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createApiClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { user, error: authError } = await createAuthClient(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createApiClient();
        const today = new Date().toISOString().split('T')[0];

        // Fetch today's assigned bookings for this contractor
        const { data: todayBookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('*')
            .eq('contractor_id', user.id)
            .eq('date', today)
            .order('created_at', { ascending: true });

        if (bookingsError) {
            console.error('Error fetching today bookings:', bookingsError);
        }

        // Fetch active job count
        const { count: activeCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('contractor_id', user.id)
            .in('status', ['confirmed', 'in_progress', 'working']);

        // Fetch completed bookings for earnings
        const { data: completedBookings } = await supabase
            .from('bookings')
            .select('total_amount, created_at')
            .eq('contractor_id', user.id)
            .eq('status', 'completed');

        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const totalEarnings = (completedBookings ?? []).reduce((sum, b) => {
            return sum + (Number(b.total_amount) || 0);
        }, 0);

        const weekEarnings = (completedBookings ?? [])
            .filter((b) => new Date(b.created_at) >= weekAgo)
            .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

        const todaySchedule = (todayBookings ?? []).map((b) => ({
            id: b.id,
            service: { name: (b as any).service_name || 'Auto Detail' },
            timeWindow: b.time_window || 'TBD',
            location: { address: b.address || '' },
            status: b.status,
            customerName: b.customer_name,
        }));

        return NextResponse.json({
            contractor: { name: user.email?.split('@')[0] || 'Contractor' },
            todaySchedule,
            activeJobs: activeCount ?? 0,
            earnings: {
                thisWeek: weekEarnings,
                total: totalEarnings,
            },
        });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
