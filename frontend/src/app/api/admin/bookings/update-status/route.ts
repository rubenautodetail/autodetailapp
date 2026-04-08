import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { verifyAdmin } from "@/lib/verifyAdmin";

export const dynamic = "force-dynamic";

const VALID_STATUSES = [
  "pending",
  "pending_assignment",
  "confirmed",
  "en_route",
  "in_progress",
  "pending_approval",
  "completed",
  "cancelled",
] as const;

type BookingStatus = (typeof VALID_STATUSES)[number];

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { bookingId, newStatus, capturePayment } = rawBody as {
      bookingId: number;
      newStatus: BookingStatus;
      capturePayment?: boolean;
    };

    if (!bookingId || !newStatus) {
      return NextResponse.json(
        { error: "bookingId and newStatus are required" },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status: ${newStatus}` },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: booking } = await supabase
      .from("bookings")
      .select("status, payment_intent_id, payment_status")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Safety: completed bookings can only move to cancelled
    if (booking.status === "completed" && newStatus !== "cancelled") {
      return NextResponse.json(
        { error: "Completed bookings can only be changed to cancelled" },
        { status: 400 }
      );
    }

    // No-op guard
    if (booking.status === newStatus) {
      return NextResponse.json(
        { error: "Status is already " + newStatus },
        { status: 400 }
      );
    }

    console.log(
      `[Admin] Booking #${bookingId} status change: ${booking.status} → ${newStatus}`
    );

    // If completing + payment authorized + admin wants to capture
    if (
      newStatus === "completed" &&
      capturePayment &&
      booking.payment_intent_id &&
      booking.payment_status === "authorized"
    ) {
      try {
        await stripe.paymentIntents.capture(booking.payment_intent_id);
        console.log(
          `[Admin] Captured payment for booking #${bookingId}: ${booking.payment_intent_id}`
        );
      } catch (stripeErr) {
        console.error("Stripe capture error:", stripeErr);
        return NextResponse.json(
          { error: "Failed to capture payment. Status not changed." },
          { status: 500 }
        );
      }
    }

    const updatePayload: Record<string, string> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // If we just captured, update payment_status too
    if (
      newStatus === "completed" &&
      capturePayment &&
      booking.payment_intent_id &&
      booking.payment_status === "authorized"
    ) {
      updatePayload.payment_status = "captured";
    }

    const { error } = await supabase
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update status error:", err);
    return NextResponse.json(
      { error: "Failed to update booking status" },
      { status: 500 }
    );
  }
}
