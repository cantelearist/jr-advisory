"use client";

import React, { useRef, useEffect } from "react";
import { Plate } from "./Plate";
import { SERVICE_AREAS, FIRM_DESCRIPTION } from "@/lib/constants";

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const tm = setTimeout(() => {
      ref.current
        ?.querySelectorAll(".stage, [data-reveal], .mask-reveal")
        .forEach((n) => n.classList.add("in"));
    }, 60);
    return () => clearTimeout(tm);
  }, []);

  return (
    <section
      ref={ref}
      data-testid="hero"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Background plate */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Plate
          tag="PLATE I · COASTAL ESCARPMENT"
          label="01 / 06"
          h="100%"
          drift
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(10,11,14,0.55) 0%, rgba(10,11,14,0.2) 35%, rgba(10,11,14,0.85) 100%)",
          }}
        />
        <div className="corners">
          <span className="tl" />
          <span className="tr" />
          <span className="bl" />
          <span className="br" />
        </div>
      </div>

      {/* Content */}
      <div
        className="page"
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "120px 0 60px",
        }}
      >
        <div className="stage" style={{ maxWidth: 1100 }}>
          <div
            className="eyebrow"
            style={{
              marginBottom: 38,
              display: "flex",
              gap: 18,
              alignItems: "center",
            }}
          >
            <span className="chip-dot">Private Engagement · MMXXVI</span>
          </div>

          <h1 className="h-display" style={{ margin: 0 }}>
            Counsel.
            <br />
            <span style={{ color: "rgba(236,230,214,.4)" }}>Not</span>
            <br />
            <span className="accent-shimmer">contractors.</span>
          </h1>

          <p
            className="small-copy"
            style={{ marginTop: 36, maxWidth: "48ch", fontSize: 15 }}
          >
            {FIRM_DESCRIPTION}
          </p>

          <div
            style={{
              marginTop: 44,
              display: "flex",
              gap: 28,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <a href="#practice" className="btn ghost">
              The Practice <span className="arr">→</span>
            </a>
            <a
              href="#contact"
              className="mono inquiry-link"
              style={{
                opacity: 0.65,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Private Inquiry <span className="arr">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Location strip */}
      <div
        style={{ position: "relative", zIndex: 1, padding: "20px 0 28px" }}
        data-reveal
      >
        <div className="hr gold-line" style={{ marginBottom: 20 }} />
        <div
          className="page location-strip"
          style={{ display: "flex", justifyContent: "center", gap: 0 }}
        >
          {SERVICE_AREAS.map((area, i) => (
            <span
              key={area}
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: ".28em",
                opacity: 0.5,
                padding: "0 clamp(8px, 1.2vw, 20px)",
                whiteSpace: "nowrap",
              }}
            >
              {i > 0 && (
                <span
                  style={{
                    opacity: 0.4,
                    marginRight: "clamp(8px, 1.2vw, 20px)",
                  }}
                >
                  /
                </span>
              )}
              {area.toUpperCase()}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
