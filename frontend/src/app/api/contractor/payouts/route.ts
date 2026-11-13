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
            .select('id, batch, period_start, period_end, total_bookings, gross_amount, platform_fee, contractor_amount, status, payment_method, paid_at, created_at')
            .eq('contractor_id', contractorId)
            .order('period_start', { ascending: false })
            .order('batch', { ascending: false })
            .limit(52); // last 52 weeks

        if (error) {
            // Table may not exist yet — return empty array gracefully
            console.warn('[contractor/payouts] query error (table may not exist):', error.message);
            return NextResponse.json({ data: [] });
        }

        // Which payout (and its status) covers each completed job
        const byBooking: Record<string, { status: string; paid_at: string | null; payment_method: string | null }> = {};
        const payoutMap = new Map((data ?? []).map((p) => [p.id as number, p]));
        if (payoutMap.size > 0) {
            const { data: linked } = await supabase
                .from('bookings')
                .select('id, payout_id')
                .eq('contractor_id', contractorId)
                .in('payout_id', Array.from(payoutMap.keys()));
            (linked ?? []).forEach((b) => {
                const p = payoutMap.get(b.payout_id as number);
                if (p) byBooking[String(b.id)] = { status: p.status as string, paid_at: (p.paid_at as string | null) ?? null, payment_method: (p.payment_method as string | null) ?? null };
            });
        }

        return NextResponse.json({ data: data ?? [], bookingPayouts: byBooking });
    } catch (err) {
        // Catch-all for unexpected failures (e.g. missing table)
        console.warn('[contractor/payouts] unexpected error:', err);
        return NextResponse.json({ data: [] });
    }
}
