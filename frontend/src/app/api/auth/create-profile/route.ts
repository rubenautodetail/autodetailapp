import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, name, role } = await req.json();

    if (!userId || !name) {
      return NextResponse.json({ error: "Missing userId or name" }, { status: 400 });
    }

    const assignedRole = role === "contractor" ? "contractor" : "user";
    const supabase = createServiceClient();

    // Verify the userId corresponds to a real auth user (prevents abuse)
    const { data: { user: authUser }, error: lookupErr } = await supabase.auth.admin.getUserById(userId);
    if (lookupErr || !authUser) {
      return NextResponse.json({ error: "Invalid user" }, { status: 403 });
    }

    // If caller sent a Bearer token, verify it matches the userId (extra safety)
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "").trim();
    if (token) {
      const { user, error: authError } = await createAuthClient(token);
      if (!authError && user && user.id !== userId) {
        return NextResponse.json({ error: "Cannot create profile for another user" }, { status: 403 });
      }
    }

    // Only insert if profile doesn't exist — the Supabase trigger may have already created it
    const { data: existing } = await supabase.from("profiles").select("id, role").eq("id", userId).single();
    if (existing) {
      // If trigger created it with role='user' but this is a contractor signup, update the role
      if (assignedRole === "contractor" && existing.role !== "contractor") {
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
