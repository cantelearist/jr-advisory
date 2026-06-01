import { describe, expect, it } from "vitest";

import { hashPromptBoundary, redactSensitiveText } from "./redaction";

describe("redactSensitiveText", () => {
  it("redacts common direct identifiers", () => {
    expect(
      redactSensitiveText("Email client@example.com, call (310) 555-1212, SSN 123-45-6789."),
    ).toBe(
      "Email [REDACTED_EMAIL], call [REDACTED_PHONE], SSN [REDACTED_SSN].",
    );
  });

  it("leaves non-sensitive text intact", () => {
    expect(redactSensitiveText("Malibu structural inspection review")).toBe(
      "Malibu structural inspection review",
    );
  });
});

describe("hashPromptBoundary", () => {
  it("creates a stable local hash without exposing the original value", () => {
    const first = hashPromptBoundary("Malibu:remediation:64");
    const second = hashPromptBoundary("Malibu:remediation:64");

    expect(first).toBe(second);
    expect(first).toMatch(/^local-[0-9a-f]+$/);
    expect(first).not.toContain("Malibu");
  });
});
