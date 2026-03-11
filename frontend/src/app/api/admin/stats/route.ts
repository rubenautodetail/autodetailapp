import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, createServiceClient } from "@/lib/supabase/server";

/**
 * Verifies the caller is an authenticated admin.
 * When ADMIN_SECRET is not configured (dev mode), all requests are allowed.
 * When ADMIN_SECRET is configured, the caller must either:
 *   (a) Send it as the Bearer token, OR
 *   (b) Be a Supabase user with role='admin'
 */
async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const adminSecret = process.env.ADMIN_SECRET;

  // Dev mode: no secret configured → allow all (mirrors the cron/ZIP pattern)
  if (!adminSecret) return true;

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

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const [{ data: bookings }, { data: profiles }] = await Promise.all([
    supabase.from("bookings").select("status, total_amount"),
    supabase.from("profiles").select("role"),
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

  // Pending = contractors who haven't completed Stripe onboarding yet
  const { data: pendingProfiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "contractor")
    .or("onboarding_complete.is.null,onboarding_complete.eq.false");

  const pendingContractors = pendingProfiles?.length ?? 0;

  return NextResponse.json({
    contractors: {
      total: activeContractors,
      pending: pendingContractors,
      active: activeContractors - pendingContractors,
    },
    bookings: {
      total: totalBookings,
      pending: pendingBookings,
      completed: completedBookings,
    },
    revenue: { total: totalRevenue },
  });
}
