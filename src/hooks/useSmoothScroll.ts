"use client";

import { useEffect } from "react";

/**
 * Overrides native smooth scroll with a slower, controlled implementation.
 * Intercepts all anchor-link clicks (href="#...") and scrolls at ~40% slower pace.
 */
export function useSmoothScroll() {
  useEffect(() => {
    function easeInOutCubic(t: number): number {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function smoothScrollTo(targetY: number, duration = 1800) {
      const startY = window.scrollY;
      const diff = targetY - startY;
      if (Math.abs(diff) < 1) return;

      let startTime: number | null = null;
      let rafId: number;

      function step(timestamp: number) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);

        window.scrollTo(0, startY + diff * eased);

        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        }
      }

      rafId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(rafId);
    }

    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a[href^='#']");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      // 80px offset for sticky nav
      const top = target.getBoundingClientRect().top + window.scrollY - 80;

      // Duration scales with distance — min 1200ms, max 2400ms
      const distance = Math.abs(top - window.scrollY);
      const duration = Math.min(2400, Math.max(1200, distance * 1.2));

      smoothScrollTo(top, duration);
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);
}
