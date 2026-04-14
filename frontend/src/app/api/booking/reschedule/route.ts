import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
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
    let newDate: string | undefined;
    let newTimeWindow: string | undefined;
    try {
      const body = await req.json();
      bookingId = body.bookingId;
      newDate = body.newDate;
      newTimeWindow = body.newTimeWindow;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    if (!bookingId || !newDate) {
      return NextResponse.json({ error: "bookingId and newDate are required" }, { status: 400 });
    }
    if (newTimeWindow) {
      const legacyWindows = ["morning", "afternoon", "evening"];
      const isHHMM = /^\d{2}:\d{2}$/.test(newTimeWindow);
      if (!legacyWindows.includes(newTimeWindow) && !isHHMM) {
        return NextResponse.json({ error: "Invalid time window" }, { status: 400 });
      }
    }

    const supabase = createServiceClient();

    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify ownership: primary check by user_id, fallback to email
    if (booking.user_id !== user.id && booking.customer_email !== user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (["cancelled", "completed", "working", "en_route"].includes(booking.status ?? "")) {
      return NextResponse.json({ error: "Cannot reschedule this booking" }, { status: 400 });
    }

    // 2-hour restriction
    const bookingDate = new Date(booking.date);
    const now = new Date();
    const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilBooking < 2) {
      return NextResponse.json(
        { error: "Rescheduling must be done at least 2 hours before the appointment" },
        { status: 400 }
      );
    }

    const finalTimeWindow = newTimeWindow || booking.time_window;
    const originalContractorId: string | null = booking.contractor_id;

    // Always unassign contractor and put back in pool
    const { error } = await supabase
      .from("bookings")
      .update({
        date: newDate,
        time_window: finalTimeWindow,
        contractor_id: null,
        status: "pending_assignment",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (error) {
      return NextResponse.json({ error: "Failed to reschedule booking" }, { status: 500 });
    }

    // Notifications (best-effort)
    try {
      const serviceName = booking.service_name || "Detailing Service";
      const zipCode = booking.zip_code || "";
      const confirmationCode = booking.confirmation_code || `#${booking.id}`;

      // 1) Notify the original contractor that the job was cancelled
      if (originalContractorId) {
        const { data: contractorProfile } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("id", originalContractorId)
          .single();

        if (contractorProfile?.email) {
          await notify({
            type: "contractor.job_cancelled",
            booking: { ...booking, service_name: serviceName },
            contractorEmail: contractorProfile.email,
          });

          await supabase.from("notifications").insert({
            user_id: contractorProfile.id,
            type: "warning" as const,
            title: "Job Cancelled",
            message: `Order ${confirmationCode} (${serviceName}) was rescheduled by the customer and removed from your schedule.`,
            booking_id: booking.id,
            is_read: false,
          });
        }
      }

      // 2) Broadcast to all available contractors as a new job in the pool
      const updatedBooking = { ...booking, date: newDate, time_window: finalTimeWindow, service_name: serviceName };

      const { data: contractors } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("role", "contractor")
        .eq("approval_status", "approved")
        .eq("is_available", true);

      if (contractors && contractors.length > 0) {
        await Promise.all(
          contractors.map((c: { id: string; email: string }) =>
            notify({
              type: "contractor.job_assigned",
              booking: updatedBooking,
              contractorEmail: c.email,
            })
          )
        );

        const notificationRows = contractors.map((c: { id: string; email: string }) => ({
          user_id: c.id,
          type: "info" as const,
          title: "New Job Available",
          message: `Detailing job available in ${zipCode}. Tap to view and accept.`,
          booking_id: booking.id,
          is_read: false,
          link: `/contractor/jobs/${booking.id}`,
        }));

        await supabase.from("notifications").insert(notificationRows);
      }
    } catch (notifyErr) {
      console.error("reschedule: notification failed:", notifyErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('booking/reschedule error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
