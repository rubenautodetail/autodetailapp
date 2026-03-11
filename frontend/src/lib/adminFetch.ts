/**
 * Authenticated fetch wrapper for admin API routes.
 * Automatically attaches the current Supabase session token as Bearer.
 * Use this instead of raw fetch() in all admin client components.
 */
import { createClient } from "@/lib/supabase/client";

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
  });
}
