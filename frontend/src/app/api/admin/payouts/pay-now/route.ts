/**
 * POST /api/admin/payouts/pay-now
 *
 * Creates a payout record for a contractor from ALL their unpaid completed bookings
 * and immediately marks it as paid in a single operation. Admin can run this at any time.
 *
 * Body: {
 *   contractor_id: string
 *   payment_method: "ach" | "zelle" | "check" | "cash"
 *   reference?: string   — Zelle confirmation, check #, wire ref, etc.
 *   notes?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/verifyAdmin';
import { createServiceClient, createAuthClient } from '@/lib/supabase/server';

const CONTRACTOR_SHARE = 0.70;
const VALID_METHODS = ['ach', 'zelle', 'check', 'cash'] as const;
type PaymentMethod = typeof VALID_METHODS[number];

export async function POST(req: NextRequest) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let contractor_id: string;
    let payment_method: PaymentMethod;
    let reference: string | undefined;
    let notes: string | undefined;

    try {
        const body = await req.json();
        contractor_id = body.contractor_id;
        payment_method = body.payment_method;
        reference = body.reference?.trim() || undefined;
        notes = body.notes?.trim() || undefined;

        if (!contractor_id) return NextResponse.json({ error: 'contractor_id is required' }, { status: 400 });
        if (!VALID_METHODS.includes(payment_method)) return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Identify the admin
    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
    let adminId: string | null = null;
    if (token && token !== process.env.ADMIN_SECRET) {
        try {
            const { user } = await createAuthClient(token);
            adminId = user?.id ?? null;
        } catch { /* admin secret path */ }
    }

    try {
        const supabase = createServiceClient();

        // Fetch all unpaid completed bookings for this contractor
        const { data: bookings, error: bookingsErr } = await supabase
            .from('bookings')
            .select('id, total_amount, date')
            .eq('status', 'completed')
            .eq('contractor_id', contractor_id)
            .is('payout_id', null);

        if (bookingsErr) throw bookingsErr;

        if (!bookings || bookings.length === 0) {
            return NextResponse.json({ error: 'No unpaid completed bookings for this contractor' }, { status: 409 });
        }

        // Calculate amounts
        const gross = bookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
        const platformFee = +(gross * (1 - CONTRACTOR_SHARE)).toFixed(2);
        const contractorAmount = +(gross * CONTRACTOR_SHARE).toFixed(2);

        const dates = bookings.map((b) => b.date).filter(Boolean).sort();
        const earliest = dates[0] ?? new Date().toISOString().slice(0, 10);
        const latest = dates[dates.length - 1] ?? earliest;

        // Align period_start to Monday and period_end to Sunday so History tab can match
        const toMonday = (iso: string): string => {
            const d = new Date(iso + 'T00:00:00');
            const day = d.getDay(); // 0=Sun,1=Mon,...,6=Sat
            const diff = day === 0 ? -6 : 1 - day;
            d.setDate(d.getDate() + diff);
            return d.toISOString().slice(0, 10);
        };
        const toSunday = (iso: string): string => {
            const d = new Date(iso + 'T00:00:00');
            const day = d.getDay();
            const diff = day === 0 ? 0 : 7 - day;
            d.setDate(d.getDate() + diff);
            return d.toISOString().slice(0, 10);
        };

        const periodStart = toMonday(earliest);
        const periodEnd = toSunday(latest);

        // Build combined notes
        const combinedNotes = [
            reference ? `Ref: ${reference}` : null,
            notes || null,
        ].filter(Boolean).join(' — ') || null;

        // Insert payout record already marked as paid
        const { data: payout, error: insertErr } = await supabase
            .from('payouts')
            .insert({
                contractor_id,
                period_start: periodStart,
                period_end: periodEnd,
                total_bookings: bookings.length,
                gross_amount: +gross.toFixed(2),
                platform_fee: platformFee,
                contractor_amount: contractorAmount,
                status: 'paid',
                payment_method,
                paid_at: new Date().toISOString(),
                paid_by: adminId,
                notes: combinedNotes,
            })
            .select('id')
            .single();

        if (insertErr) throw insertErr;

        // Link all bookings to this payout
        const { error: linkErr } = await supabase
            .from('bookings')
            .update({ payout_id: payout.id })
            .in('id', bookings.map((b) => b.id));

        if (linkErr) throw linkErr;

        // Send confirmation email to contractor
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', contractor_id)
            .single();

        if (profile?.email) {
            try {
                const { sendPayoutConfirmation } = await import('@/lib/email');
                await sendPayoutConfirmation({
                    contractorName: profile.full_name ?? 'Contractor',
                    contractorEmail: profile.email,
                    periodStart,
                    periodEnd,
                    totalBookings: bookings.length,
                    grossAmount: +gross.toFixed(2),
                    platformFee,
                    contractorAmount,
                    paymentMethod: payment_method,
                    notes: combinedNotes,
                });
            } catch (emailErr) {
                console.error('[pay-now] email error', emailErr);
            }
        }

        return NextResponse.json({
            success: true,
            payout_id: payout.id,
            contractor_amount: contractorAmount,
            total_bookings: bookings.length,
        });
    } catch (err) {
        console.error('[admin/payouts/pay-now]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
