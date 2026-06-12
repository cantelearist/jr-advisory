import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientOffice } from "@/components/marketing/ClientOffice";

describe("ClientOffice", () => {
  it("renders without crashing", () => {
    render(<ClientOffice />);
    expect(screen.getByTestId("client-office")).toBeInTheDocument();
  });

  it("renders the section label", () => {
    render(<ClientOffice />);
    expect(screen.getByText("Concierge Experience")).toBeInTheDocument();
  });

  it("renders the Private Office heading", () => {
    render(<ClientOffice />);
    expect(screen.getByRole("heading", { name: /Your[\s\S]*Private[\s\S]*Office/ })).toBeInTheDocument();
  });

  it("renders 'Private' with accent shimmer in heading", () => {
    render(<ClientOffice />);
    const accent = screen.getByText("Private");
    expect(accent).toBeInTheDocument();
    expect(accent.classList.contains("accent-shimmer")).toBe(true);
  });

  it("renders the dedicated workspace description", () => {
    render(<ClientOffice />);
    expect(
      screen.getByText(/dedicated digital workspace/)
    ).toBeInTheDocument();
  });

  it("renders the access portal link", () => {
    render(<ClientOffice />);
    const link = screen.getByText(/Access private office/);
    expect(link).toBeInTheDocument();
    expect(link.closest("a")?.getAttribute("href")).toBe("/portal");
  });

  it("renders the Restricted portal badge", () => {
    render(<ClientOffice />);
    expect(screen.getByText("Restricted")).toBeInTheDocument();
  });

  it("renders portal stat labels", () => {
    render(<ClientOffice />);
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Site visits")).toBeInTheDocument();
  });
});
