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
    expect(screen.getByText(/© James Roman Advisory/)).toBeInTheDocument();
  });

  it("renders footer column headings", () => {
    render(<SiteFooter />);
    expect(screen.getByText("Practice")).toBeInTheDocument();
    expect(screen.getByText("Firm")).toBeInTheDocument();
  });

  it("renders the independence statement", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/Not a contractor/)).toBeInTheDocument();
  });
});
