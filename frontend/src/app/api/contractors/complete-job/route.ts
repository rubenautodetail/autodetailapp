import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createApiClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { user, error: authError } = await createAuthClient(token);
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await req.formData();
        const bookingId = formData.get('bookingId') as string;
        const checklist = formData.get('checklist') as string;

        if (!bookingId) return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });

        const supabase = createApiClient();
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Complete-job API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
