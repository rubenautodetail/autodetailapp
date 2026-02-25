import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://js.stripe.com data:; connect-src 'self' http://localhost:1337 http://127.0.0.1:1337 https://maps.googleapis.com https://api.stripe.com https://r.stripe.com https://ihrxhuyjhdesgadpowus.supabase.co https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://events.mapbox.com; img-src 'self' data: https://maps.gstatic.com https://*.googleapis.com https://*.stripe.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com;"
          }
        ],
      },
    ];
  },
};

export default nextConfig;
