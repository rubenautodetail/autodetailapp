// Keep third-party sources scoped to the directive that needs them.
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  // Next.js currently requires inline scripts/styles; unsafe-eval is intentionally excluded.
  "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://js.stripe.com https://www.googletagmanager.com https://www.clarity.ms",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com https://js.stripe.com data:",
  [
    "connect-src 'self'",
    "https://maps.googleapis.com",
    "https://api.stripe.com https://r.stripe.com",
    "https://*.supabase.co wss://*.supabase.co",
    "https://api.mapbox.com https://events.mapbox.com",
    "https://api-us-west-2.hygraph.com",
    "https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
    "https://*.clarity.ms https://c.bing.com",
  ].join(" "),
  "img-src 'self' data: blob: https://maps.gstatic.com https://*.googleapis.com https://*.stripe.com https://images.unsplash.com https://images.hygraph.com https://*.graphassets.com https://*.google-analytics.com https://www.googletagmanager.com https://*.clarity.ms https://c.bing.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");
