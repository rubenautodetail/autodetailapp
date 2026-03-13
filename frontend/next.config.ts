import type { NextConfig } from "next";

// Build CSP as array for readability, then join
const cspDirectives = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' for styles; 'unsafe-eval' removed (was Strapi legacy)
  "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com https://js.stripe.com data:",
  [
    "connect-src 'self'",
    "https://maps.googleapis.com",
    "https://api.stripe.com https://r.stripe.com",
    "https://*.supabase.co wss://*.supabase.co",
    "https://api.mapbox.com https://events.mapbox.com",
    "https://api-us-west-2.hygraph.com",
  ].join(" "),
  "img-src 'self' data: blob: https://maps.gstatic.com https://*.googleapis.com https://*.stripe.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy",            value: cspDirectives },
          { key: "X-Frame-Options",                    value: "DENY" },
          { key: "X-Content-Type-Options",             value: "nosniff" },
          { key: "Referrer-Policy",                    value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",                 value: "camera=(), microphone=(), geolocation=(self)" },
          // HSTS: 1 year, include subdomains. Remove if not on HTTPS in dev.
          { key: "Strict-Transport-Security",          value: "max-age=31536000; includeSubDomains" },
          { key: "X-DNS-Prefetch-Control",             value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
