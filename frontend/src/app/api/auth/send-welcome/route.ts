/**
 * POST /api/auth/send-welcome
 * Sends a welcome email immediately after a new user registers.
 * Called client-side from AuthContext.register() right after supabase.auth.signUp().
 */

import { NextRequest, NextResponse } from 'next/server';
import { notify } from '@/lib/notifications';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
    // Rate-limit: max 3 welcome emails per IP per minute (prevent abuse)
    if (await rateLimit(req, { maxRequests: 3, windowMs: 60_000, keyPrefix: 'send-welcome' })) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    try {
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const { name, email, userId } = body;

        if (!email || !name) {
            return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
        }

        await notify({
            type: 'user.welcome',
            user: { id: userId, name, email },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending welcome email:', error);
        // Don't expose error details — just log and return 200 so registration doesn't break
        return NextResponse.json({ success: false });
    }
}
