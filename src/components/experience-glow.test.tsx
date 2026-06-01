import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExperienceGlow } from "./experience-glow";

describe("ExperienceGlow", () => {
  it("renders as a non-interactive decorative layer", () => {
    const { container } = render(<ExperienceGlow />);

    const layer = container.firstElementChild;
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer).toHaveClass("pointer-events-none");
    expect(container.querySelector(".experience-glow")).toBeInTheDocument();
  });
});
