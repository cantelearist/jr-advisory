import { describe, expect, it } from "vitest";

import { isInternalSecretAuthorized } from "@/lib/internal-secret";

describe("isInternalSecretAuthorized", () => {
  it("requires an explicit configured secret", () => {
    expect(isInternalSecretAuthorized("public-default", undefined)).toBe(false);
    expect(isInternalSecretAuthorized("public-default", "")).toBe(false);
  });

  it("authorizes an exact configured secret", () => {
    expect(isInternalSecretAuthorized("actual-secret", "actual-secret")).toBe(true);
    expect(isInternalSecretAuthorized("wrong-secret", "actual-secret")).toBe(false);
  });
});
