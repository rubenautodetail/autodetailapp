import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { bookingId } = await req.json();
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("id, date, status, payment_intent_id, payment_status, customer_email")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Verify ownership
  if (booking.customer_email !== user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Can't cancel already cancelled or completed bookings
  if (["cancelled", "completed", "working"].includes(booking.status ?? "")) {
    return NextResponse.json({ error: "Cannot cancel this booking" }, { status: 400 });
  }

  // 24-hour restriction for bookings that are not pending_payment
  if (booking.status !== "pending_payment" && booking.status !== "pending" && booking.status !== null) {
    const bookingDate = new Date(booking.date);
    const now = new Date();
    const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilBooking < 24) {
      return NextResponse.json(
        { error: "Cancellations must be made at least 24 hours before the appointment" },
        { status: 400 }
      );
    }
  }

  // Cancel Stripe hold if authorized
  if (booking.payment_intent_id && booking.payment_status === "authorized") {
    try {
      await stripe.paymentIntents.cancel(booking.payment_intent_id);
    } catch (e) {
      console.error("Stripe cancel error:", e);
    }
  }

  const newPaymentStatus = booking.payment_intent_id ? "cancelled" : "unpaid";

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      payment_status: newPaymentStatus,
      cancelled_at: now,
      updated_at: now,
    })
    .eq("id", bookingId);

  if (error) {
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
