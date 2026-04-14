/**
 * GET /api/contractor/payouts
 * Returns payout history for the authenticated contractor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
        const { data, error } = await supabase
            .from('payouts')
            .select('id, period_start, period_end, total_bookings, gross_amount, platform_fee, contractor_amount, status, payment_method, paid_at, created_at')
            .eq('contractor_id', contractorId)
            .order('period_start', { ascending: false })
            .limit(52); // last 52 weeks

        if (error) {
            // Table may not exist yet — return empty array gracefully
            console.warn('[contractor/payouts] query error (table may not exist):', error.message);
            return NextResponse.json({ data: [] });
        }
        return NextResponse.json({ data: data ?? [] });
    } catch (err) {
        // Catch-all for unexpected failures (e.g. missing table)
        console.warn('[contractor/payouts] unexpected error:', err);
        return NextResponse.json({ data: [] });
    }
}
