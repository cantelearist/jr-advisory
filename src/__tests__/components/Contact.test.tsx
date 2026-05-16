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
    expect(screen.getByText("Begin a private")).toBeInTheDocument();
    expect(screen.getByText("consultation.")).toBeInTheDocument();
  });

  it("renders phone number", () => {
    render(<Contact />);
    expect(screen.getByText("+1 (310) 555-0100")).toBeInTheDocument();
  });

  it("renders email", () => {
    render(<Contact />);
    expect(screen.getByText("private@jamesroman.la")).toBeInTheDocument();
  });

  it("renders CTA button", () => {
    render(<Contact />);
    expect(screen.getByText("Request a Private Consultation")).toBeInTheDocument();
  });

  it("renders the legal disclaimer", () => {
    render(<Contact />);
    expect(screen.getByText(/Submission does not create an advisory relationship/)).toBeInTheDocument();
  });
});
