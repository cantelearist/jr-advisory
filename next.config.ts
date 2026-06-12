import type { NextConfig } from "next";
import {
  buildSecurityHeaders,
  privateHeaderSources,
  privateSurfaceHeaders,
} from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: buildSecurityHeaders(),
      },
      ...privateHeaderSources.map((source) => ({
        source,
        headers: privateSurfaceHeaders,
      })),
    ];
  },
};

export default nextConfig;
