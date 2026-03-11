import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";

/**
 * Verifies the caller is an authenticated admin.
 * When ADMIN_SECRET is not configured (dev mode), all requests are allowed.
 */
async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return false; // misconfigured — deny all

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  if (token === adminSecret) return true;

  if (!token) return false;

  try {
    const { user, error } = await createAuthClient(token);
    if (error || !user) return false;

    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return (profile as any)?.role === "admin";
  } catch {
    return false;
  }
}

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

    // Fetch booking to get payment intent before cancelling
    const { data: booking } = await supabase
      .from("bookings")
      .select("payment_intent_id, payment_status")
      .eq("id", bookingId)
      .single();

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
