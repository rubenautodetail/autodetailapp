import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/verifyAdmin";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
  const db = createServiceClient();

  const { data: bookings, error } = await db
    .from("bookings")
    .select("*")
    .eq("status", "completed")
    .not("contractor_id", "is", null)
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bList = (bookings ?? []) as Array<Record<string, unknown>>;

  if (bList.length === 0) {
    return NextResponse.json({ jobs: [], contractors: [] });
  }

  const contractorIds = [...new Set(bList.map((b) => b.contractor_id as string).filter(Boolean))];

  const { data: profiles } = await db
    .from("profiles")
    .select("id, full_name, phone_number")
    .in("id", contractorIds);

  const profileMap: Record<string, { name: string; phone: string }> = {};
  (profiles ?? []).forEach((p) => {
    const pp = p as Record<string, unknown>;
    profileMap[pp.id as string] = {
      name: (pp.full_name as string) ?? "Unknown",
      phone: (pp.phone_number as string) ?? "—",
    };
  });

  const jobs = bList.map((b) => {
    const contractorId = b.contractor_id as string;
    const profile = profileMap[contractorId] ?? { name: "Unknown", phone: "—" };
    return {
      bookingId: b.id as number,
      contractorId,
      contractorName: profile.name,
      contractorPhone: profile.phone,
      serviceName: (b.service_name as string) ?? "—",
      scheduledDate: (b.date as string) ?? "",
      totalAmount: b.total_amount ? parseFloat(String(b.total_amount)) : 0,
      paymentStatus: (b.payment_status as string) ?? "—",
      confirmationCode: (b.confirmation_code as string) ?? "",
    };
  });

  return NextResponse.json({ jobs });
  } catch (err) {
    console.error('admin/payments/list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
