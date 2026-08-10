import { NextRequest, NextResponse } from "next/server";
import { getSearchConsolePerformance } from "@/lib/google/searchConsole";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteUrl = searchParams.get("siteUrl") || "https://dtailwash.com/";
    const days = parseInt(searchParams.get("days") || "30", 10);

    const data = await getSearchConsolePerformance(siteUrl, days);

    if (!data) {
      return NextResponse.json(
        {
          error: "Unable to fetch Search Console performance. Please ensure Google OAuth is authorized.",
          siteUrl,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching Search Console API:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch Search Console data" },
      { status: 500 }
    );
  }
}
