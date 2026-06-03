"use client";

import { useEffect, useRef, createContext, useContext } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const LenisCtx = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisCtx);

export function SmoothProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Shorter duration on mobile — Lenis inertia fights touch swipe otherwise
    const isMobile = window.innerWidth < 768;
    const lenis = new Lenis({
      duration: isMobile ? 0.85 : 1.35,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  return (
    <LenisCtx.Provider value={lenisRef.current}>
      {children}
    </LenisCtx.Provider>
  );
}
