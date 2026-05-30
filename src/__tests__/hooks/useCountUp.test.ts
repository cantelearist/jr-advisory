import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCountUp } from "@/hooks/useCountUp";

describe("useCountUp", () => {
  it("returns displayValue starting at 0", () => {
    const { result } = renderHook(() => useCountUp(100));
    expect(result.current.displayValue).toBe(0);
  });

  it("returns a ref object", () => {
    const { result } = renderHook(() => useCountUp(100));
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull();
  });

  it("accepts custom duration and threshold", () => {
    const { result } = renderHook(() => useCountUp(50, 3000, { threshold: 0.5 }));
    expect(result.current.displayValue).toBe(0);
  });

  it("target of 0 keeps displayValue at 0", () => {
    const { result } = renderHook(() => useCountUp(0));
    expect(result.current.displayValue).toBe(0);
  });

  it("re-renders without error on target change", () => {
    const { result, rerender } = renderHook(
      ({ target }) => useCountUp(target),
      { initialProps: { target: 10 } }
    );
    expect(result.current.displayValue).toBe(0);
    rerender({ target: 20 });
    expect(result.current.displayValue).toBe(0);
  });
});
