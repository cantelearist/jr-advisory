import { describe, it, expect } from "vitest";
import {
  FIRM_NAME,
  FIRM_TAGLINE,
  SERVICE_AREAS,
  NAV_ITEMS,
  PRACTICE_STATS,
  COUNSEL_AREAS,
  ENGAGEMENT_PHASES,
  DISCRETION_PRINCIPLES,
  MATTERS,
  FOOTER_COLUMNS,
  CONTACT_PHONE,
  CONTACT_EMAIL,
} from "@/lib/constants";

describe("constants", () => {
  it("has the correct firm name", () => {
    expect(FIRM_NAME).toBe("James Roman Advisory");
  });

  it("has the correct tagline", () => {
    expect(FIRM_TAGLINE).toBe("Counsel. Not Contractors.");
  });

  it("has 6 service areas on the Westside", () => {
    expect(SERVICE_AREAS).toHaveLength(6);
    expect(SERVICE_AREAS).toContain("Malibu");
    expect(SERVICE_AREAS).toContain("Beverly Hills");
    expect(SERVICE_AREAS).toContain("Bel Air");
    expect(SERVICE_AREAS).toContain("Brentwood");
    expect(SERVICE_AREAS).toContain("Pacific Palisades");
    expect(SERVICE_AREAS).toContain("Santa Monica");
  });

  it("has 5 navigation items", () => {
    expect(NAV_ITEMS).toHaveLength(5);
    expect(NAV_ITEMS.map((n) => n.label)).toEqual([
      "The Practice",
      "Counsel",
      "Engagement",
      "Discretion",
      "Contact",
    ]);
  });

  it("all nav items have valid anchor hrefs", () => {
    NAV_ITEMS.forEach((item) => {
      expect(item.href).toMatch(/^#\w+/);
    });
  });

  it("has 3 practice stats", () => {
    expect(PRACTICE_STATS).toHaveLength(3);
    expect(PRACTICE_STATS.map((s) => s.value)).toEqual(["19", "4–6", "$0"]);
  });

  it("shows $0 from contractors (independence)", () => {
    const zeroStat = PRACTICE_STATS.find((s) => s.value === "$0");
    expect(zeroStat).toBeDefined();
    expect(zeroStat!.label).toBe("From contractors");
  });

  it("has 6 counsel areas", () => {
    expect(COUNSEL_AREAS).toHaveLength(6);
  });

  it("counsel areas cover key hazmat categories", () => {
    const titles = COUNSEL_AREAS.map((a) => a.title.toLowerCase());
    expect(titles.some((t) => t.includes("mold"))).toBe(true);
    expect(titles.some((t) => t.includes("asbestos"))).toBe(true);
    expect(titles.some((t) => t.includes("lead"))).toBe(true);
    expect(titles.some((t) => t.includes("fire"))).toBe(true);
    expect(titles.some((t) => t.includes("air quality"))).toBe(true);
    expect(titles.some((t) => t.includes("pre-purchase"))).toBe(true);
  });

  it("counsel areas have roman-numeral identifiers", () => {
    expect(COUNSEL_AREAS.map((a) => a.numeral)).toEqual([
      "i",
      "ii",
      "iii",
      "iv",
      "v",
      "vi",
    ]);
  });

  it("has 4 engagement phases", () => {
    expect(ENGAGEMENT_PHASES).toHaveLength(4);
    expect(ENGAGEMENT_PHASES.map((p) => p.numeral)).toEqual([
      "I",
      "II",
      "III",
      "IV",
    ]);
  });

  it("engagement starts with consultation and ends with clearance", () => {
    expect(ENGAGEMENT_PHASES[0].title).toContain("Consultation");
    expect(ENGAGEMENT_PHASES[3].title).toContain("Clearance");
  });

  it("has 5 discretion principles", () => {
    expect(DISCRETION_PRINCIPLES).toHaveLength(5);
  });

  it("discretion leads with NDA", () => {
    expect(DISCRETION_PRINCIPLES[0].title).toBe("Standing NDA");
  });

  it("has 4 anonymized matters", () => {
    expect(MATTERS).toHaveLength(4);
  });

  it("all matters are in California service areas", () => {
    MATTERS.forEach((m) => {
      expect(m.area).toMatch(/CA$/);
    });
  });

  it("matters have all required fields", () => {
    MATTERS.forEach((m) => {
      expect(m.area).toBeTruthy();
      expect(m.scale).toBeTruthy();
      expect(m.concern).toBeTruthy();
      expect(m.role).toBeTruthy();
      expect(m.outcome).toBeTruthy();
    });
  });

  it("has 3 footer columns", () => {
    expect(FOOTER_COLUMNS).toHaveLength(3);
    expect(FOOTER_COLUMNS.map((c) => c.heading)).toEqual([
      "Practice",
      "Engagement",
      "Firm",
    ]);
  });

  it("contact info uses placeholder values", () => {
    // These should be updated before production deployment
    expect(CONTACT_PHONE).toBe("+1 (310) 430-2500");
    expect(CONTACT_EMAIL).toBe("roman@jamesroman.la");
  });
});
