/**
 * GET /api/contractor/earnings/summary
 * Returns earnings summary for the authenticated contractor.
 * All amounts are net (70% of booking total — platform keeps 30%).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';

const CONTRACTOR_SHARE = 0.70;

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '').trim();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let contractorId: string;
    try {
        const { user } = await createAuthClient(token);
        if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        contractorId = user.id;
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createServiceClient();

        // All completed bookings for this contractor
        const { data: completed, error: completedErr } = await supabase
            .from('bookings')
            .select('total_amount, date')
            .eq('contractor_id', contractorId)
            .eq('status', 'completed');

        if (completedErr) throw completedErr;

        // Pending payout: authorized card (payment captured) but job not yet completed
        const { data: pending, error: pendingErr } = await supabase
            .from('bookings')
            .select('total_amount')
            .eq('contractor_id', contractorId)
            .eq('payment_status', 'paid')
            .neq('status', 'completed')
            .neq('status', 'cancelled');

        if (pendingErr) throw pendingErr;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const totalEarned = (completed ?? []).reduce(
            (s, b) => s + (Number(b.total_amount) || 0) * CONTRACTOR_SHARE,
            0
        );

        const thisMonthEarned = (completed ?? [])
            .filter((b) => b.date && new Date(b.date) >= startOfMonth)
            .reduce((s, b) => s + (Number(b.total_amount) || 0) * CONTRACTOR_SHARE, 0);

        const pendingPayout = (pending ?? []).reduce(
            (s, b) => s + (Number(b.total_amount) || 0) * CONTRACTOR_SHARE,
            0
        );

        const completedJobs = (completed ?? []).length;

        return NextResponse.json({
            totalEarned,
            thisMonthEarned,
            pendingPayout,
            completedJobs,
        });
    } catch (err) {
        console.error('[earnings/summary]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
