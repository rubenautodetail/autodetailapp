import { NextRequest, NextResponse } from "next/server";
import { generateAuthUrl } from "@/lib/google/oauth";

export async function GET(request: NextRequest) {
  try {
    const url = generateAuthUrl();
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Error generating Google Auth URL:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate Google Auth URL" },
      { status: 500 }
    );
  }
}
