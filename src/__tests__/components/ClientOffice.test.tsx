import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientOffice } from "@/components/marketing/ClientOffice";

describe("ClientOffice", () => {
  it("renders without crashing", () => {
    render(<ClientOffice />);
    expect(screen.getByTestId("client-office")).toBeInTheDocument();
  });

  it("renders the section number", () => {
    render(<ClientOffice />);
    expect(
      screen.getByText("§ 06 — PRIVATE CLIENT OFFICE")
    ).toBeInTheDocument();
  });

  it("renders 'By invitation only' heading", () => {
    render(<ClientOffice />);
    expect(screen.getByText("By invitation")).toBeInTheDocument();
    expect(screen.getByText("only.")).toBeInTheDocument();
  });

  it("renders the client portal description", () => {
    render(<ClientOffice />);
    expect(
      screen.getByText(/dedicated, two-factor-secured project space/)
    ).toBeInTheDocument();
  });

  it("renders the 'Enter Client Office' button", () => {
    render(<ClientOffice />);
    expect(screen.getByText("Enter Client Office")).toBeInTheDocument();
  });

  it("renders the 2FA required notice", () => {
    render(<ClientOffice />);
    expect(
      screen.getByText("BY INVITATION ONLY · 2FA REQUIRED")
    ).toBeInTheDocument();
  });

  it("has the gate decorative border", () => {
    render(<ClientOffice />);
    const gate = document.querySelector(".gate");
    expect(gate).not.toBeNull();
  });
});
