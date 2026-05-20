import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { notify } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let bookingId: string | undefined;
  try {
    const body = await req.json();
    bookingId = body.bookingId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("id, date, status, payment_intent_id, payment_status, customer_email, contractor_id, user_id, service_name, customer_name, customer_phone, address, city, state, zip_code, vehicle_make, vehicle_model, vehicle_year, vehicle_color, total_amount, time_window, confirmation_code, locale")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Verify ownership: primary check by user_id, fallback to email
  if (booking.user_id !== user.id && booking.customer_email !== user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Can't cancel already cancelled or completed bookings
  if (["cancelled", "completed", "working"].includes(booking.status ?? "")) {
    return NextResponse.json({ error: "Cannot cancel this booking" }, { status: 400 });
  }

  // Determine if cancellation is within 4 hours (25% penalty applies)
  // Combine date + time_window for accurate comparison in Eastern time
  const now = new Date();
  const nowET = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  let appointmentET: Date;
  if (booking.date && booking.date.length === 10) {
    const [y, mo, d] = booking.date.split("-").map(Number);
    const twMatch = booking.time_window?.match(/^(\d{1,2}):(\d{2})$/);
    const h = twMatch ? parseInt(twMatch[1], 10) : 12;
    const m = twMatch ? parseInt(twMatch[2], 10) : 0;
    appointmentET = new Date(y, mo - 1, d, h, m, 0);
  } else {
    appointmentET = new Date(new Date(booking.date).toLocaleString("en-US", { timeZone: "America/New_York" }));
  }
  const hoursUntilBooking = (appointmentET.getTime() - nowET.getTime()) / (1000 * 60 * 60);
  const isLateCancellation = hoursUntilBooking < 4 &&
    booking.status !== "pending_payment" && booking.status !== "pending";

  // Process Stripe cancellation / refund (best-effort — never block the cancellation)
  let stripeError = false;

  if (booking.payment_intent_id && booking.payment_status === "authorized") {
    try {
      // Check actual Stripe state — auth may have expired
      const pi = await stripe.paymentIntents.retrieve(booking.payment_intent_id);

      if (pi.status === "requires_capture") {
        if (isLateCancellation) {
          const penaltyAmount = Math.round((pi.amount ?? 0) / 4);
          await stripe.paymentIntents.capture(booking.payment_intent_id, {
            amount_to_capture: penaltyAmount,
          });
        } else {
          await stripe.paymentIntents.cancel(booking.payment_intent_id);
        }
      } else if (pi.status === "canceled") {
        // Auth already expired/cancelled — nothing to do
        console.log("Stripe PI already canceled:", booking.payment_intent_id);
      } else {
        console.warn("Stripe PI unexpected status:", pi.status, booking.payment_intent_id);
        stripeError = true;
      }
    } catch (e) {
      console.error("Stripe cancel/capture error:", e);
      stripeError = true;
    }
  }

  if (booking.payment_intent_id && booking.payment_status === "paid") {
    try {
      if (isLateCancellation) {
        const pi = await stripe.paymentIntents.retrieve(booking.payment_intent_id);
        const refundAmount = Math.round((pi.amount_received ?? 0) * 0.75);
        await stripe.refunds.create({
          payment_intent: booking.payment_intent_id,
          amount: refundAmount,
        });
      } else {
        await stripe.refunds.create({
          payment_intent: booking.payment_intent_id,
        });
      }
    } catch (e) {
      console.error("Stripe refund error:", e);
      stripeError = true;
    }
  }

  const newPaymentStatus = stripeError
    ? "requires_admin_review"
    : booking.payment_intent_id
      ? isLateCancellation ? "partially_refunded" : (booking.payment_status === "paid" ? "refunded" : "cancelled")
      : "unpaid";

  const cancelledAt = new Date().toISOString();
  const cancellationReason = isLateCancellation
    ? "Late cancellation - 25% penalty applied"
    : "Cancelled by customer";

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      payment_status: newPaymentStatus,
      cancelled_at: cancelledAt,
      updated_at: cancelledAt,
      cancellation_reason: cancellationReason,
    })
    .eq("id", bookingId);

  if (error) {
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }

  // --- Notification dispatch (best-effort, never block response) ---
  try {
    // 1. Send cancellation email to customer + notify admins
    await notify({
      type: "booking.cancelled",
      booking: { ...booking, status: "cancelled" },
    });

    // 2. If a contractor was assigned, notify them
    if (booking.contractor_id) {
      const { data: contractor } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", booking.contractor_id)
        .single();

      if (contractor?.email) {
        await notify({
          type: "contractor.job_cancelled",
          booking: { ...booking, status: "cancelled" },
          contractorEmail: contractor.email,
        });
      }
    }
  } catch (notifErr) {
    console.error("Cancel notification error (non-blocking):", notifErr);
  }

  return NextResponse.json({
    success: true,
    ...(stripeError && { warning: "Booking cancelled but Stripe processing needs admin review." }),
  });
  } catch (err) {
    console.error('booking/cancel error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
