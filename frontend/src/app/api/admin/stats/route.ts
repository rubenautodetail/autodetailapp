import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/verifyAdmin";
import { contractorServesZip, zoneForZip } from "@/lib/zones";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
  const supabase = createServiceClient();

  const [bookingsRes, profilesRes] = await Promise.all([
    supabase.from("bookings").select("status, total_amount, payment_status, updated_at, contractor_id, payout_id, zip_code"),
    supabase.from("profiles").select("role, approval_status, is_available, service_zones"),
  ]);

  if (bookingsRes.error) {
    console.error('admin/stats bookings query error:', bookingsRes.error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
  if (profilesRes.error) {
    console.error('admin/stats profiles query error:', profilesRes.error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }

  const bookingList = bookingsRes.data ?? [];
  const profileList = profilesRes.data ?? [];

  const totalBookings = bookingList.length;
  const pendingBookings = bookingList.filter(
    (b) => b.status === "pending" || b.status === "pending_assignment"
  ).length;
  const completedBookings = bookingList.filter(
    (b) => b.status === "completed"
  ).length;

  const VALID_PAYMENT_STATUSES = ["paid", "captured", "partially_refunded"];
  const totalRevenue = bookingList
    .filter((b) => b.status === "completed" && VALID_PAYMENT_STATUSES.includes(b.payment_status ?? ""))
    .reduce((sum, b) => {
      const amt =
        typeof b.total_amount === "string"
          ? parseFloat(b.total_amount)
          : (b.total_amount ?? 0);
      return sum + amt;
    }, 0);

  // Start of the current month in Eastern time (05:00Z winter / 04:00Z summer)
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const yy = Number(parts.find((p) => p.type === "year")?.value);
  const mm = Number(parts.find((p) => p.type === "month")?.value);
  const offsetH = new Date(Date.UTC(yy, mm - 1, 1, 12)).toLocaleString("en-US", { timeZone: "America/New_York", timeZoneName: "short" }).includes("EDT") ? 4 : 5;
  const monthStart = new Date(Date.UTC(yy, mm - 1, 1, offsetH, 0, 0));

  const toAmt = (v: unknown) => (typeof v === "string" ? parseFloat(v) : Number(v ?? 0)) || 0;
  const monthRevenue = bookingList
    .filter((b) => b.status === "completed" && VALID_PAYMENT_STATUSES.includes(b.payment_status ?? "") && b.updated_at && new Date(b.updated_at) >= monthStart)
    .reduce((sum, b) => sum + toAmt(b.total_amount), 0);

  // Completed jobs not yet paid out to a contractor
  const unpaid = bookingList.filter((b) => b.status === "completed" && b.contractor_id && !b.payout_id);
  const unpaidPayouts = new Set(unpaid.map((b) => b.contractor_id)).size;
  const pendingAssignment = bookingList.filter((b) => b.status === "pending_assignment").length;

  // Jobs waiting for a contractor where no approved, available contractor works that zone.
  const activeContractorProfiles = profileList.filter(
    (p) => p.role === "contractor" && p.approval_status === "approved" && p.is_available !== false
  );
  const noZoneCoverage = bookingList.filter(
    (b) =>
      b.status === "pending_assignment" &&
      zoneForZip(b.zip_code) !== null &&
      !activeContractorProfiles.some((p) => contractorServesZip(p.service_zones, b.zip_code))
  ).length;

  const allContractors = profileList.filter((p) => p.role === "contractor").length;
  const activeContractors = profileList.filter(
    (p) => p.role === "contractor" && p.approval_status === "approved"
  ).length;
  const pendingContractors = profileList.filter(
    (p) => p.role === "contractor" && p.approval_status === "pending"
  ).length;

  return NextResponse.json({
    contractors: {
      total: allContractors,
      pending: pendingContractors,
      active: activeContractors,
    },
    bookings: {
      total: totalBookings,
      pending: pendingBookings,
      completed: completedBookings,
    },
    revenue: { total: totalRevenue, month: monthRevenue },
    attention: { pendingAssignment, unpaidPayouts, noZoneCoverage },
  });
  } catch (err) {
    console.error('admin/stats error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
