import React from "react";
import { COUNSEL_AREAS } from "@/lib/constants";

export function Counsel() {
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
            <p className="small-copy" style={{ marginTop: 20 }}>
              The questions our clients most often bring to us — pre-purchase,
              mid-renovation, or after an event no one expected.
            </p>
          </div>
        </div>

        <div className="practice-grid" data-reveal>
          {COUNSEL_AREAS.map((area) => (
            <div key={area.numeral} className="practice-cell">
              <div
                className="mono"
                style={{ color: "var(--accent)", marginBottom: 14 }}
              >
                {area.numeral}
              </div>
              <div
                className="display"
                style={{
                  fontSize: 19,
                  letterSpacing: ".04em",
                  marginBottom: 14,
                  fontWeight: 300,
                  lineHeight: 1.2,
                }}
              >
                {area.title.toUpperCase()}
              </div>
              <p
                className="small-copy"
                style={{ fontSize: 13, margin: 0 }}
              >
                {area.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
