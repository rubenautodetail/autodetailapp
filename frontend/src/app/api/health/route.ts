/**
 * GET /api/health
 * Liveness + readiness probe with env validation and external service checks.
 * - Vercel uptime monitors, status pages, and load balancers can poll this.
 * - Checks DB and Stripe connectivity.
 * - Never exposes secret values in the response.
 */

import { NextResponse } from 'next/server';
import { validateEnv } from '@/lib/env-check';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CheckStatus {
  status: 'ok' | 'error';
  message?: string;
  latencyMs?: number;
}

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  latencyMs: number;
  checks: {
    env: CheckStatus;
    supabase: CheckStatus;
    stripe: CheckStatus;
  };
  missingEnv?: string[];
}

async function checkSupabase(): Promise<CheckStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { status: 'error', message: 'Supabase credentials not configured' };
  }

  const start = Date.now();
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    const latencyMs = Date.now() - start;
    if (res.ok || res.status === 204) {
      return { status: 'ok', latencyMs };
    }
    return { status: 'error', message: `HTTP ${res.status}`, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : 'Connection failed';
    return { status: 'error', message, latencyMs };
  }
}

async function checkStripe(): Promise<CheckStatus> {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    return { status: 'error', message: 'Stripe secret key not configured' };
  }

  const start = Date.now();
  try {
    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });

    const latencyMs = Date.now() - start;
    if (res.ok) {
      return { status: 'ok', latencyMs };
    }
    return { status: 'error', message: `HTTP ${res.status}`, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : 'Connection failed';
    return { status: 'error', message, latencyMs };
  }
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const overallStart = Date.now();

  // 1. Env validation
  const envResult = validateEnv();
  const envCheck: CheckStatus = envResult.valid
    ? { status: 'ok' }
    : { status: 'error', message: `${envResult.missing.length} required var(s) missing` };

  // 2. External service checks (parallel)
  const [supabaseCheck, stripeCheck] = await Promise.all([
    checkSupabase(),
    checkStripe(),
  ]);

  // 3. Determine overall status
  const checks = { env: envCheck, supabase: supabaseCheck, stripe: stripeCheck };
  const allOk = Object.values(checks).every((c) => c.status === 'ok');
  const envFailed = !envResult.valid;
  const status: HealthResponse['status'] = envFailed ? 'error' : allOk ? 'ok' : 'degraded';

  const isProduction = process.env.NODE_ENV === 'production';

  const response: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - overallStart,
    checks,
    // Never expose specific missing env var names in production
    ...(envResult.missing.length > 0
      ? isProduction
        ? {} // omit missingEnv entirely in production
        : { missingEnv: envResult.missing }
      : {}),
  };

  const httpStatus = status === 'error' ? 503 : 200;
  return NextResponse.json(response, { status: httpStatus });
}
