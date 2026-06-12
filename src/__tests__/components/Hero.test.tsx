import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "@/components/marketing/Hero";
import { SERVICE_AREAS } from "@/lib/constants";

describe("Hero", () => {
  it("renders without crashing", () => {
    render(<Hero />);
    expect(screen.getByTestId("hero")).toBeInTheDocument();
  });

  it("renders the main headline", () => {
    render(<Hero />);
    expect(screen.getByText(/Protecting/)).toBeInTheDocument();
  });

  it("renders 'Home.' with accent shimmer", () => {
    render(<Hero />);
    const accent = screen.getByText("Home.");
    expect(accent).toBeInTheDocument();
    expect(accent.classList.contains("accent-shimmer")).toBe(true);
  });

  it("renders the owner-side advisory eyebrow", () => {
    render(<Hero />);
    expect(
      screen.getByText(/Owner-side advisory/)
    ).toBeInTheDocument();
  });

  it("renders all service area locations in marquee", () => {
    render(<Hero />);
    SERVICE_AREAS.forEach((area) => {
      // Duplicated for seamless marquee loop
      const matches = screen.getAllByText(area.toUpperCase());
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("renders a link to the practice section", () => {
    render(<Hero />);
    const link = screen.getByText(/View practice/);
    expect(link).toBeInTheDocument();
    expect(link.closest("a")?.getAttribute("href")).toBe("#practice");
  });

  it("renders the location description", () => {
    render(<Hero />);
    expect(screen.getByText(/Los Angeles coastal estates/)).toBeInTheDocument();
  });

  it("renders the hero background element", () => {
    render(<Hero />);
    const hero = screen.getByTestId("hero");
    const bg = hero.querySelector(".hero-bg");
    expect(bg).toBeInTheDocument();
  });
});
