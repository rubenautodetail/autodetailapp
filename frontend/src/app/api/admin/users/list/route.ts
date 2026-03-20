import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/verifyAdmin";
import { createServiceClient } from "@/lib/supabase/server";

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const role = searchParams.get("role") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const db = createServiceClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = db
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (role !== "all") {
      query = query.eq("role", role);
    }

    const { data, count, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users = (data ?? []).map((p: any) => ({
      id: p.id,
      name: p.full_name || "—",
      phone: p.phone_number || "—",
      role: p.role || "user",
      createdAt: p.created_at,
    }));

    return NextResponse.json({ users, total: count ?? 0 });
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
