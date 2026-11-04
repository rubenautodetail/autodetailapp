import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, createServiceClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rateLimit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// A role can only be chosen during signup. After this window the account is "old"
// and this endpoint will never change its role (prevents turning existing users into contractors).
const SIGNUP_WINDOW_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  if (await rateLimit(req, { maxRequests: 10, windowMs: 60_000, keyPrefix: "create-profile" })) {
    return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { userId, name, role } = body;

    if (!userId || !name) {
      return NextResponse.json({ error: "Missing userId or name" }, { status: 400 });
    }
    if (typeof userId !== "string" || !UUID_RE.test(userId) || typeof name !== "string" || name.length > 120) {
      return NextResponse.json({ error: "Invalid userId or name" }, { status: 400 });
    }

    // When a Bearer token is present (user has a session), verify it matches the userId.
    // When absent (email-confirmation-required flow), we fall through to the
    // admin.getUserById() check below which prevents abuse.
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "").trim();
    if (token) {
      const { user, error: authError } = await createAuthClient(token);
      if (authError || !user) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
      }
      if (user.id !== userId) {
        return NextResponse.json({ error: "Cannot create profile for another user" }, { status: 403 });
      }
    }

    const supabase = createServiceClient();

    // Verify the userId corresponds to a real auth user (prevents abuse)
    const { data: { user: authUser }, error: lookupErr } = await supabase.auth.admin.getUserById(userId);
    if (lookupErr || !authUser) {
      return NextResponse.json({ error: "Invalid user" }, { status: 403 });
    }

    // The role can only be chosen for a brand-new account (signup in progress).
    // Admin is never assignable here, and old accounts are always treated as plain users.
    const accountAgeMs = Date.now() - new Date(authUser.created_at).getTime();
    const isFreshSignup = Number.isFinite(accountAgeMs) && accountAgeMs < SIGNUP_WINDOW_MS;
    const assignedRole = isFreshSignup && role === "contractor" ? "contractor" : "user";

    // Only insert if profile doesn't exist — the Supabase trigger may have already created it
    const { data: existing } = await supabase.from("profiles").select("id, role").eq("id", userId).single();
    if (existing) {
      // If trigger created it with role='user' but this is a contractor signup, update the role.
      // Only ever upgrades a plain 'user' (never touches admins or existing contractors).
      if (assignedRole === "contractor" && existing.role === "user") {
        await supabase.from("profiles").update({ role: assignedRole, updated_at: new Date().toISOString() }).eq("id", userId);
      }
      return NextResponse.json({ ok: true, message: "Profile already exists" });
    }

    const { error } = await supabase.from("profiles").insert(
      { id: userId, full_name: name, email: authUser.email, role: assignedRole, updated_at: new Date().toISOString() }
    );

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
