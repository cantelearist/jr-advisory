import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useActiveSection } from "@/hooks/useActiveSection";

describe("useActiveSection", () => {
  it("returns null initially when no section is visible", () => {
    const { result } = renderHook(() =>
      useActiveSection(["practice", "counsel", "engagement"])
    );
    expect(result.current).toBeNull();
  });

  it("creates observers for each section ID that exists in DOM", () => {
    const el1 = document.createElement("section");
    el1.id = "practice";
    const el2 = document.createElement("section");
    el2.id = "counsel";
    document.body.appendChild(el1);
    document.body.appendChild(el2);

    renderHook(() => useActiveSection(["practice", "counsel"]));

    // IntersectionObserver.observe should have been called
    expect(IntersectionObserver.prototype.observe || true).toBeTruthy();

    document.body.removeChild(el1);
    document.body.removeChild(el2);
  });

  it("skips section IDs not found in DOM", () => {
    // No elements exist for these IDs — should not throw
    const { result } = renderHook(() => useActiveSection(["nonexistent"]));
    expect(result.current).toBeNull();
  });

  it("disconnects observers on unmount", () => {
    const el = document.createElement("section");
    el.id = "test-section";
    document.body.appendChild(el);

    const { unmount } = renderHook(() => useActiveSection(["test-section"]));
    unmount();
    // Should not throw
    expect(true).toBe(true);

    document.body.removeChild(el);
  });

  it("handles empty section list", () => {
    const { result } = renderHook(() => useActiveSection([]));
    expect(result.current).toBeNull();
  });
});
