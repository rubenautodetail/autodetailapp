import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, createServiceClient } from "@/lib/supabase/server";

const VALID_ROLES = ["user", "contractor", "admin"] as const;
type Role = (typeof VALID_ROLES)[number];

/**
 * Verifies the caller is an authenticated admin.
 * When ADMIN_SECRET is not configured (dev mode), all requests are allowed.
 */
async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return true; // dev mode — no secret configured

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  if (token === adminSecret) return true;

  if (!token) return false;

  try {
    const { user, error } = await createAuthClient(token);
    if (error || !user) return false;

    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return (profile as any)?.role === "admin";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, role } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (!VALID_ROLES.includes(role as Role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Service client bypasses RLS so we can update any user's profile
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update role error:", err);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
