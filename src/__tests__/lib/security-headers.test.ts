import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildSecurityHeaders,
  isPrivatePath,
  privateSurfaceHeaders,
} from "@/lib/security-headers";

describe("security headers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not allow unsafe eval in the production CSP", () => {
    vi.stubEnv("NODE_ENV", "production");
    const csp = buildSecurityHeaders().find((header) => header.key === "Content-Security-Policy")
      ?.value;

    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("allows unsafe eval outside production for local Next tooling", () => {
    vi.stubEnv("NODE_ENV", "test");
    const csp = buildSecurityHeaders().find((header) => header.key === "Content-Security-Policy")
      ?.value;

    expect(csp).toContain("'unsafe-eval'");
  });

  it("marks private surfaces as noindex and no-store", () => {
    expect(privateSurfaceHeaders).toEqual(
      expect.arrayContaining([
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        { key: "Cache-Control", value: "no-store, max-age=0" },
      ]),
    );
    expect(isPrivatePath("/portal")).toBe(true);
    expect(isPrivatePath("/portal/dashboard")).toBe(true);
    expect(isPrivatePath("/api/health")).toBe(true);
    expect(isPrivatePath("/counsel/mold-water-intrusion")).toBe(false);
  });
});
