/**
 * POST /api/auth/webhook
 * Receives webhooks from Supabase Database (e.g., when a user is inserted into auth.users)
 * and triggers notification services.
 */

import { NextRequest, NextResponse } from 'next/server';
import { notify } from '@/lib/notifications';

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        // Verify webhook secret — reject spoofed events (fail-closed: deny if secret not configured)
        const secret = req.headers.get('x-webhook-secret');
        if (!process.env.SUPABASE_WEBHOOK_SECRET) {
            console.error('SUPABASE_WEBHOOK_SECRET not configured — rejecting webhook');
            return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
        }
        if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (payload.type === 'INSERT' && payload.table === 'users' && payload.schema === 'auth') {
            const record = payload.record;

            if (record && record.email) {
                // Determine user's name
                // Supabase typically stores metadata in raw_user_meta_data
                const name = record.raw_user_meta_data?.full_name
                    || record.raw_user_meta_data?.name
                    || record.email.split('@')[0];

                await notify({
                    type: 'user.welcome',
                    user: {
                        id: record.id,
                        name: name,
                        email: record.email,
                    }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Auth webhook error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
