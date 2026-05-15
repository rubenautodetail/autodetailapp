/**
 * PATCH /api/admin/contractors/[id]/verify-skills
 * Admin-only endpoint to approve or clear a contractor's verified service types.
 *
 * Body: { verified_service_type_ids: number[] }
 *   - Pass the approved subset of the contractor's selected service IDs.
 *   - Pass [] to clear all verified skills (e.g., after a dispute).
 *
 * Side-effects:
 *   - Sets `verified_service_type_ids` on the profile.
 *   - Clears `skills_pending_review` flag.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/verifyAdmin';

export const dynamic = 'force-dynamic';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    let body: { verified_service_type_ids: number[] };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { verified_service_type_ids } = body;

    if (!Array.isArray(verified_service_type_ids) || verified_service_type_ids.some((v) => typeof v !== 'number')) {
        return NextResponse.json(
            { error: 'verified_service_type_ids must be an array of numbers' },
            { status: 400 }
        );
    }

    try {
        const supabase = createServiceClient();

        // Confirm contractor exists before updating
        const { data: profile, error: fetchErr } = await supabase
            .from('profiles')
            .select('id, full_name, service_type_ids')
            .eq('id', id)
            .single();

        if (fetchErr || !profile) {
            return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
        }

        const { data: updated, error: updateErr } = await supabase
            .from('profiles')
            .update({
                verified_service_type_ids,
                skills_pending_review: false,
            })
            .eq('id', id)
            .select('id, full_name, service_type_ids, verified_service_type_ids, skills_pending_review')
            .single();

        if (updateErr) {
            console.error('verify-skills PATCH db error:', updateErr);
            return NextResponse.json({ error: 'Failed to update verified skills' }, { status: 500 });
        }

        console.log(
            `[admin/verify-skills] contractor=${id} verified=[${verified_service_type_ids.join(', ')}]`
        );

        return NextResponse.json({ success: true, profile: updated });
    } catch (err) {
        console.error('PATCH /api/admin/contractors/[id]/verify-skills error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
