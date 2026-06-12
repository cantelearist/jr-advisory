export type Header = {
  key: string;
  value: string;
};

const isProduction = () => process.env.NODE_ENV === "production";

export const privateSurfaceHeaders: Header[] = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Cache-Control", value: "no-store, max-age=0" },
];

export const privateHeaderSources = [
  "/api/:path*",
  "/portal",
  "/portal/:path*",
  "/auth/:path*",
  "/login",
  "/login/:path*",
];

const privatePrefixes = ["/api", "/portal", "/auth", "/login"];

export function isPrivatePath(pathname: string): boolean {
  return privatePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function withPrivateHeaders<T extends { headers: Headers }>(response: T): T {
  for (const { key, value } of privateSurfaceHeaders) {
    response.headers.set(key, value);
  }
  return response;
}

export function buildSecurityHeaders(): Header[] {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isProduction() ? [] : ["'unsafe-eval'"]),
    "https://js.stripe.com",
    "https://vercel.live",
  ];

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://vercel.live",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProduction() ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    },
    {
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains; preload",
    },
  ];
}
