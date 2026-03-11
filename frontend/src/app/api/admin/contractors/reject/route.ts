/**
 * POST /api/admin/contractors/reject
 * Sets approval_status='rejected' on a pending contractor applicant.
 * Role reverts to 'user' to remove any contractor access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';

async function verifyAdmin(req: NextRequest): Promise<boolean> {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) return false;

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
            role: 'user',
            approval_status: 'rejected',
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

    if (error) {
        console.error('Reject contractor error:', error);
        return NextResponse.json({ error: 'Failed to reject application' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
