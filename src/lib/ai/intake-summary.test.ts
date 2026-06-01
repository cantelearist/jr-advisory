import { describe, expect, it } from "vitest";

import { draftLocalIntakeSummary } from "./intake-summary";

describe("draftLocalIntakeSummary", () => {
  it("classifies remediation, structural, and transaction signals", () => {
    const summary = draftLocalIntakeSummary({
      name: "Client",
      email: "client@example.com",
      market: "Malibu",
      matter: "Purchase diligence",
      message:
        "Urgent structural and asbestos remediation review before close. Please call 310-555-1212.",
    });

    expect(summary.scopeTags).toEqual([
      "structural-inspection",
      "hazardous-materials",
      "transaction-diligence",
    ]);
    expect(summary.jurisdiction).toBe("Malibu");
    expect(summary.riskSignals).toEqual(["time-sensitive"]);
    expect(summary.advisorNote).toContain("[REDACTED_PHONE]");
    expect(summary.promptHash).toMatch(/^local-[0-9a-f]+$/);
  });

  it("falls back to advisor-review when no scoped signal is present", () => {
    const summary = draftLocalIntakeSummary({
      name: "Client",
      email: "client@example.com",
      market: "Brentwood",
      matter: "Private review",
      message: "We need a calm independent review of a sensitive property matter.",
    });

    expect(summary.scopeTags).toEqual(["advisor-review"]);
    expect(summary.riskSignals).toEqual(["standard-screening"]);
  });
});
