import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Practice } from "@/components/marketing/Practice";

describe("Practice", () => {
  it("renders without crashing", () => {
    render(<Practice />);
    expect(screen.getByTestId("practice")).toBeInTheDocument();
  });

  it("renders the section number", () => {
    render(<Practice />);
    expect(screen.getByText("§ 01 — THE PRACTICE")).toBeInTheDocument();
  });

  it("renders 'A small practice' heading", () => {
    render(<Practice />);
    expect(screen.getByText("A small practice,")).toBeInTheDocument();
  });

  it("renders 'privately retained.' with accent shimmer", () => {
    render(<Practice />);
    const accent = screen.getByText("privately retained.");
    expect(accent.classList.contains("accent-shimmer")).toBe(true);
  });

  it("renders the independence statement", () => {
    render(<Practice />);
    expect(
      screen.getByText(/We accept no fees from contractors/)
    ).toBeInTheDocument();
  });

  it("renders 19 years stat", () => {
    render(<Practice />);
    expect(screen.getByText("19")).toBeInTheDocument();
    expect(screen.getByText("Years in industry")).toBeInTheDocument();
  });

  it("renders 4–6 clients stat", () => {
    render(<Practice />);
    expect(screen.getByText("4–6")).toBeInTheDocument();
    expect(screen.getByText("Clients per quarter")).toBeInTheDocument();
  });

  it("renders $0 from contractors stat", () => {
    render(<Practice />);
    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.getByText("From contractors")).toBeInTheDocument();
  });

  it("emphasises homeowner-only representation", () => {
    render(<Practice />);
    expect(
      screen.getByText(/We represent only the homeowner/)
    ).toBeInTheDocument();
  });
});
