/**
 * POST /api/contractors/deactivate
 * Allows a contractor to voluntarily leave the platform.
 * Sets approval_status='rejected', role='user', is_available=false.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';

async function resolveUser(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '').trim();
    if (!token) return null;
    const { user, error } = await createAuthClient(token);
    if (error || !user) return null;
    return user;
}

export async function POST(req: NextRequest) {
    try {
        const user = await resolveUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServiceClient();

        // Verify they are an active contractor
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, approval_status')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'contractor' || profile?.approval_status !== 'approved') {
            return NextResponse.json({ error: 'Not an active contractor' }, { status: 400 });
        }

        // Check for active bookings
        const { data: activeBookings } = await supabase
            .from('bookings')
            .select('id')
            .eq('contractor_id', user.id)
            .in('status', ['confirmed', 'in_progress'])
            .limit(1);

        if (activeBookings && activeBookings.length > 0) {
            return NextResponse.json(
                { error: 'Cannot deactivate with active bookings. Complete or cancel them first.' },
                { status: 409 }
            );
        }

        // Deactivate: revert to regular user
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                role: 'user',
                approval_status: 'rejected',
                is_available: false,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Deactivate contractor error:', updateError);
            return NextResponse.json({ error: 'Failed to deactivate account' }, { status: 500 });
        }

        // Notify contractor
        try {
            await supabase.from('notifications').insert({
                user_id: user.id,
                title: 'Account Deactivated',
                message: 'Your contractor account has been deactivated. Contact support if you want to reactivate.',
                type: 'info',
            });
        } catch {
            // Non-critical — don't fail the deactivation
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('POST /api/contractors/deactivate error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
