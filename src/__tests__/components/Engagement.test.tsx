import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Engagement } from "@/components/marketing/Engagement";
import { ENGAGEMENT_PHASES } from "@/lib/constants";

describe("Engagement", () => {
  it("renders without crashing", () => {
    render(<Engagement />);
    expect(screen.getByTestId("engagement")).toBeInTheDocument();
  });

  it("renders the section number", () => {
    render(<Engagement />);
    expect(screen.getByText("§ 03 — ENGAGEMENT")).toBeInTheDocument();
  });

  it("renders 'Four phases' heading", () => {
    render(<Engagement />);
    expect(screen.getByText("Four phases.")).toBeInTheDocument();
  });

  it("renders 'One advocate.' subline", () => {
    render(<Engagement />);
    expect(screen.getByText("One advocate.")).toBeInTheDocument();
  });

  it("renders all 4 engagement phases", () => {
    render(<Engagement />);
    ENGAGEMENT_PHASES.forEach((phase) => {
      expect(
        screen.getByText(phase.title.toUpperCase())
      ).toBeInTheDocument();
    });
  });

  it("renders descriptions for each phase", () => {
    render(<Engagement />);
    ENGAGEMENT_PHASES.forEach((phase) => {
      expect(screen.getByText(phase.description)).toBeInTheDocument();
    });
  });

  it("renders phase numerals I through IV", () => {
    render(<Engagement />);
    ["I", "II", "III", "IV"].forEach((numeral) => {
      expect(screen.getByText(numeral)).toBeInTheDocument();
    });
  });

  it("emphasises single-person engagement", () => {
    render(<Engagement />);
    expect(
      screen.getByText(/one person, one file, no subcontracted judgment/)
    ).toBeInTheDocument();
  });
});
