import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Founders } from "@/components/marketing/Founders";

describe("Founders", () => {
  it("renders without crashing", () => {
    render(<Founders />);
    expect(screen.getByTestId("founders")).toBeInTheDocument();
  });

  it("renders the section label", () => {
    render(<Founders />);
    expect(screen.getByText("The Origin")).toBeInTheDocument();
  });

  it("renders the origin headline", () => {
    render(<Founders />);
    expect(screen.getByText(/Twice in thirty years/)).toBeInTheDocument();
  });

  it("renders the founders combined portrait image", () => {
    render(<Founders />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toContain("founders-malibu-beach");
  });

  it("renders the founders caption", () => {
    render(<Founders />);
    expect(screen.getByText(/Roman.*Stephen.*Malibu/)).toBeInTheDocument();
  });

  it("renders Stephen's story", () => {
    render(<Founders />);
    expect(
      screen.getByText(/Stephen was born in Malibu/)
    ).toBeInTheDocument();
  });

  it("renders Roman's story", () => {
    render(<Founders />);
    expect(
      screen.getByText(/Roman spent years overseeing construction/)
    ).toBeInTheDocument();
  });

  it("renders the firm founding context", () => {
    render(<Founders />);
    expect(
      screen.getByText(/James Roman Advisory exists because both of them needed it/)
    ).toBeInTheDocument();
  });
});
