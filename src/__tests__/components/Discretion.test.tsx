import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Discretion } from "@/components/marketing/Discretion";
import { DISCRETION_PRINCIPLES } from "@/lib/constants";

describe("Discretion", () => {
  it("renders without crashing", () => {
    render(<Discretion />);
    expect(screen.getByTestId("discretion")).toBeInTheDocument();
  });

  it("renders the section number", () => {
    render(<Discretion />);
    expect(screen.getByText("§ 04 — DISCRETION")).toBeInTheDocument();
  });

  it("renders the heading", () => {
    render(<Discretion />);
    expect(screen.getByText("The first commitment")).toBeInTheDocument();
    expect(screen.getByText("we make.")).toBeInTheDocument();
  });

  it("renders all 5 discretion principles", () => {
    render(<Discretion />);
    DISCRETION_PRINCIPLES.forEach((principle) => {
      expect(
        screen.getByText(principle.title.toUpperCase())
      ).toBeInTheDocument();
    });
  });

  it("renders descriptions for each principle", () => {
    render(<Discretion />);
    DISCRETION_PRINCIPLES.forEach((principle) => {
      expect(
        screen.getByText(principle.description)
      ).toBeInTheDocument();
    });
  });

  it("mentions NDA as the first principle", () => {
    render(<Discretion />);
    expect(
      screen.getByText("STANDING NDA")
    ).toBeInTheDocument();
  });

  it("mentions encrypted communications", () => {
    render(<Discretion />);
    expect(
      screen.getByText(/Signal or Proton by default/)
    ).toBeInTheDocument();
  });

  it("stresses independence from contractors", () => {
    render(<Discretion />);
    expect(
      screen.getByText(/No referral fees, no kickbacks/)
    ).toBeInTheDocument();
  });
});
