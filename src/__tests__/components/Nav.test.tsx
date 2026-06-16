import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
      const links = screen.getAllByText(label);
      expect(links.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders the logo image", () => {
    render(<Nav />);
    expect(screen.getByAltText("James Roman Advisory")).toBeInTheDocument();
  });

  it("renders the Inquire CTA", () => {
    render(<Nav />);
    const links = screen.getAllByText(/Inquire/);
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("nav links point to correct anchor sections", () => {
    render(<Nav />);
    NAV_ITEMS.forEach(({ label, href }) => {
      const links = screen.getAllByText(label);
      const hasCorrectHref = links.some(
        (link) => link.closest("a")?.getAttribute("href") === href
      );
      expect(hasCorrectHref).toBe(true);
    });
  });

  it("has accessible navigation landmarks", () => {
    render(<Nav />);
    const navs = screen.getAllByRole("navigation");
    expect(navs.length).toBeGreaterThanOrEqual(1);
  });

  it("renders hamburger menu button for mobile", () => {
    render(<Nav />);
    expect(screen.getByLabelText("Toggle menu")).toBeInTheDocument();
  });

  it("toggles hamburger open class on click", () => {
    render(<Nav />);
    const btn = screen.getByLabelText("Toggle menu");
    expect(btn.classList.contains("open")).toBe(false);
    fireEvent.click(btn);
    expect(btn.classList.contains("open")).toBe(true);
    fireEvent.click(btn);
    expect(btn.classList.contains("open")).toBe(false);
  });

  it("nav links have nav-link class for active state styling", () => {
    render(<Nav />);
    const firstLabel = NAV_ITEMS[0].label;
    const links = screen.getAllByText(firstLabel);
    const anchor = links[0].closest("a");
    expect(anchor?.classList.contains("nav-link")).toBe(true);
  });
});
