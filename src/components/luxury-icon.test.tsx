import { render } from "@testing-library/react";
import { ShieldCheck } from "lucide-react";
import { describe, expect, it } from "vitest";

import { LuxuryIcon } from "./luxury-icon";

describe("LuxuryIcon", () => {
  it("wraps lucide icons as decorative luxury marks", () => {
    const { container } = render(<LuxuryIcon icon={ShieldCheck} className="extra" />);

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass("extra");
    expect(wrapper).toHaveClass("border-primary/20");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
