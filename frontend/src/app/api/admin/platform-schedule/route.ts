/**
 * GET /api/admin/platform-schedule
 *   → { settings, blockedDates }
 * PATCH /api/admin/platform-schedule
 *   { weekday_defaults?, booking_window_days?, min_lead_time_hours? }
 *
 * Controls platform-wide booking calendar: which weekdays are open by default,
 * how far in advance customers can book, and the minimum same-day lead time.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/verifyAdmin';

export const dynamic = 'force-dynamic';

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

function sanitizeWeekdays(input: unknown): Record<string, boolean> | null {
    if (!input || typeof input !== 'object') return null;
    const out: Record<string, boolean> = {};
    for (const key of WEEKDAY_KEYS) {
        const v = (input as Record<string, unknown>)[key];
        if (typeof v !== 'boolean') return null;
        out[key] = v;
    }
    return out;
}

export async function GET(req: NextRequest) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createServiceClient();
        const [settingsRes, blockedRes] = await Promise.all([
            supabase
                .from('platform_schedule_settings')
                .select('weekday_defaults, booking_window_days, min_lead_time_hours, updated_at')
                .eq('id', 1)
                .maybeSingle(),
            supabase
                .from('platform_blocked_dates')
                .select('id, date, reason, created_at')
                .order('date'),
        ]);

        return NextResponse.json({
            settings: settingsRes.data ?? {
                weekday_defaults: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
                booking_window_days: 14,
                min_lead_time_hours: 1,
            },
            blockedDates: blockedRes.data ?? [],
        });
    } catch (err) {
        console.error('GET /api/admin/platform-schedule error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if ('weekday_defaults' in body) {
        const wd = sanitizeWeekdays(body.weekday_defaults);
        if (!wd) {
            return NextResponse.json({ error: 'weekday_defaults must include all seven keys (mon..sun) as booleans' }, { status: 400 });
        }
        update.weekday_defaults = wd;
    }

    if ('booking_window_days' in body) {
        const n = Number(body.booking_window_days);
        if (!Number.isInteger(n) || n < 1 || n > 90) {
            return NextResponse.json({ error: 'booking_window_days must be an integer between 1 and 90' }, { status: 400 });
        }
        update.booking_window_days = n;
    }

    if ('min_lead_time_hours' in body) {
        const n = Number(body.min_lead_time_hours);
        if (!Number.isInteger(n) || n < 0 || n > 168) {
            return NextResponse.json({ error: 'min_lead_time_hours must be an integer between 0 and 168' }, { status: 400 });
        }
        update.min_lead_time_hours = n;
    }

    if (Object.keys(update).length === 1) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    try {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('platform_schedule_settings')
            .update(update)
            .eq('id', 1)
            .select()
            .single();
        if (error) throw error;
        return NextResponse.json({ success: true, settings: data });
    } catch (err) {
        console.error('PATCH /api/admin/platform-schedule error:', err);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
