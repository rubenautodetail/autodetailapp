import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, name } = await req.json();
    if (!userId || !name) {
      return NextResponse.json({ error: "Missing userId or name" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from("profiles").upsert(
      { id: userId, full_name: name, role: "user", updated_at: new Date().toISOString() },
      { onConflict: "id", ignoreDuplicates: true }
    );

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
