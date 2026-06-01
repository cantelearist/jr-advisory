import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ButtonLink } from "./button-link";

describe("ButtonLink", () => {
  it("renders an anchor with button styling but without fake button semantics", () => {
    render(
      <ButtonLink href="/portal" variant="secondary" size="lg">
        Portal
      </ButtonLink>,
    );

    const link = screen.getByRole("link", { name: "Portal" });
    expect(link).toHaveAttribute("href", "/portal");
    expect(link).not.toHaveAttribute("role", "button");
    expect(link).toHaveClass("bg-secondary");
  });
});
