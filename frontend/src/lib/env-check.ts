/**
 * Environment variable validation for Rubens Auto Detail Platform.
 * Call validateEnv() at startup to detect missing or malformed config.
 */

interface EnvCheckResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

interface EnvVarDef {
  name: string;
  required: boolean;
  validator?: (value: string) => string | null; // returns warning string or null
}

// ── Format validators ──────────────────────────────────────────────

function isUrl(val: string): string | null {
  try {
    new URL(val);
    return null;
  } catch {
    return `is not a valid URL`;
  }
}

function startsWith(prefix: string) {
  return (val: string): string | null =>
    val.startsWith(prefix) ? null : `should start with "${prefix}"`;
}

function isNumeric(val: string): string | null {
  return Number.isFinite(Number(val)) ? null : `should be a number`;
}

function isCommaSeparated(val: string): string | null {
  return /^[\w,-]+$/.test(val) ? null : `should be comma-separated values`;
}

// ── Variable definitions ───────────────────────────────────────────

const ENV_VARS: EnvVarDef[] = [
  // Supabase (required)
  { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true, validator: isUrl },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', required: true },

  // Stripe (required)
  { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', required: true, validator: startsWith('pk_') },
  { name: 'STRIPE_SECRET_KEY', required: true, validator: startsWith('sk_') },
  { name: 'STRIPE_WEBHOOK_SECRET', required: true, validator: startsWith('whsec_') },

  // Payments (optional, has default)
  { name: 'PLATFORM_FEE_PERCENTAGE', required: false, validator: isNumeric },

  // Maps (required - core to booking flow)
  { name: 'NEXT_PUBLIC_MAPBOX_TOKEN', required: true },

  // Maps server-side (optional)
  { name: 'MAPBOX_SECRET_TOKEN', required: false },
  { name: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', required: false },

  // Email (required for notifications)
  { name: 'RESEND_API_KEY', required: true, validator: startsWith('re_') },

  // Email display (optional, have defaults)
  { name: 'FROM_EMAIL', required: false },
  { name: 'SUPPORT_EMAIL', required: false },
  { name: 'SUPPORT_PHONE', required: false },

  // App URL (required for callbacks, emails, redirects)
  { name: 'NEXT_PUBLIC_APP_URL', required: true, validator: isUrl },

  // Site URL (optional, falls back to APP_URL)
  { name: 'NEXT_PUBLIC_SITE_URL', required: false, validator: isUrl },

  // Security secrets (required)
  { name: 'ADMIN_SECRET', required: true },
  { name: 'CRON_SECRET', required: true },

  // HyGraph CMS (optional - landing page content)
  { name: 'HYGRAPH_ENDPOINT', required: false, validator: isUrl },
  { name: 'NEXT_PUBLIC_HYGRAPH_ENDPOINT', required: false, validator: isUrl },
  { name: 'HYGRAPH_TOKEN', required: false },

  // Service area (optional - empty = accept all ZIPs)
  { name: 'SERVICE_ZIP_CODES', required: false, validator: isCommaSeparated },

  // Auth webhook (optional)
  { name: 'SUPABASE_WEBHOOK_SECRET', required: false },
  { name: 'SUPABASE_ACCESS_TOKEN', required: false },

  // Rate limiting - Upstash (optional, falls back to in-memory)
  { name: 'UPSTASH_REDIS_REST_URL', required: false, validator: isUrl },
  { name: 'UPSTASH_REDIS_REST_TOKEN', required: false },

  // Error tracking (optional)
  { name: 'NEXT_PUBLIC_SENTRY_DSN', required: false },
  { name: 'SENTRY_AUTH_TOKEN', required: false },

  // Locale (optional)
  { name: 'NEXT_PUBLIC_DEFAULT_LANG', required: false },

  // Support (optional)
  { name: 'NEXT_PUBLIC_SUPPORT_PHONE', required: false },
];

// ── Main validation ────────────────────────────────────────────────

export function validateEnv(): EnvCheckResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const def of ENV_VARS) {
    const value = process.env[def.name];

    if (!value || value.trim() === '') {
      if (def.required) {
        missing.push(def.name);
      } else {
        warnings.push(`${def.name} is not set (optional)`);
      }
      continue;
    }

    // Run format validator if present
    if (def.validator) {
      const issue = def.validator(value);
      if (issue) {
        warnings.push(`${def.name} ${issue} (current: "${value.slice(0, 12)}...")`);
      }
    }
  }

  // Cross-checks
  if (process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_TOKEN) {
    warnings.push('UPSTASH_REDIS_REST_URL is set but UPSTASH_REDIS_REST_TOKEN is missing');
  }
  if (!process.env.UPSTASH_REDIS_REST_URL && process.env.NODE_ENV === 'production') {
    warnings.push('No Upstash Redis configured; rate limiting will use in-memory store (not safe for multi-instance)');
  }
  if (!process.env.HYGRAPH_ENDPOINT && !process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT) {
    warnings.push('No HyGraph endpoint configured; CMS content will be unavailable');
  }

  const valid = missing.length === 0;
  return { valid, missing, warnings };
}

// ── Startup logger ─────────────────────────────────────────────────

export function logEnvValidation(): EnvCheckResult {
  const result = validateEnv();

  if (result.valid && result.warnings.length === 0) {
    console.log('[env-check] All required environment variables are set.');
  } else {
    if (!result.valid) {
      console.error('[env-check] MISSING required environment variables:');
      result.missing.forEach((name) => console.error(`  - ${name}`));
    }
    if (result.warnings.length > 0) {
      console.warn('[env-check] Warnings:');
      result.warnings.forEach((w) => console.warn(`  - ${w}`));
    }
  }

  return result;
}
