import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
  "img-src 'self' data: blob: https://maps.gstatic.com https://*.googleapis.com https://*.stripe.com https://images.unsplash.com https://images.hygraph.com https://*.graphassets.com",
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
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.hygraph.com' },
      { protocol: 'https', hostname: 'media.graphassets.com' },
      { protocol: 'https', hostname: 'eu-west-2.graphassets.com' },
      { protocol: 'https', hostname: 'us-west-2.graphassets.com' },
    ],
  },
};

export default withSentryConfig(nextConfig, {
    // Silent during local builds; errors still captured in prod
    silent: !process.env.CI,
    // Disable source map upload until SENTRY_AUTH_TOKEN + org/project are set
    sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
});
