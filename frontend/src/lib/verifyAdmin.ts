/**
 * Shared admin authentication verifier for API route handlers.
 *
 * Auth order:
 *  1. Bearer token === ADMIN_SECRET (server-to-server calls)
 *  2. Cookie-based Supabase session (browser UI navigation)
 *  3. Bearer JWT issued by Supabase (client-side adminFetch calls)
 */
import { type NextRequest } from "next/server";
import { createAuthClient, createClient, createServiceClient } from "@/lib/supabase/server";

export async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const adminSecret = process.env.ADMIN_SECRET;
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();

  // 1. ADMIN_SECRET shortcut (server-to-server or manual calls)
  if (adminSecret && token === adminSecret) return true;

  // 2. Cookie-based session (browser navigating the admin UI)
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const db = createServiceClient();
      const { data: p } = await db.from("profiles").select("role").eq("id", user.id).single();
      if ((p as { role?: string } | null)?.role === "admin") return true;
    }
  } catch { /* fall through */ }

  // 3. Bearer JWT (adminFetch sends the user's Supabase access token)
  if (!token) return false;
  try {
    const { user, error } = await createAuthClient(token);
    if (error || !user) return false;
    const db = createServiceClient();
    const { data: p } = await db.from("profiles").select("role").eq("id", user.id).single();
    return (p as { role?: string } | null)?.role === "admin";
  } catch { return false; }
}
