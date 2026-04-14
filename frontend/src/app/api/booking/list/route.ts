import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }

  // Batch-fetch contractor names
  const contractorIds = [...new Set((bookings ?? []).filter(b => b.contractor_id).map(b => b.contractor_id as string))];
  const contractorNames: Record<string, string> = {};

  if (contractorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", contractorIds);

    (profiles ?? []).forEach((p) => {
      contractorNames[p.id] = p.full_name ?? "—";
    });
  }

  return NextResponse.json({
    bookings: bookings ?? [],
    contractorNames,
  });
}
