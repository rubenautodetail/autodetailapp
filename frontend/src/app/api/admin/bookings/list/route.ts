import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/verifyAdmin";
import { createServiceClient } from "@/lib/supabase/server";

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") || "active";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const db = createServiceClient();

  const ACTIVE_STATUSES = ["pending_payment", "pending_assignment", "en_route", "confirmed", "in_progress", "pending_approval"];
  const ARCHIVE_STATUSES = ["cancelled"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = db
    .from("bookings")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status === "active") {
    query = query.in("status", ACTIVE_STATUSES);
  } else if (status === "archive") {
    query = query.in("status", ARCHIVE_STATUSES);
  } else if (status !== "all") {
    query = query.eq("status", status);
  }

  let data, count, error;
  try {
    ({ data, count, error } = await query);
  } catch (err) {
    console.error('admin/bookings/list: query threw:', err);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Batch-fetch contractor names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contractorIds = [...new Set((data ?? []).map((b: any) => b.contractor_id).filter(Boolean))] as string[];
  let nameMap: Record<string, string> = {};

  if (contractorIds.length > 0) {
    try {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, full_name")
        .in("id", contractorIds);

      (profiles ?? []).forEach((p) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pp = p as any;
        nameMap[pp.id] = pp.full_name ?? "—";
      });
    } catch {
      // Non-fatal — proceed without contractor names
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookings = (data ?? []).map((b: any) => ({
    id: b.id,
    customerName: b.customer_name ?? null,
    customerEmail: b.customer_email ?? null,
    status: b.status ?? "pending",
    total: b.total_amount != null ? parseFloat(String(b.total_amount)) : null,
    scheduledDate: b.date ?? null,
    timeWindow: b.time_window ?? null,
    createdAt: b.created_at,
    serviceName: b.service_name ?? null,
    zipCode: b.zip_code ?? null,
    contractorId: b.contractor_id ?? null,
    contractorName: b.contractor_id ? (nameMap[b.contractor_id] ?? "—") : null,
    paymentIntentId: b.payment_intent_id ?? null,
  }));

  return NextResponse.json({ bookings, total: count ?? 0 });
}
