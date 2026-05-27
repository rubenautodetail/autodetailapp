/**
 * POST   /api/admin/platform-schedule/blocked-dates  { date, reason? }
 * DELETE /api/admin/platform-schedule/blocked-dates?date=YYYY-MM-DD
 *
 * Manages platform-wide blocked dates (holidays / closures).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/verifyAdmin';

export const dynamic = 'force-dynamic';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { date?: string; reason?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const date = (body.date ?? '').trim();
    if (!DATE_RX.test(date)) {
        return NextResponse.json({ error: 'date must be in YYYY-MM-DD format' }, { status: 400 });
    }
    const reason = body.reason?.trim() || null;

    try {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('platform_blocked_dates')
            .upsert({ date, reason }, { onConflict: 'date' })
            .select()
            .single();
        if (error) throw error;
        return NextResponse.json({ success: true, blockedDate: data });
    } catch (err) {
        console.error('POST /api/admin/platform-schedule/blocked-dates error:', err);
        return NextResponse.json({ error: 'Failed to block date' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const date = req.nextUrl.searchParams.get('date')?.trim();
    if (!date || !DATE_RX.test(date)) {
        return NextResponse.json({ error: 'date query param must be in YYYY-MM-DD format' }, { status: 400 });
    }

    try {
        const supabase = createServiceClient();
        const { error } = await supabase
            .from('platform_blocked_dates')
            .delete()
            .eq('date', date);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/admin/platform-schedule/blocked-dates error:', err);
        return NextResponse.json({ error: 'Failed to unblock date' }, { status: 500 });
    }
}
