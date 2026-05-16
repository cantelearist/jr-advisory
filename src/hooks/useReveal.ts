"use client";

import { useEffect, type RefObject } from "react";

/**
 * Observes elements within `ref` that have `[data-reveal]`, `.stage`, or `.mask-reveal`
 * and adds the `in` class when they scroll into view.
 */
export function useReveal(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!ref.current) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    const selectors = "[data-reveal], .stage, .mask-reveal";
    ref.current.querySelectorAll(selectors).forEach((node) => io.observe(node));

    return () => io.disconnect();
  }, [ref]);
}
