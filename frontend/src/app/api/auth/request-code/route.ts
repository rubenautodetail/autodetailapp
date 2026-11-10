/**
 * POST /api/auth/request-code
 * Sends a 6-digit sign-in code to the customer's email (Supabase email OTP).
 * Used at the end of booking step 4 so a visitor can create their account
 * without a password. A new account is created automatically if the email is new.
 *
 * Public on purpose (no session yet), so it is rate limited per IP and per email.
 * The response never reveals whether the email already had an account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { createClient } from '@/lib/supabase/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
    // Per IP: at most 10 code requests per hour.
    if (await rateLimit(req, { maxRequests: 10, windowMs: 60 * 60_000, keyPrefix: 'request-code-ip' })) {
        return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    let body: { email?: unknown; name?: unknown };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!email || email.length > 254 || !EMAIL_RE.test(email) || !name || name.length > 120) {
        return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    // Per email: at most 5 codes per hour, no matter which IP asks. The limiter keys on
    // the "client id" it is given, so we pass the email in that slot.
    const emailKey = { headers: { get: (n: string) => (n.toLowerCase() === 'x-forwarded-for' ? email : null) } };
    if (await rateLimit(emailKey, { maxRequests: 5, windowMs: 60 * 60_000, keyPrefix: 'request-code-email' })) {
        return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
                // Only applied when the account is new.
                data: { full_name: name },
            },
        });

        if (error) {
            if (error.status === 429) {
                return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
            }
            console.error('request-code: signInWithOtp failed', error.status, error.code);
            return NextResponse.json({ error: 'send_failed' }, { status: 502 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('request-code: unexpected error', err instanceof Error ? err.message : err);
        return NextResponse.json({ error: 'send_failed' }, { status: 500 });
    }
}
