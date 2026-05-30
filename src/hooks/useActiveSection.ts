"use client";

import { useEffect, useState } from "react";

/**
 * Tracks which section is currently in view and returns its ID.
 * Uses IntersectionObserver with a generous rootMargin so the
 * "active" section updates ~20% before the section reaches top.
 */
export function useActiveSection(sectionIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    // Map of section ID → visibility ratio
    const visibleMap = new Map<string, number>();

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visibleMap.set(id, entry.intersectionRatio);
            } else {
              visibleMap.delete(id);
            }
          });

          // Pick the section with the highest visibility
          let bestId: string | null = null;
          let bestRatio = 0;
          visibleMap.forEach((ratio, sId) => {
            if (ratio >= bestRatio) {
              bestRatio = ratio;
              bestId = sId;
            }
          });
          setActiveId(bestId);
        },
        {
          threshold: [0, 0.1, 0.2, 0.4, 0.6],
          rootMargin: "-80px 0px -40% 0px",
        }
      );

      io.observe(el);
      observers.push(io);
    });

    return () => observers.forEach((io) => io.disconnect());
  }, [sectionIds]);

  return activeId;
}
