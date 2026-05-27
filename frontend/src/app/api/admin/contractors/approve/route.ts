/**
 * POST /api/admin/contractors/approve
 * Promotes a pending applicant to role='contractor' + approval_status='approved'.
 * Requires admin authentication (ADMIN_SECRET or Supabase role='admin').
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/verifyAdmin';
import { sendContractorApprovedEmail } from '@/lib/email';

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

        // Auto-verify declared skills on approval so new contractors start receiving
        // skill-filtered notifications immediately. Admin can narrow the set later
        // via /api/admin/contractors/[id]/verify-skills.
        const { data: current } = await supabase
            .from('profiles')
            .select('service_type_ids')
            .eq('id', userId)
            .single();

        const { error } = await supabase
            .from('profiles')
            .update({
                role: 'contractor',
                approval_status: 'approved',
                verified_service_type_ids: current?.service_type_ids ?? [],
                skills_pending_review: false,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (error) {
            console.error('Approve contractor error:', error);
            return NextResponse.json({ error: 'Failed to approve contractor' }, { status: 500 });
        }

        // Send approval email with login link + in-app notification
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', userId)
                .single();

            if (profile?.email) {
                await sendContractorApprovedEmail({
                    fullName: profile.full_name || 'Contractor',
                    email: profile.email,
                });
            }

            // In-app notification for the contractor (locale-neutral link — middleware handles redirect)
            await supabase.from('notifications').insert({
                user_id: userId,
                title: 'Application Approved',
                message: 'Congratulations! Your contractor application has been approved. You can now accept jobs.',
                type: 'success',
                link: '/contractor/dashboard',
            });
        } catch (emailErr) {
            // Don't fail the approval if email/notification fails
            console.error('Failed to send approval email or notification:', emailErr);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Approve contractor unexpected error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
