import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/verifyAdmin";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const db = createServiceClient();

  let data, error;
  try {
    ({ data, error } = await db.from("bookings").select("*").eq("id", id).single());
  } catch (err) {
    console.error('admin/bookings/detail: query threw:', err);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }

  if (error || !data) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = data as any;

  let contractor = null;
  if (b.contractor_id) {
    const { data: p } = await db
      .from("profiles")
      .select("id, full_name, phone_number, stripe_account_id, onboarding_complete")
      .eq("id", b.contractor_id)
      .single();
    if (p) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cp = p as any;
      contractor = {
        id: cp.id,
        name: cp.full_name ?? "Unknown",
        phone: cp.phone_number ?? "—",
        stripeAccountId: cp.stripe_account_id ?? null,
        onboardingComplete: cp.onboarding_complete ?? false,
      };
    }
  }

  const booking = {
    id: b.id,
    status: b.status ?? "pending",
    customerName: b.customer_name ?? "—",
    customerEmail: b.customer_email ?? "—",
    customerPhone: b.customer_phone ?? "—",
    serviceName: b.service_name ?? "—",
    vehicleMake: b.vehicle_make ?? "—",
    vehicleModel: b.vehicle_model ?? "—",
    vehicleYear: b.vehicle_year ?? "—",
    vehicleColor: b.vehicle_color ?? "—",
    vehicleType: b.vehicle_type ?? "—",
    address: b.address ?? "—",
    city: b.city ?? "—",
    state: b.state ?? "—",
    zipCode: b.zip_code ?? "—",
    scheduledDate: b.date ?? "",
    timeWindow: b.time_window ?? "—",
    totalAmount: b.total_amount ? parseFloat(String(b.total_amount)) : 0,
    paymentStatus: b.payment_status ?? "—",
    paymentIntentId: b.payment_intent_id ?? "",
    specialInstructions: b.special_instructions ?? "—",
    confirmationCode: b.confirmation_code ?? "—",
    contractorId: b.contractor_id ?? null,
    createdAt: b.created_at ?? null,
    updatedAt: b.updated_at ?? null,
  };

  return NextResponse.json({ booking, contractor });
}
