import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Contact } from "@/components/marketing/Contact";

describe("Contact", () => {
  it("renders without crashing", () => {
    render(<Contact />);
    expect(screen.getByTestId("contact")).toBeInTheDocument();
  });

  it("renders the heading", () => {
    render(<Contact />);
    expect(screen.getByRole("heading", { name: /Request a.*confidential.*consultation/s })).toBeInTheDocument();
  });

  it("renders 'confidential' with accent shimmer", () => {
    render(<Contact />);
    const accent = screen.getByText("confidential");
    expect(accent).toBeInTheDocument();
    expect(accent.classList.contains("accent-shimmer")).toBe(true);
  });

  it("renders the form submit button", () => {
    render(<Contact />);
    expect(screen.getByText(/Submit request/)).toBeInTheDocument();
  });

  it("renders the secure sharing note", () => {
    render(<Contact />);
    expect(
      screen.getByText(/Full document exchange/)
    ).toBeInTheDocument();
  });

  it("renders the consultation form fields", () => {
    render(<Contact />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Brief context")).toBeInTheDocument();
  });
});
