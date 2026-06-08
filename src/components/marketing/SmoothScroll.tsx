"use client";

import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    let lenis: any = null;
    let rafId: number;

    async function init() {
      try {
        const Lenis = (await import("lenis")).default;
        const isMobile = window.innerWidth < 768;
        lenis = new Lenis({
          duration: isMobile ? 0.85 : 1.35,
          easing: (t: number) => 1 - Math.pow(1 - t, 4),
          smoothWheel: true,
        });

        function raf(time: number) {
          lenis?.raf(time);
          rafId = requestAnimationFrame(raf);
        }
        rafId = requestAnimationFrame(raf);
      } catch {
        // lenis not installed — graceful fallback, scroll works normally
      }
    }

    init();
    return () => {
      lenis?.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}
