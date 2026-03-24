import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { verifyAdmin } from "@/lib/verifyAdmin";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch booking to get status + payment intent before cancelling
    const { data: booking } = await supabase
      .from("bookings")
      .select("status, payment_intent_id, payment_status")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Guard: do not cancel completed bookings
    if (booking.status === "completed") {
      return NextResponse.json(
        { error: "Cannot cancel a completed booking" },
        { status: 400 }
      );
    }

    // Cancel Stripe hold if payment was authorized but not yet captured
    if (booking?.payment_intent_id && booking.payment_status === "authorized") {
      try {
        await stripe.paymentIntents.cancel(booking.payment_intent_id);
      } catch (stripeErr) {
        console.error("Stripe cancel error:", stripeErr);
        // Continue — still cancel in DB
      }
    }

    // Determine the correct payment_status after cancellation:
    //  - If a Stripe hold existed → set 'cancelled' (hold has been released above)
    //  - If no payment intent → booking was never paid, set 'unpaid'
    const newPaymentStatus = booking?.payment_intent_id ? "cancelled" : "unpaid";

    const { error } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        payment_status: newPaymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Cancel booking error:", err);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}
