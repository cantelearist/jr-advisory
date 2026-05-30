import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "@/components/marketing/Hero";
import { SERVICE_AREAS, FIRM_DESCRIPTION } from "@/lib/constants";

describe("Hero", () => {
  it("renders without crashing", () => {
    render(<Hero />);
    expect(screen.getByTestId("hero")).toBeInTheDocument();
  });

  it("renders the headline with 'Respond.'", () => {
    render(<Hero />);
    expect(screen.getByText(/Respond\./)).toBeInTheDocument();
  });

  it("renders 'Protect.' with accent shimmer", () => {
    render(<Hero />);
    const accent = screen.getByText("Protect.");
    expect(accent).toBeInTheDocument();
    expect(accent.classList.contains("accent-shimmer")).toBe(true);
  });

  it("renders 'Restore.'", () => {
    render(<Hero />);
    expect(screen.getByText(/Restore\./)).toBeInTheDocument();
  });

  it("renders the firm description", () => {
    render(<Hero />);
    expect(
      screen.getByText(FIRM_DESCRIPTION)
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

  it("renders 'The Practice' CTA button", () => {
    render(<Hero />);
    expect(screen.getByText("The Practice")).toBeInTheDocument();
  });

  it("renders 'Private Inquiry' link", () => {
    render(<Hero />);
    expect(screen.getByText("Private Inquiry")).toBeInTheDocument();
  });

  it("renders the MMXXVI eyebrow", () => {
    render(<Hero />);
    expect(
      screen.getByText("Private Engagement · MMXXVI")
    ).toBeInTheDocument();
  });

  it("includes parallax background wrapper", () => {
    render(<Hero />);
    const hero = screen.getByTestId("hero");
    const parallaxBg = hero.querySelector(".hero-parallax-bg");
    expect(parallaxBg).toBeInTheDocument();
  });
});
