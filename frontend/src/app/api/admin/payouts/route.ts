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

        return NextResponse.json({ data: data ?? [] });
    } catch (err) {
        console.error('[admin/payouts GET]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
