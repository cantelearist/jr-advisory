"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number counting up from 0 when the element enters the viewport.
 * Returns { ref, displayValue }.
 */
export function useCountUp(
  target: number,
  duration = 2000,
  options?: { threshold?: number }
) {
  const ref = useRef<HTMLElement>(null);
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current || hasAnimated.current) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            io.disconnect();

            const startTime = performance.now();

            function tick(now: number) {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // ease-out cubic
              const eased = 1 - Math.pow(1 - progress, 3);
              setValue(Math.round(eased * target));

              if (progress < 1) {
                requestAnimationFrame(tick);
              }
            }

            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: options?.threshold ?? 0.3 }
    );

    io.observe(ref.current);
    return () => io.disconnect();
  }, [target, duration, options?.threshold]);

  return { ref, displayValue: value };
}
