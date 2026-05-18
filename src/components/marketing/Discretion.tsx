import React from "react";
import { DISCRETION_PRINCIPLES } from "@/lib/constants";

export function Discretion() {
  return (
    <section
      id="discretion"
      data-testid="discretion"
      style={{
        padding: "120px 0 140px",
        borderTop: "1px solid rgba(255,255,255,.06)",
      }}
    >
      <div className="page">
        <div
          className="discretion-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr",
            gap: 80,
            alignItems: "start",
          }}
        >
          <div data-reveal>
            <div className="num" style={{ marginBottom: 24 }}>
              § 04 — DISCRETION
            </div>
            <h2
              className="h-section"
              style={{ margin: 0, maxWidth: "18ch" }}
            >
              The first commitment
              <br />
              <span className="accent-shimmer">we make.</span>
            </h2>
            <p
              className="small-copy"
              style={{ marginTop: 28, fontSize: 17 }}
            >
              An advisor whose name does not return search results next to
              yours. Discretion is not a feature — it is the engagement&apos;s
              first principle.
            </p>
          </div>

          <div data-reveal>
            {DISCRETION_PRINCIPLES.map((principle, i) => (
              <div
                key={principle.numeral}
                className="discretion-row"
                style={{
                  padding: "24px 0",
                  borderTop: "1px solid rgba(255,255,255,.08)",
                  borderBottom:
                    i === DISCRETION_PRINCIPLES.length - 1
                      ? "1px solid rgba(255,255,255,.08)"
                      : "none",
                  display: "grid",
                  gridTemplateColumns: "44px 1fr",
                  gap: 22,
                  alignItems: "baseline",
                }}
              >
                <div
                  className="display"
                  style={{
                    fontSize: 16,
                    letterSpacing: ".08em",
                    color: "rgba(236,230,214,.28)",
                  }}
                >
                  {principle.numeral}
                </div>
                <div>
                  <div
                    className="display"
                    style={{
                      fontSize: 16,
                      letterSpacing: ".10em",
                      marginBottom: 8,
                      fontWeight: 400,
                    }}
                  >
                    {principle.title.toUpperCase()}
                  </div>
                  <p
                    className="small-copy"
                    style={{ fontSize: 15, margin: 0, lineHeight: 1.7 }}
                  >
                    {principle.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
