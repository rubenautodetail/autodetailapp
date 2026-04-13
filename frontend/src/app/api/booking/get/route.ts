import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const bookingId = req.nextUrl.searchParams.get("id");
  if (!bookingId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Verify ownership: customer or assigned contractor
  const isOwner = booking.customer_email === user.email || booking.user_id === user.id;
  const isContractor = booking.contractor_id === user.id;
  if (!isOwner && !isContractor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Fetch contractor name if assigned
  let contractorName: string | null = null;
  if (booking.contractor_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", booking.contractor_id)
      .single();
    contractorName = profile?.full_name ?? null;
  }

  return NextResponse.json({
    booking: { ...booking, profiles: contractorName ? { full_name: contractorName } : null },
  });
}
