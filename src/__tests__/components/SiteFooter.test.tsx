import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "@/components/marketing/SiteFooter";

describe("SiteFooter", () => {
  it("renders without crashing", () => {
    render(<SiteFooter />);
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
  });

  it("renders the copyright", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/© 2026 James Roman Advisory/)).toBeInTheDocument();
  });

  it("renders footer nav links", () => {
    render(<SiteFooter />);
    expect(screen.getByText("Practice")).toBeInTheDocument();
    expect(screen.getByText("Origin")).toBeInTheDocument();
    expect(screen.getByText("The Cornerstone")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("renders the location tagline", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/Malibu, California/)).toBeInTheDocument();
  });
});
