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
              <span style={{ color: "var(--accent)" }}>we make.</span>
            </h2>
            <p
              className="small-copy"
              style={{ marginTop: 24, fontSize: 15 }}
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
                style={{
                  padding: "22px 0",
                  borderTop: "1px solid rgba(255,255,255,.08)",
                  borderBottom:
                    i === DISCRETION_PRINCIPLES.length - 1
                      ? "1px solid rgba(255,255,255,.08)"
                      : "none",
                  display: "grid",
                  gridTemplateColumns: "40px 1fr",
                  gap: 20,
                  alignItems: "baseline",
                }}
              >
                <div
                  className="display"
                  style={{
                    fontSize: 14,
                    letterSpacing: ".1em",
                    color: "rgba(236,230,214,.25)",
                  }}
                >
                  {principle.numeral}
                </div>
                <div>
                  <div
                    className="display"
                    style={{
                      fontSize: 14,
                      letterSpacing: ".12em",
                      marginBottom: 6,
                      fontWeight: 300,
                    }}
                  >
                    {principle.title.toUpperCase()}
                  </div>
                  <p
                    className="small-copy"
                    style={{ fontSize: 13, margin: 0 }}
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
