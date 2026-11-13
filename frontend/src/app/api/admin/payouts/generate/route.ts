/**
 * POST /api/admin/payouts/generate
 * Body: { week: "2026-03-17" } — ISO date of Monday
 *
 * Groups all completed bookings (without a payout_id) that fall within the
 * given week by contractor and links them to a payout. A payout that is already
 * paid is never modified: leftover bookings go into a new payout (next batch).
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/verifyAdmin';
import { createServiceClient } from '@/lib/supabase/server';

const CONTRACTOR_SHARE = 0.70;

function getMondayOfWeek(dateStr: string): Date {
    const d = new Date(dateStr + 'T12:00:00Z');
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + diff);
    return d;
}

function getSundayOfWeek(monday: Date): Date {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + 6);
    return d;
}

export async function POST(req: NextRequest) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let week: string;
    try {
        const body = await req.json();
        week = body.week;
        if (!week || !/^\d{4}-\d{2}-\d{2}$/.test(week)) {
            return NextResponse.json({ error: 'Invalid week date. Use YYYY-MM-DD (Monday).' }, { status: 400 });
        }
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const monday = getMondayOfWeek(week);
    const sunday = getSundayOfWeek(monday);
    const periodStart = monday.toISOString().slice(0, 10);
    const periodEnd = sunday.toISOString().slice(0, 10);

    try {
        const supabase = createServiceClient();

        // Fetch completed bookings in this period without a payout_id
        const { data: bookings, error: bookingsErr } = await supabase
            .from('bookings')
            .select('id, contractor_id, total_amount')
            .eq('status', 'completed')
            .is('payout_id', null)
            .not('contractor_id', 'is', null)
            .gte('date', periodStart)
            .lte('date', periodEnd);

        if (bookingsErr) throw bookingsErr;

        if (!bookings || bookings.length === 0) {
            return NextResponse.json({ message: 'No unpaid completed bookings found for this week.', generated: 0 });
        }

        // Group by contractor
        const byContractor = new Map<string, { bookingIds: number[]; gross: number }>();
        for (const b of bookings) {
            if (!b.contractor_id) continue;
            const gross = Number(b.total_amount) || 0;
            const existing = byContractor.get(b.contractor_id);
            if (existing) {
                existing.bookingIds.push(b.id);
                existing.gross += gross;
            } else {
                byContractor.set(b.contractor_id, { bookingIds: [b.id], gross });
            }
        }

        let generated = 0;
        for (const [contractorId, { bookingIds, gross }] of byContractor) {
            const platformFee = +(gross * (1 - CONTRACTOR_SHARE)).toFixed(2);
            const contractorAmount = +(gross * CONTRACTOR_SHARE).toFixed(2);

            // Look at the latest payout already generated for this contractor and week.
            //  - none            -> create payout #1
            //  - still pending   -> add the new bookings to it
            //  - already paid    -> NEVER touch it; create a new payout (next batch)
            const { data: latest, error: latestErr } = await supabase
                .from('payouts')
                .select('id, batch, status, total_bookings, gross_amount')
                .eq('contractor_id', contractorId)
                .eq('period_start', periodStart)
                .eq('period_end', periodEnd)
                .order('batch', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (latestErr) throw latestErr;

            let payout: { id: number };
            if (latest && latest.status === 'pending') {
                const newGross = +(Number(latest.gross_amount) + gross).toFixed(2);
                const { data: updated, error: updErr } = await supabase
                    .from('payouts')
                    .update({
                        total_bookings: Number(latest.total_bookings) + bookingIds.length,
                        gross_amount: newGross,
                        platform_fee: +(newGross * (1 - CONTRACTOR_SHARE)).toFixed(2),
                        contractor_amount: +(newGross * CONTRACTOR_SHARE).toFixed(2),
                    })
                    .eq('id', latest.id)
                    .eq('status', 'pending')
                    .select('id')
                    .single();
                if (updErr) throw updErr;
                payout = updated;
            } else {
                const { data: inserted, error: insErr } = await supabase
                    .from('payouts')
                    .insert({
                        contractor_id: contractorId,
                        period_start: periodStart,
                        period_end: periodEnd,
                        batch: latest ? Number(latest.batch) + 1 : 1,
                        total_bookings: bookingIds.length,
                        gross_amount: +gross.toFixed(2),
                        platform_fee: platformFee,
                        contractor_amount: contractorAmount,
                        status: 'pending',
                    })
                    .select('id')
                    .single();
                if (insErr) throw insErr;
                payout = inserted;
            }

            // Link bookings to this payout
            const { error: linkErr } = await supabase
                .from('bookings')
                .update({ payout_id: payout.id })
                .in('id', bookingIds);

            if (linkErr) throw linkErr;
            generated++;
        }

        return NextResponse.json({ message: `Generated ${generated} payout record(s) for week ${periodStart}.`, generated });
    } catch (err) {
        console.error('[admin/payouts/generate]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
