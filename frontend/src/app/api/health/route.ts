/**
 * GET /api/health
 * Lightweight liveness + readiness probe.
 * - Vercel uptime monitors, status pages, and load balancers can poll this.
 * - Checks DB connectivity so a cold-start DB issue shows up immediately.
 * - Never returns 500 for non-critical failures (e.g. Stripe not configured)
 *   because that would trigger false-positive alerts.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
// Disable caching so monitors always get a fresh response
export const dynamic = 'force-dynamic';

export async function GET() {
    const start = Date.now();
    const checks: Record<string, 'ok' | 'error'> = {};

    // ── Database connectivity ─────────────────────────────────────────────────
    try {
        const supabase = createServiceClient();
        // Lightweight query — count row from a small table
        const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
        checks.database = error ? 'error' : 'ok';
    } catch {
        checks.database = 'error';
    }

    // ── Env var presence (not values — never expose secrets) ─────────────────
    checks.stripe    = process.env.STRIPE_SECRET_KEY    ? 'ok' : 'error';
    checks.resend    = process.env.RESEND_API_KEY        ? 'ok' : 'error';
    checks.supabase  = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'ok' : 'error';

    const allOk = Object.values(checks).every((v) => v === 'ok');
    const latencyMs = Date.now() - start;

    return NextResponse.json(
        {
            status: allOk ? 'ok' : 'degraded',
            checks,
            latencyMs,
            timestamp: new Date().toISOString(),
        },
        { status: allOk ? 200 : 503 }
    );
}
