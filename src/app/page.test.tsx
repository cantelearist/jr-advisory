import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home page", () => {
  it("renders the advisory positioning and main conversion paths", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "James Roman Advisory" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("No contractor allegiance").length).toBeGreaterThan(0);
    expect(screen.getByText("No public case theater")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /schedule consultation/i }),
    ).toHaveAttribute("href", "#consultation");
    expect(screen.getByRole("link", { name: /view portal preview/i })).toHaveAttribute(
      "href",
      "/portal",
    );
  });

  it("renders founders, confidentiality, and secure portal content", () => {
    render(<Home />);

    expect(screen.getByText("We do not sell the repair. We protect the person paying for it.")).toBeInTheDocument();
    expect(screen.getByText("Stephen")).toBeInTheDocument();
    expect(screen.getByText("Roman")).toBeInTheDocument();
    expect(screen.getByText("Confidentiality is not a password. It is behavior.")).toBeInTheDocument();
    expect(screen.getByText("A private record room that happens to live online.")).toBeInTheDocument();
  });
});
