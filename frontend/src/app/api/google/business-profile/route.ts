import { NextRequest, NextResponse } from "next/server";
import { getBusinessProfileDetails } from "@/lib/google/businessProfile";

export async function GET(request: NextRequest) {
  try {
    const data = await getBusinessProfileDetails();

    if (!data) {
      return NextResponse.json(
        {
          error: "Unable to fetch Google Business Profile. Please ensure Google OAuth is authorized with business.manage scope.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching Google Business Profile API:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch Google Business Profile data" },
      { status: 500 }
    );
  }
}
