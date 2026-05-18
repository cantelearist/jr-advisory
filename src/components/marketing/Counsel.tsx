"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { COUNSEL_AREAS } from "@/lib/constants";

export function Counsel() {
  const router = useRouter();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const handleClick = useCallback((idx: number, slug: string) => {
    if (typeof window !== "undefined" && window.innerWidth <= 900) {
      setExpandedIdx(expandedIdx === idx ? null : idx);
    } else {
      router.push(`/counsel/${slug}`);
    }
  }, [expandedIdx, router]);

  return (
    <section
      id="counsel"
      data-testid="counsel"
      style={{
        padding: "120px 0 140px",
        borderTop: "1px solid rgba(255,255,255,.06)",
      }}
    >
      <div className="page">
        <div
          className="section-header"
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            gap: 40,
            marginBottom: 64,
          }}
        >
          <div className="num" data-reveal>
            § 02 — COUNSEL
          </div>
          <div data-reveal>
            <h2
              className="h-section"
              style={{ margin: 0, maxWidth: "22ch" }}
            >
              Where we are
              <br />
              <span className="accent-shimmer">
                most often retained.
              </span>
            </h2>
            <p className="small-copy" style={{ marginTop: 24, fontSize: 17 }}>
              The questions our clients most often bring to us — pre-purchase,
              mid-renovation, or after an event no one expected.
            </p>
          </div>
        </div>

        <div className="practice-grid" data-reveal>
          {COUNSEL_AREAS.map((area, idx) => (
            <div key={area.numeral}>
              <div
                className="practice-cell counsel-area-cell"
                onClick={() => handleClick(idx, area.slug)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") handleClick(idx, area.slug); }}
                style={{ cursor: "pointer" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div
                    className="mono"
                    style={{ color: "var(--accent)", marginBottom: 16 }}
                  >
                    {area.numeral}
                  </div>
                  <span className="counsel-expand-icon" style={{
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: 18,
                    color: "var(--accent)",
                    opacity: 0.5,
                    transition: "transform 0.4s ease, opacity 0.3s ease",
                    transform: expandedIdx === idx ? "rotate(45deg)" : "rotate(0deg)",
                  }}>+</span>
                </div>
                <div
                  className="display"
                  style={{
                    fontSize: 22,
                    letterSpacing: ".03em",
                    marginBottom: 16,
                    fontWeight: 400,
                    lineHeight: 1.2,
                  }}
                >
                  {area.title.toUpperCase()}
                </div>
                <p
                  className="small-copy"
                  style={{ fontSize: 15, margin: 0, lineHeight: 1.7 }}
                >
                  {area.description}
                </p>
              </div>

              {/* Mobile expand */}
              <div
                className="counsel-expand"
                style={{
                  maxHeight: expandedIdx === idx ? 800 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease",
                  opacity: expandedIdx === idx ? 1 : 0,
                  borderBottom: expandedIdx === idx ? "1px solid rgba(201,181,138,.15)" : "none",
                }}
              >
                <div style={{ padding: "24px 0 32px" }}>
                  <p className="small-copy" style={{ fontSize: 15, lineHeight: 1.8, margin: "0 0 20px", opacity: 0.85 }}>
                    {area.detail.overview}
                  </p>
                  <div className="mono" style={{ color: "var(--accent)", marginBottom: 12, fontSize: 10, letterSpacing: ".2em" }}>
                    OUR PROCESS
                  </div>
                  <ul style={{ margin: 0, padding: "0 0 0 18px", listStyle: "none" }}>
                    {area.detail.process.map((step, si) => (
                      <li key={si} style={{
                        fontSize: 14,
                        lineHeight: 1.75,
                        color: "rgba(236,230,214,.72)",
                        padding: "4px 0",
                        position: "relative",
                        paddingLeft: 16,
                      }}>
                        <span style={{ position: "absolute", left: 0, color: "var(--accent)", opacity: 0.5 }}>·</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                  <div className="mono" style={{ marginTop: 20, fontSize: 11, opacity: 0.5 }}>
                    {area.detail.timeline}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
