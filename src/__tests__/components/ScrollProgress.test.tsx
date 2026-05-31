import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ScrollProgress } from "@/components/marketing/ScrollProgress";

describe("ScrollProgress", () => {
  it("renders a scroll-progress div", () => {
    const { container } = render(<ScrollProgress />);
    const bar = container.querySelector(".scroll-progress");
    expect(bar).toBeInTheDocument();
  });

  it("sets width to 100%", () => {
    const { container } = render(<ScrollProgress />);
    const bar = container.querySelector(".scroll-progress") as HTMLElement;
    expect(bar.style.width).toBe("100%");
  });

  it("initial scaleX is 0 when page is at top", () => {
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    const { container } = render(<ScrollProgress />);
    const bar = container.querySelector(".scroll-progress") as HTMLElement;
    expect(bar.style.transform).toBe("scaleX(0)");
  });
});
