import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, createClient, createServiceClient } from "@/lib/supabase/server";

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const adminSecret = process.env.ADMIN_SECRET;

  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();

  if (adminSecret && token === adminSecret) return true;

  // Cookie-based session (admin browsing from UI)
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const db = createServiceClient();
      const { data: p } = await db.from("profiles").select("role").eq("id", user.id).single();
      if ((p as { role?: string } | null)?.role === "admin") return true;
    }
  } catch (e) { console.error("Admin check error:", e); }
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

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const [{ data: bookings }, { data: profiles }] = await Promise.all([
    supabase.from("bookings").select("status, total_amount"),
    supabase.from("profiles").select("role, approval_status"),
  ]);

  const bookingList = bookings ?? [];
  const profileList = profiles ?? [];

  const totalBookings = bookingList.length;
  const pendingBookings = bookingList.filter(
    (b) => b.status === "pending" || b.status === "pending_assignment"
  ).length;
  const completedBookings = bookingList.filter(
    (b) => b.status === "completed"
  ).length;

  const totalRevenue = bookingList
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => {
      const amt =
        typeof b.total_amount === "string"
          ? parseFloat(b.total_amount)
          : (b.total_amount ?? 0);
      return sum + amt;
    }, 0);

  const activeContractors = profileList.filter(
    (p) => p.role === "contractor"
  ).length;

  // Pending = applicants waiting for admin approval
  const { data: pendingProfiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("approval_status", "pending");

  const pendingContractors = pendingProfiles?.length ?? 0;

  return NextResponse.json({
    contractors: {
      total: activeContractors,
      pending: pendingContractors,
      active: activeContractors,
    },
    bookings: {
      total: totalBookings,
      pending: pendingBookings,
      completed: completedBookings,
    },
    revenue: { total: totalRevenue },
  });
}
