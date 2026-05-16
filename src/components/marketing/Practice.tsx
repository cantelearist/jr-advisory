import React from "react";
import { PRACTICE_STATS } from "@/lib/constants";

export function Practice() {
  return (
    <section id="practice" data-testid="practice" style={{ padding: "160px 0 140px" }}>
      <div className="page">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr 280px",
            gap: 40,
            alignItems: "start",
          }}
        >
          <div className="num" data-reveal>
            § 01 — THE PRACTICE
          </div>

          <div data-reveal>
            <h2 className="h-section" style={{ margin: 0 }}>
              A small practice,
              <br />
              <span style={{ color: "var(--accent)" }}>privately retained.</span>
            </h2>
            <p
              className="small-copy"
              style={{ marginTop: 28, fontSize: 15, maxWidth: "54ch" }}
            >
              An independent voice between your home and an industry that is,
              candidly, uneven. We accept no fees from contractors — ever. We do
              not bid on the work, sell remediation, or take a position in any
              party performing it.
            </p>
            <p
              className="small-copy"
              style={{ marginTop: 16, fontSize: 15, maxWidth: "54ch" }}
            >
              We are paid by the homeowner. We represent only the homeowner. That
              distinction is the entire firm.
            </p>
          </div>

          <div data-reveal style={{ textAlign: "right" }}>
            <div style={{ display: "grid", gap: 24 }}>
              {PRACTICE_STATS.map((stat, i) => (
                <React.Fragment key={stat.label}>
                  {i > 0 && <div className="hr accent" />}
                  <div>
                    <div
                      className="display"
                      style={{
                        fontSize: 36,
                        letterSpacing: ".04em",
                        lineHeight: 1,
                        ...(stat.accent
                          ? { color: "var(--accent)" }
                          : undefined),
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      className="mono"
                      style={{ opacity: 0.5, marginTop: 6 }}
                    >
                      {stat.label}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
