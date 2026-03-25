/**
 * GET /api/admin/payouts/unpaid-by-contractor
 *
 * Returns all contractors with unpaid completed bookings (no payout_id),
 * grouped with their total outstanding balance. Used by the "Pay Now" tab.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/verifyAdmin';
import { createServiceClient } from '@/lib/supabase/server';

const CONTRACTOR_SHARE = 0.70;

export async function GET(req: NextRequest) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createServiceClient();

        // All completed bookings without a payout_id
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('id, contractor_id, total_amount, date')
            .eq('status', 'completed')
            .is('payout_id', null)
            .not('contractor_id', 'is', null)
            .order('date', { ascending: false });

        if (error) throw error;

        if (!bookings || bookings.length === 0) {
            return NextResponse.json({ data: [] });
        }

        // Collect unique contractor IDs
        const contractorIds = [...new Set(bookings.map((b) => b.contractor_id as string))];

        // Fetch contractor profiles
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone, payment_preference, zelle_contact, bank_account_number')
            .in('id', contractorIds);

        const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

        // Group bookings by contractor
        type BookingRow = { id: number; date: string; gross: number };
        const byContractor = new Map<string, { bookings: BookingRow[]; gross: number }>();
        for (const b of bookings) {
            const cid = b.contractor_id as string;
            if (!cid) continue;
            const gross = Number(b.total_amount) || 0;
            const existing = byContractor.get(cid);
            if (existing) {
                existing.bookings.push({ id: b.id, date: b.date, gross });
                existing.gross += gross;
            } else {
                byContractor.set(cid, { bookings: [{ id: b.id, date: b.date, gross }], gross });
            }
        }

        const result = Array.from(byContractor.entries()).map(([contractorId, { bookings: jobs, gross }]) => {
            const profile = profileMap.get(contractorId) ?? null;
            return {
                contractor_id: contractorId,
                contractor: profile,
                total_bookings: jobs.length,
                gross_amount: +gross.toFixed(2),
                platform_fee: +(gross * (1 - CONTRACTOR_SHARE)).toFixed(2),
                contractor_amount: +(gross * CONTRACTOR_SHARE).toFixed(2),
                oldest_job_date: jobs[jobs.length - 1]?.date ?? null,
                newest_job_date: jobs[0]?.date ?? null,
            };
        });

        // Sort by contractor name
        result.sort((a, b) => (a.contractor?.full_name ?? '').localeCompare(b.contractor?.full_name ?? ''));

        return NextResponse.json({ data: result });
    } catch (err) {
        console.error('[admin/payouts/unpaid-by-contractor]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
