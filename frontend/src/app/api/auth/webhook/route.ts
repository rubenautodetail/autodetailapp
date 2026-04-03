/**
 * POST /api/auth/webhook
 * Supabase Auth Hook — fires after a new user is created.
 * Sends welcome email via the notification system.
 * Uses Standard Webhooks signature verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { notify } from '@/lib/notifications';
import crypto from 'crypto';

function verifyStandardWebhook(payload: string, headers: Headers, secret: string): boolean {
    try {
        // Standard Webhooks format: "v1,whsec_<base64>"
        const parts = secret.split(',');
        const base64Secret = parts[parts.length - 1].replace('whsec_', '');
        const secretBytes = Buffer.from(base64Secret, 'base64');

        const msgId = headers.get('webhook-id') || '';
        const timestamp = headers.get('webhook-timestamp') || '';
        const signature = headers.get('webhook-signature') || '';

        if (!msgId || !timestamp || !signature) return false;

        const toSign = `${msgId}.${timestamp}.${payload}`;
        const expected = crypto
            .createHmac('sha256', secretBytes)
            .update(toSign)
            .digest('base64');

        // Signature header can have multiple sigs: "v1,<sig1> v1,<sig2>"
        const sigs = signature.split(' ');
        return sigs.some(s => {
            const sigValue = s.replace('v1,', '');
            return crypto.timingSafeEqual(
                Buffer.from(expected),
                Buffer.from(sigValue)
            );
        });
    } catch {
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('SUPABASE_WEBHOOK_SECRET not configured');
            return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
        }

        // Verify Standard Webhooks signature
        if (!verifyStandardWebhook(rawBody, req.headers, webhookSecret)) {
            console.error('Auth webhook signature verification failed');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);

        // Supabase Auth Hook format: { user: { id, email, raw_user_meta_data, ... } }
        const user = payload.user || payload.record;

        if (user?.email) {
            const name = user.raw_user_meta_data?.full_name
                || user.raw_user_meta_data?.name
                || user.email.split('@')[0];

            await notify({
                type: 'user.welcome',
                user: {
                    id: user.id,
                    name,
                    email: user.email,
                }
            });
        }

        // Auth hooks require this response format
        return NextResponse.json({ decision: 'continue' });
    } catch (error) {
        console.error('Auth webhook error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
