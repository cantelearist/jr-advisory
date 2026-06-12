import React from "react";
import { CookieBanner } from "./CookieBanner";
import { Nav } from "./Nav";
import { SiteFooter } from "./SiteFooter";

interface PageShellProps {
  children: React.ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div style={{ background: "var(--bg)", color: "var(--fg)", minHeight: "100vh" }}>
      <Nav />
      <main>{children}</main>
      <SiteFooter />
      <CookieBanner />
    </div>
  );
}
