/**
 * Rate limiter for Next.js API routes.
 *
 * Production (Vercel + Upstash):
 *   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your env.
 *   Rate limits are enforced globally across all serverless instances.
 *
 * Development (no Redis configured):
 *   Falls back to an in-memory Map. Sufficient for local dev — not distributed.
 *
 * Usage:
 *   const limited = await rateLimit(req, { maxRequests: 5, windowMs: 60_000 });
 *   if (limited) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 */

import type { NextRequest } from 'next/server';

// ── In-memory fallback (dev only) ────────────────────────────────────────────

interface MemEntry { count: number; resetAt: number }
const memStore = new Map<string, MemEntry>();

setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memStore.entries()) {
        if (v.resetAt <= now) memStore.delete(k);
    }
}, 5 * 60 * 1000);

function memRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = memStore.get(key);
    if (!entry || entry.resetAt <= now) {
        memStore.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }
    entry.count++;
    return entry.count > maxRequests;
}

// ── Upstash Redis rate limiter (production) ───────────────────────────────────

let upstashLimiterCache: Map<string, import('@upstash/ratelimit').Ratelimit> | null = null;

async function getUpstashLimiter(
    keyPrefix: string,
    maxRequests: number,
    windowMs: number
): Promise<import('@upstash/ratelimit').Ratelimit | null> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;

    try {
        if (!upstashLimiterCache) upstashLimiterCache = new Map();

        const cacheKey = `${keyPrefix}:${maxRequests}:${windowMs}`;
        if (upstashLimiterCache.has(cacheKey)) {
            return upstashLimiterCache.get(cacheKey)!;
        }

        const { Ratelimit } = await import('@upstash/ratelimit');
        const { Redis } = await import('@upstash/redis');

        const redis = new Redis({ url, token });
        const windowSec = Math.ceil(windowMs / 1000);

        const limiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
            prefix: `rl:${keyPrefix}`,
        });

        upstashLimiterCache.set(cacheKey, limiter);
        return limiter;
    } catch (err) {
        console.warn('Upstash rate limiter init failed, using in-memory fallback:', err);
        return null;
    }
}

// ── Public interface ──────────────────────────────────────────────────────────

function getClientIp(req: NextRequest | { headers: { get(name: string): string | null } }): string {
    return (
        ('headers' in req && typeof req.headers.get === 'function'
            ? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
              req.headers.get('x-real-ip')
            : null) ?? 'unknown'
    );
}

export async function rateLimit(
    req: NextRequest | { headers: { get(name: string): string | null } },
    options: { maxRequests?: number; windowMs?: number; keyPrefix?: string; identifier?: string } = {}
): Promise<boolean> {
    const { maxRequests = 10, windowMs = 60_000, keyPrefix = 'rl', identifier } = options;
    const ip = getClientIp(req);
    const rateLimitKey = identifier ? `${ip}:${identifier}` : ip;
    const key = `${keyPrefix}:${rateLimitKey}`;

    // Try Upstash first (production)
    const upstash = await getUpstashLimiter(keyPrefix, maxRequests, windowMs);
    if (upstash) {
        try {
            const { success } = await upstash.limit(rateLimitKey);
            return !success; // true = rate limited
        } catch (err) {
            console.warn('Upstash rate limit check failed, falling back to in-memory:', err);
        }
    }

    // Fallback: in-memory (dev or Upstash unavailable)
    return memRateLimit(key, maxRequests, windowMs);
}
