import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { bookingId, newDate, newTimeWindow } = await req.json();
  if (!bookingId || !newDate) {
    return NextResponse.json({ error: "bookingId and newDate are required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("id, date, status, customer_email")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.customer_email !== user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (["cancelled", "completed", "working", "en_route"].includes(booking.status ?? "")) {
    return NextResponse.json({ error: "Cannot reschedule this booking" }, { status: 400 });
  }

  // 24-hour restriction
  const bookingDate = new Date(booking.date);
  const now = new Date();
  const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilBooking < 24) {
    return NextResponse.json(
      { error: "Rescheduling must be done at least 24 hours before the appointment" },
      { status: 400 }
    );
  }

  const updateData: Record<string, string> = {
    date: newDate,
    updated_at: new Date().toISOString(),
  };
  if (newTimeWindow) updateData.time_window = newTimeWindow;

  const { error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId);

  if (error) {
    return NextResponse.json({ error: "Failed to reschedule booking" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
