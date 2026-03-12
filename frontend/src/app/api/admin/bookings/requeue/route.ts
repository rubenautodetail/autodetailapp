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
