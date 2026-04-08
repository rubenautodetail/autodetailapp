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

  // Determine if cancellation is within 24 hours (50% penalty applies)
  const bookingDate = new Date(booking.date);
  const now = new Date();
  const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isLateCancellation = hoursUntilBooking < 24 &&
    booking.status !== "pending_payment" && booking.status !== "pending";

  // Cancel Stripe hold if authorized
  if (booking.payment_intent_id && booking.payment_status === "authorized") {
    try {
      if (isLateCancellation) {
        // Late cancellation: capture 50% as penalty, cancel remaining hold
        const pi = await stripe.paymentIntents.retrieve(booking.payment_intent_id);
        const penaltyAmount = Math.round((pi.amount ?? 0) / 2);
        await stripe.paymentIntents.capture(booking.payment_intent_id, {
          amount_to_capture: penaltyAmount,
        });
      } else {
        await stripe.paymentIntents.cancel(booking.payment_intent_id);
      }
    } catch (e) {
      console.error("Stripe cancel/capture error:", e);
      return NextResponse.json(
        { error: "Failed to process cancellation with Stripe" },
        { status: 500 }
      );
    }
  }

  // Refund captured payment if already paid
  if (booking.payment_intent_id && booking.payment_status === "paid") {
    try {
      if (isLateCancellation) {
        // Late cancellation: refund only 50%
        const pi = await stripe.paymentIntents.retrieve(booking.payment_intent_id);
        const refundAmount = Math.round((pi.amount_received ?? 0) / 2);
        const refund = await stripe.refunds.create({
          payment_intent: booking.payment_intent_id,
          amount: refundAmount,
        });
        console.log("Stripe partial refund (50%):", refund.id, "amount:", refundAmount);
      } else {
        const refund = await stripe.refunds.create({
          payment_intent: booking.payment_intent_id,
        });
        console.log("Stripe full refund:", refund.id, "status:", refund.status);
      }
    } catch (e) {
      console.error("Stripe refund error:", e);
      return NextResponse.json(
        { error: "Failed to refund payment. Please contact support." },
        { status: 500 }
      );
    }
  }

  const newPaymentStatus = booking.payment_intent_id
    ? isLateCancellation ? "partially_refunded" : (booking.payment_status === "paid" ? "refunded" : "cancelled")
    : "unpaid";

  const cancelledAt = new Date().toISOString();
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      payment_status: newPaymentStatus,
      cancelled_at: cancelledAt,
      updated_at: cancelledAt,
    })
    .eq("id", bookingId);

  if (error) {
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
