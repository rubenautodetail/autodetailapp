import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/verifyAdmin";

export const dynamic = 'force-dynamic';

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
    (p) => p.role === "contractor" && p.approval_status === "approved"
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
