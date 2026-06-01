import { describe, expect, it } from "vitest";

import { consultationSchema, redactForAudit } from "./intake";

const validInput = {
  name: "James Roman",
  email: "client@example.com",
  market: "Malibu",
  matter: "Remediation oversight",
  message: "We need private review of a remediation protocol before acceptance.",
};

describe("consultationSchema", () => {
  it("accepts a complete consultation request", () => {
    expect(consultationSchema.parse(validInput)).toEqual(validInput);
  });

  it("trims user input before returning validated data", () => {
    expect(
      consultationSchema.parse({
        ...validInput,
        name: "  Jane Client  ",
        email: "  jane@example.com  ",
      }),
    ).toMatchObject({
      name: "Jane Client",
      email: "jane@example.com",
    });
  });

  it("rejects invalid or under-specified requests", () => {
    const result = consultationSchema.safeParse({
      name: "J",
      email: "not-an-email",
      market: "",
      matter: "",
      message: "too short",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.name?.[0]).toBe("Name is required");
      expect(errors.email?.[0]).toBe("Use a valid email address");
      expect(errors.message?.[0]).toContain("at least 20 characters");
    }
  });
});

describe("redactForAudit", () => {
  it("keeps audit metadata useful without storing direct contact details", () => {
    expect(redactForAudit(validInput)).toEqual({
      nameInitials: "JR",
      emailDomain: "example.com",
      market: "Malibu",
      matter: "Remediation oversight",
      messageLength: validInput.message.length,
    });
  });

  it("limits initials to four characters", () => {
    expect(
      redactForAudit({
        ...validInput,
        name: "One Two Three Four Five",
      }).nameInitials,
    ).toBe("OTTF");
  });

  it("falls back when the audit email domain is unavailable", () => {
    expect(
      redactForAudit({
        ...validInput,
        email: "missing-domain",
      }).emailDomain,
    ).toBe("unknown");
  });
});
