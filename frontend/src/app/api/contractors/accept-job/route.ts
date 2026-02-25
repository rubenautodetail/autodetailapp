import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createApiClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { user, error: authError } = await createAuthClient(token);
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { bookingId } = await req.json();
        if (!bookingId) return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });

        const supabase = createApiClient();
        const { error } = await supabase
            .from('bookings')
            .update({
                status: 'confirmed',
                contractor_id: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', bookingId);

        if (error) {
            console.error('Error accepting job:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Accept-job API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
