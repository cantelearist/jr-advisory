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
      expect(screen.getByText(matter.area)).toBeInTheDocument();
    });
  });

  it("renders matter concerns", () => {
    render(<Matters />);
    MATTERS.forEach((matter) => {
      expect(screen.getByText(matter.concern)).toBeInTheDocument();
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
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("04")).toBeInTheDocument();
  });
});
