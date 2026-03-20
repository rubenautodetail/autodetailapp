/**
 * POST /api/admin/contractors/reject
 * Sets approval_status='rejected' on a pending contractor applicant.
 * Role reverts to 'user' to remove any contractor access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/verifyAdmin';
import { sendContractorRejectedEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId: string;
    try {
        ({ userId } = await req.json());
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    try {
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

        // Send rejection email
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', userId)
                .single();

            if (profile?.email) {
                await sendContractorRejectedEmail({
                    fullName: profile.full_name || 'Applicant',
                    email: profile.email,
                });
            }
        } catch (emailErr) {
            // Don't fail the rejection if email fails
            console.error('Failed to send rejection email:', emailErr);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Reject contractor unexpected error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
