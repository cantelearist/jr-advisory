import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Counsel } from "@/components/marketing/Counsel";
import { COUNSEL_AREAS } from "@/lib/constants";

describe("Counsel", () => {
  it("renders without crashing", () => {
    render(<Counsel />);
    expect(screen.getByTestId("counsel")).toBeInTheDocument();
  });

  it("renders the section number", () => {
    render(<Counsel />);
    expect(screen.getByText("§ 02 — COUNSEL")).toBeInTheDocument();
  });

  it("renders the section heading", () => {
    render(<Counsel />);
    expect(screen.getByText("Where we are")).toBeInTheDocument();
    expect(screen.getByText("most often retained.")).toBeInTheDocument();
  });

  it("renders all 6 counsel areas", () => {
    render(<Counsel />);
    COUNSEL_AREAS.forEach((area) => {
      expect(screen.getByText(area.title.toUpperCase())).toBeInTheDocument();
    });
  });

  it("renders descriptions for each counsel area", () => {
    render(<Counsel />);
    COUNSEL_AREAS.forEach((area) => {
      expect(screen.getByText(area.description)).toBeInTheDocument();
    });
  });

  it("renders roman numeral identifiers", () => {
    render(<Counsel />);
    COUNSEL_AREAS.forEach((area) => {
      expect(screen.getByText(area.numeral)).toBeInTheDocument();
    });
  });

  it("mold is described as the most common reason", () => {
    render(<Counsel />);
    expect(
      screen.getByText(/The most common reason we are called/)
    ).toBeInTheDocument();
  });
});
