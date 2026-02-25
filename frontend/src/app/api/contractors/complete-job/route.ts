/**
 * POST /api/contractors/complete-job
 * Marks a booking as completed. Accepts multipart/form-data with optional photos.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        const supabase = getSupabase();

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse form data
        const formData = await req.formData();
        const bookingId = formData.get('bookingId') as string;
        const checklist = formData.get('checklist') as string;

        if (!bookingId) {
            return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
        }

        // Update booking status to completed
        const { error } = await supabase
            .from('bookings')
            .update({
                status: 'completed',
                updated_at: new Date().toISOString(),
                ...(checklist ? { completion_notes: checklist } : {}),
            })
            .eq('id', bookingId)
            .eq('contractor_id', user.id);

        if (error) {
            console.error('Error completing job:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // TODO: Handle photo uploads to Supabase Storage if needed

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Complete-job API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
