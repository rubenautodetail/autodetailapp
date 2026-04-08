import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/verifyAdmin";

export const dynamic = "force-dynamic";

const PROTECTED_EMAIL = "rubenautodetail@gmail.com";

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Look up the profile to get email and prevent admin deletion
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id, role, email, full_name")
      .eq("id", userId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Also check auth user email
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
    const userEmail = authUser?.email || profile.email || "";

    if (userEmail.toLowerCase() === PROTECTED_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: "Cannot delete the admin account" }, { status: 403 });
    }

    if (profile.role === "admin") {
      return NextResponse.json({ error: "Cannot delete admin users" }, { status: 403 });
    }

    // 1. Delete related bookings (as customer or contractor)
    await supabase.from("bookings").delete().eq("user_id", userId);
    await supabase.from("bookings").update({ contractor_id: null }).eq("contractor_id", userId);

    // 2. Delete vehicles
    await supabase.from("vehicles").delete().eq("user_id", userId);

    // 3. Delete notifications
    await supabase.from("notifications").delete().eq("user_id", userId);

    // 4. Delete profile
    const { error: delProfileErr } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (delProfileErr) {
      console.error("Delete profile error:", delProfileErr);
      return NextResponse.json({ error: "Failed to delete user profile" }, { status: 500 });
    }

    // 5. Delete from Supabase Auth
    const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
    if (authErr) {
      console.error("Delete auth user error:", authErr);
      return NextResponse.json({ error: "Profile deleted but failed to remove auth account" }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: userEmail });
  } catch (err) {
    console.error("Admin delete user error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
