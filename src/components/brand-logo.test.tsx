import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandLogo } from "./brand-logo";

describe("BrandLogo", () => {
  it("renders the transparent James Roman logo asset", () => {
    render(<BrandLogo className="custom-class" priority />);

    const logo = screen.getByRole("img", { name: "James Roman Advisory" });
    expect(logo).toHaveAttribute("src", "/images/jra-logo-transparent.png");
    expect(logo).toHaveClass("custom-class");
  });
});
