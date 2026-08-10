import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/google/oauth";
import { getGoogleMapsApiKey } from "@/lib/google/maps";
import { getGAMeasurementId } from "@/lib/google/analytics";

export async function GET(request: NextRequest) {
  try {
    const hasClientId = Boolean(process.env.GOOGLE_CLIENT_ID);
    const hasClientSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET);
    const hasProjectId = Boolean(process.env.GOOGLE_PROJECT_ID);
    const mapsApiKey = getGoogleMapsApiKey();
    const gaMeasurementId = getGAMeasurementId();
    const gscVerification = process.env.NEXT_PUBLIC_GSC_VERIFICATION || null;

    const { authenticated, reason } = await getAuthenticatedClient();

    return NextResponse.json({
      configured: hasClientId && hasClientSecret && hasProjectId,
      oauth: {
        authenticated,
        reason: authenticated ? "Connected and valid" : reason,
      },
      services: {
        maps: {
          configured: Boolean(mapsApiKey),
          apiKeySnippet: mapsApiKey ? `${mapsApiKey.slice(0, 8)}...` : null,
        },
        analytics: {
          configured: Boolean(gaMeasurementId),
          measurementId: gaMeasurementId,
        },
        searchConsole: {
          configured: Boolean(gscVerification),
          verificationToken: gscVerification ? `${gscVerification.slice(0, 10)}...` : null,
          apiReady: authenticated,
        },
        businessProfile: {
          configured: authenticated,
          apiReady: authenticated,
        },
      },
    });
  } catch (error: any) {
    console.error("Error checking Google status:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to check Google status" },
      { status: 500 }
    );
  }
}
