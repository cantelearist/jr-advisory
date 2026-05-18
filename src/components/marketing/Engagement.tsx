import React from "react";
import { ENGAGEMENT_PHASES } from "@/lib/constants";

export function Engagement() {
  return (
    <section
      id="engagement"
      data-testid="engagement"
      style={{
        padding: "120px 0 140px",
        borderTop: "1px solid rgba(255,255,255,.06)",
        background: "var(--panel)",
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
            § 03 — ENGAGEMENT
          </div>
          <div data-reveal>
            <h2
              className="h-section"
              style={{ margin: 0, maxWidth: "22ch" }}
            >
              Four phases.
              <br />
              <span style={{ color: "rgba(236,230,214,.35)" }}>
                One advocate.
              </span>
            </h2>
            <p className="small-copy" style={{ marginTop: 24, fontSize: 17 }}>
              From the first private call to the final independent clearance —
              one person, one file, no subcontracted judgment.
            </p>
          </div>
        </div>

        <div
          className="engagement-grid"
          data-reveal
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            borderTop: "1px solid rgba(255,255,255,.08)",
            borderBottom: "1px solid rgba(255,255,255,.08)",
          }}
        >
          {ENGAGEMENT_PHASES.map((phase, i) => (
            <div
              key={phase.numeral}
              className="engagement-phase"
              style={{
                padding: "44px 32px",
                borderRight:
                  i < 3
                    ? "1px solid rgba(255,255,255,.08)"
                    : "none",
              }}
            >
              <div
                className="display"
                style={{
                  fontSize: 38,
                  letterSpacing: ".04em",
                  color: "rgba(236,230,214,.22)",
                  marginBottom: 22,
                  lineHeight: 1,
                }}
              >
                {phase.numeral}
              </div>
              <div
                className="mono"
                style={{
                  marginBottom: 16,
                  fontSize: 12,
                  color: "var(--fg)",
                  letterSpacing: ".20em",
                }}
              >
                {phase.title.toUpperCase()}
              </div>
              <p
                className="small-copy"
                style={{ fontSize: 15, margin: 0, lineHeight: 1.7 }}
              >
                {phase.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
