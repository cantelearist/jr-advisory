"use client";

import React, { useState, useEffect } from "react";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "@/lib/constants";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="main-nav"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: scrolled ? "blur(14px)" : "none",
        background: scrolled ? "rgba(10,11,14,0.72)" : "transparent",
        borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.06)" : "transparent"}`,
        transition:
          "background .5s ease, border-color .5s ease, backdrop-filter .5s ease",
      }}
    >
      <div
        className="page"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "20px 0",
        }}
      >
        <Logo />

        <nav
          style={{ display: "flex", gap: 36, justifyContent: "center" }}
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map(({ label, href }) => (
            <a key={label} href={href} className="nav-link">
              {label}
            </a>
          ))}
        </nav>

        <div style={{ justifySelf: "end" }}>
          <a
            href="#contact"
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: ".22em",
              opacity: 0.7,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 0",
              transition: "opacity .3s, color .3s",
            }}
          >
            Private Inquiry <span className="arr">→</span>
          </a>
        </div>
      </div>
    </header>
  );
}
