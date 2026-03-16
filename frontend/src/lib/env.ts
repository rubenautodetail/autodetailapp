/**
 * Startup env var validation.
 * Import this in any server-side module (e.g. health route) to fail fast
 * when required environment variables are missing.
 */

const REQUIRED_SERVER_VARS = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
] as const;

export function validateEnv(): { ok: boolean; missing: string[] } {
    const missing = REQUIRED_SERVER_VARS.filter((key) => !process.env[key]);
    return { ok: missing.length === 0, missing };
}

/** Throws if any required env var is absent. Call once at startup (health route). */
export function assertEnv(): void {
    const { ok, missing } = validateEnv();
    if (!ok) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
