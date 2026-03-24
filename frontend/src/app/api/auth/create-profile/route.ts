import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "").trim();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, error: authError } = await createAuthClient(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, name, role } = await req.json();

    // Only allow creating a profile for yourself
    if (userId !== user.id) {
      return NextResponse.json({ error: "Cannot create profile for another user" }, { status: 403 });
    }

    if (!userId || !name) {
      return NextResponse.json({ error: "Missing userId or name" }, { status: 400 });
    }

    const assignedRole = role === "contractor" ? "contractor" : "user";

    const supabase = createServiceClient();

    // Only insert if profile doesn't exist — prevent role escalation via upsert
    const { data: existing } = await supabase.from("profiles").select("id").eq("id", userId).single();
    if (existing) {
      return NextResponse.json({ ok: true, message: "Profile already exists" });
    }

    const { error } = await supabase.from("profiles").insert(
      { id: userId, full_name: name, role: assignedRole, updated_at: new Date().toISOString() }
    );

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
