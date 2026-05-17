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
      // Desktop + mobile nav both render links
      const links = screen.getAllByText(label);
      expect(links.length).toBeGreaterThanOrEqual(1);
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
    // Desktop shows text "Private Inquiry" with arrow span
    const links = screen.getAllByText("Private Inquiry");
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("nav links point to correct anchor sections", () => {
    render(<Nav />);
    NAV_ITEMS.forEach(({ label, href }) => {
      const links = screen.getAllByText(label);
      // At least one link points to the correct href
      const hasCorrectHref = links.some(
        (link) => link.closest("a")?.getAttribute("href") === href
      );
      expect(hasCorrectHref).toBe(true);
    });
  });

  it("has accessible navigation landmarks", () => {
    render(<Nav />);
    // Desktop nav + mobile nav
    const navs = screen.getAllByRole("navigation");
    expect(navs.length).toBeGreaterThanOrEqual(1);
  });

  it("renders hamburger menu button for mobile", () => {
    render(<Nav />);
    expect(screen.getByLabelText("Toggle menu")).toBeInTheDocument();
  });
});
