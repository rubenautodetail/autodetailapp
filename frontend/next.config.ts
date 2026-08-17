import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { CONTENT_SECURITY_POLICY } from "./src/lib/security/contentSecurityPolicy";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy",            value: CONTENT_SECURITY_POLICY },
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
