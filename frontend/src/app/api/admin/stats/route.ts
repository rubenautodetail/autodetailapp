import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createApiClient();

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

  return NextResponse.json({
    contractors: { total: activeContractors, pending: 0, active: activeContractors },
    bookings: {
      total: totalBookings,
      pending: pendingBookings,
      completed: completedBookings,
    },
    revenue: { total: totalRevenue },
  });
}
