/**
 * GET /api/admin/payouts?week=2026-03-17
 * Returns all payout records for a given week (period_start).
 * If no week is provided, returns all pending payouts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/verifyAdmin';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const week = searchParams.get('week'); // ISO date of Monday (period_start)
    const statusFilter = searchParams.get('status'); // 'pending' | 'paid' | null

    try {
        const supabase = createServiceClient();

        let query = supabase
            .from('payouts')
            .select(`
                *,
                contractor:profiles!payouts_contractor_id_fkey (
                    id, full_name, email, phone,
                    payment_preference, zelle_contact,
                    bank_name, bank_account_number, bank_routing_number
                )
            `)
            .order('period_start', { ascending: false });

        if (week) {
            query = query.eq('period_start', week);
        }
        if (statusFilter && (statusFilter === 'pending' || statusFilter === 'paid')) {
            query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Attach the bookings (id + order code) covered by each payout
        const rows = (data ?? []) as Array<Record<string, unknown>>;
        const payoutIds = rows.map((r) => r.id as number);
        const byPayout = new Map<number, { id: number; confirmation_code: string | null }[]>();
        if (payoutIds.length > 0) {
            const { data: bks } = await supabase
                .from('bookings')
                .select('id, confirmation_code, payout_id')
                .in('payout_id', payoutIds)
                .order('date', { ascending: true });
            (bks ?? []).forEach((b) => {
                const pid = b.payout_id as number;
                const list = byPayout.get(pid) ?? [];
                list.push({ id: b.id as number, confirmation_code: (b.confirmation_code as string | null) ?? null });
                byPayout.set(pid, list);
            });
        }
        const withBookings = rows.map((r) => ({ ...r, bookings: byPayout.get(r.id as number) ?? [] }));

        return NextResponse.json({ data: withBookings });
    } catch (err) {
        console.error('[admin/payouts GET]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
