import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client, saveTokens } from "@/lib/google/oauth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("Google OAuth error parameter received:", error);
    return NextResponse.redirect(new URL("/admin?google_error=" + encodeURIComponent(error), request.url));
  }

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    await saveTokens(tokens);

    // Redirect to Admin dashboard with success parameter
    return NextResponse.redirect(new URL("/admin?google_connected=true", request.url));
  } catch (err: any) {
    console.error("Error exchanging code for Google OAuth tokens:", err);
    return NextResponse.redirect(
      new URL("/admin?google_error=" + encodeURIComponent(err?.message || "OAuth exchange failed"), request.url)
    );
  }
}
