/**
 * GET /api/contractors/incoming-count
 * Lightweight check used by the dashboard's background refresh: only the NUMBER of open
 * jobs in this contractor's zones. No maps, earnings or customer data.
 * Requires an approved contractor session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';
import { contractorServesZip } from '@/lib/zones';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const { user, error: authError } = await createAuthClient(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const supabase = createServiceClient();
        const { data: profile } = await supabase
            .from('profiles')
            .select('approval_status, service_zones')
            .eq('id', user.id)
            .single();
        if (profile?.approval_status !== 'approved') {
            return NextResponse.json({ error: 'Contractor account pending approval' }, { status: 403 });
        }

        const { data: open } = await supabase
            .from('bookings')
            .select('zip_code')
            .eq('status', 'pending_assignment')
            .eq('payment_status', 'authorized');

        const count = (open ?? []).filter((b) => contractorServesZip(profile?.service_zones, b.zip_code)).length;
        return NextResponse.json({ count });
    } catch (error) {
        console.error('incoming-count error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
