import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { logBookingEvent } from "@/lib/supabase/logBookingEvent";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, issueType, description } = await req.json();

    if (!bookingId || !issueType || !description?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch booking for customer info
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, customer_name, customer_email, confirmation_code, service_name, status")
      .or(`id.eq.${bookingId},document_id.eq.${bookingId}`)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Guard: only allow dispute when booking is in pending_approval state
    if (booking.status !== "pending_approval" && booking.status !== "disputed") {
      return NextResponse.json(
        { error: `Cannot report issue: booking status is ${booking.status}` },
        { status: 400 }
      );
    }

    // Set booking status to 'disputed' so the 24-hour auto-capture cron skips it
    // and payment is held until admin resolves the dispute.
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "disputed", updated_at: new Date().toISOString() })
      .or(`id.eq.${bookingId},document_id.eq.${bookingId}`);

    if (updateError) {
      console.error("Failed to set booking status to disputed:", updateError);
      return NextResponse.json({ error: "Failed to record dispute" }, { status: 500 });
    }

    await logBookingEvent({
      bookingId: String(booking.id),
      fromStatus: 'pending_approval',
      toStatus: 'disputed',
      actorType: 'customer',
    });

    // Send email notification to support
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set — skipping report email");
      return NextResponse.json({ success: true, warning: "Email not sent (no API key configured)" });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.FROM_EMAIL || "onboarding@resend.dev";
    const to = process.env.SUPPORT_EMAIL || from;

    await resend.emails.send({
      from,
      to,
      subject: `Issue Report — Booking #${bookingId} (${issueType})`,
      html: `
        <h2>Issue Report</h2>
        <p><strong>Booking:</strong> #${bookingId} ${booking?.confirmation_code ? `(${booking.confirmation_code})` : ""}</p>
        <p><strong>Customer:</strong> ${booking?.customer_name || "Unknown"} (${booking?.customer_email || "no email"})</p>
        <p><strong>Service:</strong> ${booking?.service_name || "—"}</p>
        <p><strong>Issue Type:</strong> ${issueType}</p>
        <p><strong>Description:</strong></p>
        <p>${description.replace(/\n/g, "<br>")}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Report issue error:", err);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
