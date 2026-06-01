import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("renders brand navigation and the consultation CTA", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "James Roman Advisory home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("img", { name: "James Roman Advisory" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Practice" })).toHaveAttribute("href", "#practice");
    expect(screen.getByRole("link", { name: "Portal" })).toHaveAttribute("href", "#portal");
    expect(screen.getByRole("link", { name: "Consult" })).toHaveAttribute(
      "href",
      "#consultation",
    );
    expect(screen.getByRole("button", { name: "Open navigation" })).toBeInTheDocument();
  });

  it("closes the mobile menu when a navigation item is selected", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    const menuButton = screen.getByRole("button", { name: "Open navigation" });
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getAllByRole("link", { name: "Practice" })[1]);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });
});
