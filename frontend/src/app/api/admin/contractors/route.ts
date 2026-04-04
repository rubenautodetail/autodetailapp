/**
 * GET /api/admin/contractors
 * Returns all contractor profiles and pending applicants.
 * Query params: ?status=all|pending|active|rejected
 * Supports cookie-based auth (admin browser session) and Bearer token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/verifyAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const status = new URL(req.url).searchParams.get('status') || 'all';
        const supabase = createServiceClient();

        const cols = 'id,full_name,email,phone,role,approval_status,stripe_account_id,onboarding_complete,rating,total_jobs_completed,created_at,address,business_name,service_area_zips,payment_preference,zelle_contact,bank_name,bank_account_number,bank_routing_number,bank_account_type,availability,is_available';

        let query = supabase.from('profiles').select(cols).order('created_at', { ascending: false });

        if (status === 'pending') {
            query = query.eq('approval_status', 'pending');
        } else if (status === 'active') {
            query = query.eq('role', 'contractor').eq('approval_status', 'approved');
        } else if (status === 'rejected') {
            query = query.eq('approval_status', 'rejected');
        } else {
            // All: any profile that is a contractor OR has a pending/rejected application
            query = query.or("role.eq.contractor,approval_status.in.(pending,rejected)");
        }

        const { data, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ data: data ?? [], total: data?.length ?? 0 });
    } catch (err) {
        console.error('admin/contractors list error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
