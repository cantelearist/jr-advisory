import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Practice } from "@/components/marketing/Practice";

describe("Practice", () => {
  it("renders without crashing", () => {
    render(<Practice />);
    expect(screen.getByTestId("practice")).toBeInTheDocument();
  });

  it("renders the section label", () => {
    render(<Practice />);
    expect(screen.getByText("The Practice")).toBeInTheDocument();
  });

  it("renders 'Advocacy,' heading", () => {
    render(<Practice />);
    expect(screen.getByText("Advocacy,")).toBeInTheDocument();
  });

  it("renders 'not remediation.' with accent shimmer", () => {
    render(<Practice />);
    const accent = screen.getByText("not remediation.");
    expect(accent).toBeInTheDocument();
    expect(accent.classList.contains("accent-shimmer")).toBe(true);
  });

  it("renders the independence statement", () => {
    render(<Practice />);
    expect(
      screen.getByText(/Our only product is judgment/)
    ).toBeInTheDocument();
  });

  it("renders all 6 practice cards", () => {
    render(<Practice />);
    expect(screen.getByText("Mold and Water Damage")).toBeInTheDocument();
    expect(screen.getByText("Fire and Smoke Residue")).toBeInTheDocument();
    expect(screen.getByText("Asbestos and Legacy Materials")).toBeInTheDocument();
    expect(screen.getByText("Indoor Air Quality and VOCs")).toBeInTheDocument();
    expect(screen.getByText("Pre-Sale Diligence")).toBeInTheDocument();
    expect(screen.getByText("Contractor Procurement")).toBeInTheDocument();
  });

  it("renders card numbers 01 through 06", () => {
    render(<Practice />);
    ["01", "02", "03", "04", "05", "06"].forEach((num) => {
      expect(screen.getByText(num)).toBeInTheDocument();
    });
  });

  it("renders no contractor invoice statement", () => {
    render(<Practice />);
    expect(
      screen.getByText(/We carry no hammers/)
    ).toBeInTheDocument();
  });
});
