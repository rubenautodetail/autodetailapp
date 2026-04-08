import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Dev-only: never runs in production
export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }

    try {
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const { userId, role } = body;

        if (!userId || !['user', 'contractor', 'admin'].includes(role)) {
            return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
        }

        const supabase = createServiceClient();
        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('dev/switch-role error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
