import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Founders } from "@/components/marketing/Founders";

describe("Founders", () => {
  it("renders without crashing", () => {
    render(<Founders />);
    expect(screen.getByTestId("founders")).toBeInTheDocument();
  });

  it("renders both founder names", () => {
    render(<Founders />);
    expect(screen.getByText("Stephen")).toBeInTheDocument();
    expect(screen.getByText("Roman")).toBeInTheDocument();
  });

  it("renders co-founder titles", () => {
    render(<Founders />);
    const titles = screen.getAllByText("CO-FOUNDER");
    expect(titles.length).toBe(2);
  });

  it("renders founder portrait images", () => {
    render(<Founders />);
    const imgs = screen.getAllByRole("img");
    expect(imgs.length).toBe(2);
    expect(imgs[0].getAttribute("src")).toContain("stephen.png");
    expect(imgs[1].getAttribute("src")).toContain("roman.png");
  });

  it("renders the section heading", () => {
    render(<Founders />);
    expect(screen.getByText(/two locals/i)).toBeInTheDocument();
  });

  it("renders the OUR POSITION credo", () => {
    render(<Founders />);
    expect(screen.getByText("OUR POSITION")).toBeInTheDocument();
    expect(
      screen.getByText(/there is no exit interview/i)
    ).toBeInTheDocument();
  });

  it("renders Stephen's quote", () => {
    render(<Founders />);
    expect(
      screen.getByText(/I was born in Malibu/i)
    ).toBeInTheDocument();
  });

  it("renders Roman's quote", () => {
    render(<Founders />);
    expect(
      screen.getByText(/I arrived in Santa Monica/i)
    ).toBeInTheDocument();
  });
});
