import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
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

    // Guard: only allow requeue of bookings that can be reassigned
    const { data: existing } = await supabase
      .from("bookings")
      .select("status")
      .eq("id", bookingId)
      .single();

    const REQUEUEABLE = ["confirmed", "cancelled", "pending_assignment", "en_route", "in_progress", "pending_approval"];
    if (!existing || !REQUEUEABLE.includes(existing.status)) {
      return NextResponse.json(
        { error: `Cannot requeue a booking with status "${existing?.status}"` },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("bookings")
      .update({
        status: "pending_assignment",
        contractor_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Requeue booking error:", err);
    return NextResponse.json({ error: "Failed to requeue booking" }, { status: 500 });
  }
}
