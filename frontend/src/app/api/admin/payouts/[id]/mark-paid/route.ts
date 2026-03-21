/**
 * POST /api/admin/payouts/[id]/mark-paid
 * Body: { paymentMethod: "ach" | "zelle" | "check" | "cash", notes?: string }
 *
 * Marks a payout as paid and sends a confirmation email to the contractor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/verifyAdmin';
import { createServiceClient, createAuthClient } from '@/lib/supabase/server';
import { sendPayoutConfirmation } from '@/lib/email';

const VALID_METHODS = ['ach', 'zelle', 'check', 'cash'] as const;
type PaymentMethod = typeof VALID_METHODS[number];

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const payoutId = Number(id);
    if (isNaN(payoutId)) {
        return NextResponse.json({ error: 'Invalid payout ID' }, { status: 400 });
    }

    let paymentMethod: PaymentMethod;
    let notes: string | undefined;
    try {
        const body = await req.json();
        paymentMethod = body.paymentMethod;
        notes = body.notes;
        if (!VALID_METHODS.includes(paymentMethod)) {
            return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
        }
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Identify the admin who is marking this paid
    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
    let adminId: string | null = null;
    if (token && token !== process.env.ADMIN_SECRET) {
        try {
            const { user } = await createAuthClient(token);
            adminId = user?.id ?? null;
        } catch { /* ok — admin secret used */ }
    }

    try {
        const supabase = createServiceClient();

        // Fetch payout + contractor info
        const { data: payout, error: fetchErr } = await supabase
            .from('payouts')
            .select(`
                *,
                contractor:profiles!payouts_contractor_id_fkey (
                    id, full_name, email
                )
            `)
            .eq('id', payoutId)
            .single();

        if (fetchErr || !payout) {
            return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
        }
        if (payout.status === 'paid') {
            return NextResponse.json({ error: 'Payout already marked as paid' }, { status: 409 });
        }

        // Mark as paid
        const { error: updateErr } = await supabase
            .from('payouts')
            .update({
                status: 'paid',
                payment_method: paymentMethod,
                paid_at: new Date().toISOString(),
                paid_by: adminId,
                notes: notes ?? null,
            })
            .eq('id', payoutId);

        if (updateErr) throw updateErr;

        // Send confirmation email to contractor
        const contractor = payout.contractor as { id: string; full_name: string | null; email: string | null } | null;
        if (contractor?.email) {
            try {
                await sendPayoutConfirmation({
                    contractorName: contractor.full_name ?? 'Contractor',
                    contractorEmail: contractor.email,
                    periodStart: payout.period_start,
                    periodEnd: payout.period_end,
                    totalBookings: payout.total_bookings,
                    grossAmount: payout.gross_amount,
                    platformFee: payout.platform_fee,
                    contractorAmount: payout.contractor_amount,
                    paymentMethod,
                    notes: notes ?? null,
                });
            } catch (emailErr) {
                // Email failure should not block the response
                console.error('[admin/payouts/mark-paid] email error', emailErr);
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/payouts/mark-paid]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
