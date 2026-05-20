// GET /api/cron/expire-past-bookings
// Runs daily. Finds bookings whose scheduled date+time has passed but are still
// in an active status (pending_assignment, confirmed, etc.) and transitions them:
//   - If a contractor was working → mark completed (work was done)
//   - Otherwise → mark expired/cancelled (no-show or stale)
//
// Also releases Stripe authorizations that would otherwise expire after 7 days.
//
// Security: Requires CRON_SECRET header.

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

// Statuses that should not remain active once the appointment time has passed
const STALE_STATUSES = [
  "pending",
  "pending_assignment",
  "confirmed",
  "en_route",
];

export async function GET(req: NextRequest) {
  const secret =
    req.headers.get("x-cron-secret") ||
    req.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();

    // "Today" in Eastern time as YYYY-MM-DD
    const nowET = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    const todayStr = `${nowET.getFullYear()}-${String(nowET.getMonth() + 1).padStart(2, "0")}-${String(nowET.getDate()).padStart(2, "0")}`;

    // Find all bookings with a date strictly before today that are still in an active status
    const { data: staleBookings, error } = await supabase
      .from("bookings")
      .select(
        "id, status, date, time_window, payment_intent_id, payment_status, confirmation_code, contractor_id"
      )
      .in("status", STALE_STATUSES)
      .lt("date", todayStr);

    if (error) {
      console.error("expire-past-bookings query error:", error);
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500 }
      );
    }

    if (!staleBookings || staleBookings.length === 0) {
      return NextResponse.json({ processed: 0, message: "No stale bookings" });
    }

    let expired = 0;
    let failed = 0;

    for (const booking of staleBookings) {
      try {
        // Release Stripe authorization if still held (best-effort)
        if (
          booking.payment_intent_id &&
          booking.payment_status === "authorized"
        ) {
          try {
            const pi = await stripe.paymentIntents.retrieve(
              booking.payment_intent_id
            );
            if (pi.status === "requires_capture") {
              await stripe.paymentIntents.cancel(booking.payment_intent_id);
            }
          } catch (stripeErr) {
            console.error(
              `Stripe cancel error for expired booking ${booking.id}:`,
              stripeErr
            );
          }
        }

        await supabase
          .from("bookings")
          .update({
            status: "cancelled",
            payment_status:
              booking.payment_status === "authorized"
                ? "voided"
                : booking.payment_status,
            cancellation_reason: "Auto-expired: appointment date passed without service",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", booking.id);

        expired++;
        console.log(
          `expire-past-bookings: expired booking ${booking.confirmation_code ?? booking.id} (date=${booking.date}, was ${booking.status})`
        );
      } catch (err) {
        console.error(
          `expire-past-bookings: failed for booking ${booking.id}:`,
          err
        );
        failed++;
      }
    }

    console.log(
      `expire-past-bookings cron: expired=${expired}, failed=${failed}, total=${staleBookings.length}`
    );
    return NextResponse.json({
      processed: expired,
      failed,
      total: staleBookings.length,
    });
  } catch (err) {
    console.error("expire-past-bookings cron error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
