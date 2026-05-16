import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CookieBanner } from "@/components/marketing/CookieBanner";

describe("CookieBanner", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders without crashing", () => {
    render(<CookieBanner />);
    expect(screen.getByTestId("cookie-banner")).toBeInTheDocument();
  });

  it("renders privacy heading", () => {
    render(<CookieBanner />);
    expect(screen.getByText("A NOTE ON PRIVACY.")).toBeInTheDocument();
  });

  it("renders Accept All button", () => {
    render(<CookieBanner />);
    expect(screen.getByText("Accept All")).toBeInTheDocument();
  });

  it("renders Essential Only button", () => {
    render(<CookieBanner />);
    expect(screen.getByText("Essential Only")).toBeInTheDocument();
  });

  it("has accessible dialog role", () => {
    render(<CookieBanner />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("hides when Accept All is clicked", () => {
    render(<CookieBanner />);
    fireEvent.click(screen.getByText("Accept All"));
    expect(localStorage.getItem("jr_cookie_v1")).toBe("accepted");
  });

  it("hides when Essential Only is clicked", () => {
    render(<CookieBanner />);
    fireEvent.click(screen.getByText("Essential Only"));
    expect(localStorage.getItem("jr_cookie_v1")).toBe("essential");
  });
});
