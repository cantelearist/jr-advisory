import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Nav } from "@/components/marketing/Nav";
import { NAV_ITEMS } from "@/lib/constants";

describe("Nav", () => {
  it("renders without crashing", () => {
    render(<Nav />);
    expect(screen.getByTestId("main-nav")).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    render(<Nav />);
    NAV_ITEMS.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("renders the JR logo mark", () => {
    render(<Nav />);
    expect(screen.getByText("JR")).toBeInTheDocument();
  });

  it("renders JAMES ROMAN brand name", () => {
    render(<Nav />);
    expect(screen.getByText("JAMES ROMAN")).toBeInTheDocument();
  });

  it("renders the Private Inquiry CTA", () => {
    render(<Nav />);
    expect(screen.getByText("Private Inquiry")).toBeInTheDocument();
  });

  it("nav links point to correct anchor sections", () => {
    render(<Nav />);
    NAV_ITEMS.forEach(({ label, href }) => {
      const link = screen.getByText(label);
      expect(link.closest("a")).toHaveAttribute("href", href);
    });
  });

  it("has accessible navigation landmark", () => {
    render(<Nav />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
