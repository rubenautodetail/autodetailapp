import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Checks whether a contractor already has a booking in the same time_window on the given date.
 */
async function contractorHasConflict(
  supabase: ReturnType<typeof createServiceClient>,
  contractorId: string,
  bookingId: string,
  date: string,
  timeWindow: string
): Promise<boolean> {
  const { data } = await supabase
    .from("bookings")
    .select("id")
    .eq("contractor_id", contractorId)
    .eq("date", date)
    .eq("time_window", timeWindow)
    .neq("id", bookingId) // exclude current booking
    .in("status", ["pending_assignment", "accepted", "confirmed", "en_route", "working"])
    .limit(1);

  return (data?.length ?? 0) > 0;
}

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
    // Accept both legacy broad windows and specific HH:MM time slots
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

  if (booking.customer_email !== user.email) {
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

  // Check if the original contractor has a conflict at the new date/time
  let reassigned = false;
  if (originalContractorId) {
    const hasConflict = await contractorHasConflict(
      supabase,
      originalContractorId,
      bookingId,
      newDate,
      finalTimeWindow
    );

    if (hasConflict) {
      reassigned = true;
    }
  }

  // Build the update
  const updateData: Record<string, string | null> = {
    date: newDate,
    updated_at: new Date().toISOString(),
  };
  if (newTimeWindow) updateData.time_window = newTimeWindow;

  if (reassigned) {
    // Unassign contractor and put back in pool
    updateData.contractor_id = null;
    updateData.status = "pending_assignment";
  }

  const { error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId);

  if (error) {
    return NextResponse.json({ error: "Failed to reschedule booking" }, { status: 500 });
  }

  // If reassigned, broadcast to all available contractors (same as new booking flow)
  if (reassigned) {
    try {
      const serviceName = booking.service_name || "Detailing Service";
      const zipCode = booking.zip_code || "";
      const bookingWithService = { ...booking, date: newDate, time_window: finalTimeWindow, service_name: serviceName };

      // Broadcast to all available contractors
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
              booking: bookingWithService,
              contractorEmail: c.email,
            })
          )
        );

        const notificationRows = contractors.map((c: { id: string; email: string }) => ({
          user_id: c.id,
          type: "info" as const,
          title: "New Job Available",
          message: `Rescheduled detailing job in ${zipCode}. Tap to view and accept.`,
          booking_id: booking.id,
          is_read: false,
          link: `/en/contractor/jobs/${booking.id}`,
        }));

        await supabase.from("notifications").insert(notificationRows);
      }
    } catch (notifyErr) {
      console.error("reschedule: contractor notification failed:", notifyErr);
      // Non-fatal — reschedule succeeded, notifications are best-effort
    }
  }

  return NextResponse.json({ success: true, reassigned });
  } catch (err) {
    console.error('booking/reschedule error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
