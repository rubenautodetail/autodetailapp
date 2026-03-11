/**
 * Simple in-memory rate limiter for Next.js API routes.
 * For production with multiple instances, replace with Upstash Redis:
 *   https://upstash.com/docs/redis/sdks/ratelimit
 *
 * Usage:
 *   const limited = rateLimit(req, { maxRequests: 5, windowMs: 60_000 });
 *   if (limited) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// Global store (persists across requests within same server process)
const store = new Map<string, RateLimitEntry>();

// Prune expired entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt <= now) store.delete(key);
    }
}, 5 * 60 * 1000);

export function rateLimit(
    req: { headers: { get(name: string): string | null } },
    options: { maxRequests?: number; windowMs?: number; keyPrefix?: string } = {}
): boolean {
    const { maxRequests = 10, windowMs = 60_000, keyPrefix = 'rl' } = options;

    const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';

    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return false; // Not limited
    }

    entry.count++;

    if (entry.count > maxRequests) {
        return true; // Rate limited
    }

    return false; // Not limited
}
