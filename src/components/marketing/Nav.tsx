"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "@/lib/constants";
import { useActiveSection } from "@/hooks/useActiveSection";

const SECTION_IDS = NAV_ITEMS.map((item) =>
  item.href.replace("#", "")
);

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeId = useActiveSection(SECTION_IDS);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when menu open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <header
        data-testid="main-nav"
        className="motion-fade-up"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: scrolled ? "blur(14px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
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

          {/* Desktop nav */}
          <nav
            className="nav-desktop"
            style={{ display: "flex", gap: 36, justifyContent: "center" }}
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map(({ label, href }) => {
              const sectionId = href.replace("#", "");
              return (
                <a
                  key={label}
                  href={href}
                  className={`nav-link ${activeId === sectionId ? "active" : ""}`}
                >
                  {label}
                </a>
              );
            })}
          </nav>

          <div style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: 16 }}>
            {/* Desktop inquiry link */}
            <a
              href="#contact"
              className="mono nav-inquiry-desktop inquiry-link"
              style={{
                fontSize: 13,
                letterSpacing: ".22em",
                opacity: 0.7,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 0",
              }}
            >
              Inquire <span className="arr">→</span>
            </a>

            {/* Mobile hamburger */}
            <button
              className={`nav-hamburger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`mobile-menu ${menuOpen ? "open" : ""}`}
        role="dialog"
        aria-modal={menuOpen}
        aria-label="Navigation menu"
      >
        <nav
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}
          aria-label="Mobile navigation"
        >
          {NAV_ITEMS.map(({ label, href }) => {
            const sectionId = href.replace("#", "");
            return (
              <a
                key={label}
                href={href}
                className={`nav-link ${activeId === sectionId ? "active" : ""}`}
                onClick={closeMenu}
                style={{ fontSize: 17, letterSpacing: ".28em" }}
              >
                {label}
              </a>
            );
          })}
          <div className="hr" style={{ width: 60, margin: "8px 0" }} />
          <a href="#contact" className="btn ghost" onClick={closeMenu}>
            Inquire <span className="arr">→</span>
          </a>
        </nav>
      </div>
    </>
  );
}
