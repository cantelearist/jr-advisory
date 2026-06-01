import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("renders brand logo linking to home", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "James Roman Advisory home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("img", { name: "James Roman Advisory" })).toBeInTheDocument();
  });

  it("renders all desktop nav links with correct hrefs", () => {
    render(<SiteHeader />);
    expect(screen.getAllByRole("link", { name: "The Process" })[0]).toHaveAttribute(
      "href",
      "#process",
    );
    expect(screen.getAllByRole("link", { name: "Malibu Story" })[0]).toHaveAttribute(
      "href",
      "#story",
    );
    expect(screen.getAllByRole("link", { name: "Certifications" })[0]).toHaveAttribute(
      "href",
      "#certifications",
    );
  });

  it("renders Private Office CTA linking to /portal", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: /Private Office/i })).toHaveAttribute(
      "href",
      "/portal",
    );
  });

  it("renders the mobile menu trigger", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("button", { name: "Open navigation" })).toBeInTheDocument();
  });

  it("closes the mobile menu when a nav item is selected", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    const menuButton = screen.getByRole("button", { name: "Open navigation" });
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    const mobileLinks = screen.getAllByRole("link", { name: "The Process" });
    await user.click(mobileLinks[mobileLinks.length - 1]);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });
});
