import { google } from "googleapis";
import { createServiceClient } from "@/lib/supabase/server";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/google/auth/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are missing");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function generateAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_SCOPES,
    prompt: "consent",
  });
}

export async function saveTokens(tokens: any) {
  const supabase = createServiceClient();
  const payload = {
    provider_id: "default",
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    token_type: tokens.token_type || "Bearer",
    id_token: tokens.id_token,
    expiry_date: tokens.expiry_date,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("google_auth_tokens")
    .upsert(payload, { onConflict: "provider_id" })
    .select()
    .single();

  if (error) {
    console.error("Error saving Google OAuth tokens to Supabase:", error);
    throw error;
  }

  return data;
}

export async function getAuthenticatedClient() {
  const oauth2Client = getOAuth2Client();
  const supabase = createServiceClient();

  const { data: stored, error } = await supabase
    .from("google_auth_tokens")
    .select("*")
    .eq("provider_id", "default")
    .single();

  if (error || !stored) {
    return { client: null, authenticated: false, reason: "No stored tokens found in database" };
  }

  oauth2Client.setCredentials({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token,
    scope: stored.scope,
    token_type: stored.token_type,
    expiry_date: stored.expiry_date ? Number(stored.expiry_date) : undefined,
  });

  // Auto-refresh token if expired or about to expire in 5 minutes
  if (stored.expiry_date && Date.now() >= Number(stored.expiry_date) - 300_000) {
    if (stored.refresh_token) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        await saveTokens({
          ...credentials,
          refresh_token: credentials.refresh_token || stored.refresh_token,
        });
        oauth2Client.setCredentials(credentials);
      } catch (refreshErr) {
        console.error("Failed to refresh Google OAuth token:", refreshErr);
        return { client: null, authenticated: false, reason: "Token refresh failed" };
      }
    } else {
      return { client: null, authenticated: false, reason: "Token expired and no refresh token available" };
    }
  }

  return { client: oauth2Client, authenticated: true };
}
