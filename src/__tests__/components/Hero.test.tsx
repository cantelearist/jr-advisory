import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "@/components/marketing/Hero";
import { SERVICE_AREAS } from "@/lib/constants";

describe("Hero", () => {
  it("renders without crashing", () => {
    render(<Hero />);
    expect(screen.getByTestId("hero")).toBeInTheDocument();
  });

  it("renders the headline 'Counsel.'", () => {
    render(<Hero />);
    expect(screen.getByText("Counsel.")).toBeInTheDocument();
  });

  it("renders 'Not' in muted tone", () => {
    render(<Hero />);
    const notSpan = screen.getByText("Not");
    expect(notSpan).toBeInTheDocument();
    expect(notSpan.style.color).toMatch(/rgba\(236,\s*230,\s*214/);
  });

  it("renders 'contractors.' with accent shimmer", () => {
    render(<Hero />);
    const accent = screen.getByText("contractors.");
    expect(accent).toBeInTheDocument();
    expect(accent.classList.contains("accent-shimmer")).toBe(true);
  });

  it("renders the firm description", () => {
    render(<Hero />);
    expect(
      screen.getByText(/Independent, client-side advisory/)
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
});
