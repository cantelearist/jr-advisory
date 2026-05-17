import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Matters } from "@/components/marketing/Matters";
import { MATTERS } from "@/lib/constants";

describe("Matters", () => {
  it("renders without crashing", () => {
    render(<Matters />);
    expect(screen.getByTestId("matters")).toBeInTheDocument();
  });

  it("renders the section number", () => {
    render(<Matters />);
    expect(screen.getByText("§ 05 — RECORD")).toBeInTheDocument();
  });

  it("renders the heading", () => {
    render(<Matters />);
    expect(screen.getByText("Experience")).toBeInTheDocument();
    expect(screen.getByText("without exposure.")).toBeInTheDocument();
  });

  it("renders a table with column headers", () => {
    render(<Matters />);
    ["Area", "Scale", "Concern", "Advisory Role", "Outcome"].forEach(
      (header) => {
        expect(screen.getByText(header)).toBeInTheDocument();
      }
    );
  });

  it("renders all 4 anonymized matters", () => {
    render(<Matters />);
    MATTERS.forEach((matter) => {
      // Desktop table + mobile cards both render the area
      const els = screen.getAllByText(matter.area);
      expect(els.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders matter concerns", () => {
    render(<Matters />);
    MATTERS.forEach((matter) => {
      // Desktop table + mobile cards both render concerns
      const els = screen.getAllByText(matter.concern);
      expect(els.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("includes the privacy disclaimer", () => {
    render(<Matters />);
    expect(
      screen.getByText(/Details have been intentionally limited/)
    ).toBeInTheDocument();
  });

  it("renders row numbers", () => {
    render(<Matters />);
    // Desktop table + mobile cards both render row numbers
    const ones = screen.getAllByText("01");
    expect(ones.length).toBeGreaterThanOrEqual(1);
    const fours = screen.getAllByText("04");
    expect(fours.length).toBeGreaterThanOrEqual(1);
  });
});
