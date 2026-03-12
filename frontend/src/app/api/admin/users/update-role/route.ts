import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/verifyAdmin";

export const dynamic = 'force-dynamic';

const VALID_ROLES = ["user", "contractor", "admin"] as const;
type Role = (typeof VALID_ROLES)[number];

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
