import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BackToTop } from "@/components/marketing/BackToTop";

describe("BackToTop", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it("renders a button with aria-label", () => {
    render(<BackToTop />);
    expect(screen.getByLabelText("Back to top")).toBeInTheDocument();
  });

  it("has back-to-top class", () => {
    render(<BackToTop />);
    const btn = screen.getByLabelText("Back to top");
    expect(btn.classList.contains("back-to-top")).toBe(true);
  });

  it("does not have visible class initially (scrollY=0)", () => {
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    render(<BackToTop />);
    const btn = screen.getByLabelText("Back to top");
    expect(btn.classList.contains("visible")).toBe(false);
  });

  it("calls window.scrollTo on click", () => {
    render(<BackToTop />);
    const btn = screen.getByLabelText("Back to top");
    fireEvent.click(btn);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("contains an SVG arrow icon", () => {
    render(<BackToTop />);
    const btn = screen.getByLabelText("Back to top");
    const svg = btn.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
