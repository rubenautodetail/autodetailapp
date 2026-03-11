import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Lightweight Supabase client for Next.js API routes.
 * Does NOT require cookies — use this for data queries in Route Handlers.
 */
export function createApiClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

/**
 * Supabase client using the service role key.
 * Bypasses RLS — use only in admin server-side routes.
 * Throws at startup if SUPABASE_SERVICE_ROLE_KEY is not configured.
 */
export function createServiceClient() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. This is required for admin operations.');
    }
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey
    )
}

/**
 * Supabase client that can validate user Bearer tokens in API routes.
 * Uses the service role key if available (needed for auth.getUser() to work).
 * Falls back to anon key for read-only operations.
 *
 * Usage:
 *   const { supabase, user, error } = await createAuthClient(token);
 */
export async function createAuthClient(token: string) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        key,
        {
            global: {
                headers: { Authorization: `Bearer ${token}` },
            },
        }
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);
    return { supabase, user, error };
}

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
