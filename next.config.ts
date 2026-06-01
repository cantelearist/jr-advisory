import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          /* Prevent clickjacking */
          { key: "X-Frame-Options", value: "DENY" },
          /* Block MIME-type sniffing */
          { key: "X-Content-Type-Options", value: "nosniff" },
          /* Referrer — send origin only to cross-origin */
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          /* Permissions — disable unused browser features */
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          /* Strict Transport Security — 1 year, include subdomains */
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          /* CSP — tight but allows Supabase, Stripe, Vercel, fonts */
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://vercel.live",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      {
        /* API routes — allow JSON consumption, no caching for dynamic data */
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
