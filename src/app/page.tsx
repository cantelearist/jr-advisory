"use client";

import { useRef } from "react";
import { useReveal } from "@/hooks/useReveal";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import {
  Nav,
  Hero,
  Practice,
  Counsel,
  Engagement,
  Discretion,
  Matters,
  ClientOffice,
  Contact,
  SiteFooter,
  CookieBanner,
} from "@/components/marketing";

export default function HomePage() {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref);
  useSmoothScroll();

  return (
    <div
      ref={ref}
      style={{
        background: "var(--bg)",
        color: "var(--fg)",
        minHeight: "100vh",
      }}
    >
      <Nav />
      <Hero />
      <Practice />
      <Counsel />
      <Engagement />
      <Discretion />
      <Matters />
      <ClientOffice />
      <Contact />
      <SiteFooter />
      <CookieBanner />
    </div>
  );
}
