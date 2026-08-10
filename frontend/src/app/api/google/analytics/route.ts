import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsData } from "@/lib/google/analytics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId") || "properties/J70SXKFB1N";
    const days = parseInt(searchParams.get("days") || "30", 10);

    const data = await getAnalyticsData(propertyId, days);

    if (!data) {
      return NextResponse.json(
        {
          error: "Unable to fetch Google Analytics data. Please ensure Google OAuth is authorized.",
          propertyId,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching Google Analytics API:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch Google Analytics data" },
      { status: 500 }
    );
  }
}
