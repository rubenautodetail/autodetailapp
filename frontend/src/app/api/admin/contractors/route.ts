/**
 * GET /api/admin/contractors
 * Returns all contractor profiles and pending applicants.
 * Query params: ?status=all|pending|active|rejected
 * Supports cookie-based auth (admin browser session) and Bearer token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createClient, createServiceClient } from '@/lib/supabase/server';

async function verifyAdmin(req: NextRequest): Promise<boolean> {
    const adminSecret = process.env.ADMIN_SECRET;
    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim();

    if (adminSecret && token === adminSecret) return true;

    // Cookie-based session (admin browsing from the UI)
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        const db = createServiceClient();
        const { data: p } = await db.from('profiles').select('role').eq('id', user.id).single();
        if ((p as { role?: string } | null)?.role === 'admin') return true;
    } catch { /* fall through */ }

    // Bearer JWT fallback
    if (!token) return false;
    try {
        const { user, error } = await createAuthClient(token);
        if (error || !user) return false;
        const db = createServiceClient();
        const { data: p } = await db.from('profiles').select('role').eq('id', user.id).single();
        return (p as { role?: string } | null)?.role === 'admin';
    } catch { return false; }
}

export async function GET(req: NextRequest) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = new URL(req.url).searchParams.get('status') || 'all';
    const supabase = createServiceClient();

    const cols = 'id,full_name,email,phone,role,approval_status,stripe_account_id,onboarding_complete,rating,total_jobs_completed,created_at';

    let query = supabase.from('profiles').select(cols).order('created_at', { ascending: false });

    if (status === 'pending') {
        query = query.eq('approval_status', 'pending');
    } else if (status === 'active') {
        query = query.eq('role', 'contractor').eq('approval_status', 'approved');
    } else if (status === 'rejected') {
        query = query.eq('approval_status', 'rejected');
    } else {
        // All: approved contractors + pending/rejected applicants
        query = query.or("role.eq.contractor,approval_status.in.(pending,rejected)");
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data: data ?? [], total: data?.length ?? 0 });
}
