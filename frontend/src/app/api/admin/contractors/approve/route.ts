/**
 * POST /api/admin/contractors/approve
 * Promotes a pending applicant to role='contractor' + approval_status='approved'.
 * Requires admin authentication (ADMIN_SECRET or Supabase role='admin').
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';

async function verifyAdmin(req: NextRequest): Promise<boolean> {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) return false; // misconfigured — deny all

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '').trim();

    if (token === adminSecret) return true;
    if (!token) return false;

    try {
        const { user, error } = await createAuthClient(token);
        if (error || !user) return false;

        const supabase = createServiceClient();
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        return (profile as { role?: string } | null)?.role === 'admin';
    } catch {
        return false;
    }
}

export async function POST(req: NextRequest) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();
    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
        .from('profiles')
        .update({
            role: 'contractor',
            approval_status: 'approved',
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

    if (error) {
        console.error('Approve contractor error:', error);
        return NextResponse.json({ error: 'Failed to approve contractor' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
