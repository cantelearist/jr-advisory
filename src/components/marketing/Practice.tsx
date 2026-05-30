"use client";

import React from "react";
import { PRACTICE_STATS } from "@/lib/constants";
import { useCountUp } from "@/hooks/useCountUp";

function NumericStat({
  prefix,
  target,
  suffix,
  accent,
}: {
  prefix: string;
  target: number;
  suffix: string;
  accent?: boolean;
}) {
  const { ref, displayValue } = useCountUp(target, 1800);

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="display stat-counter"
      style={{
        fontSize: 42,
        letterSpacing: ".03em",
        lineHeight: 1,
        ...(accent ? { color: "var(--accent)" } : undefined),
      }}
    >
      {prefix}
      {displayValue}
      {suffix}
    </div>
  );
}

function StaticStat({ value, accent }: { value: string; accent?: boolean }) {
  return (
    <div
      className="display"
      style={{
        fontSize: 42,
        letterSpacing: ".03em",
        lineHeight: 1,
        ...(accent ? { color: "var(--accent)" } : undefined),
      }}
    >
      {value}
    </div>
  );
}

function StatDisplay({ value, accent }: { value: string; accent?: boolean }) {
  const numericMatch = value.match(/^(\$?)(\d+)/);
  if (!numericMatch) {
    return <StaticStat value={value} accent={accent} />;
  }

  const prefix = numericMatch[1] || "";
  const num = parseInt(numericMatch[2], 10);
  const suffix = value.slice(numericMatch[0].length);

  return <NumericStat prefix={prefix} target={num} suffix={suffix} accent={accent} />;
}

export function Practice() {
  return (
    <section id="practice" data-testid="practice" style={{ padding: "160px 0 140px" }}>
      <div className="page">
        <div
          className="practice-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr 300px",
            gap: 48,
            alignItems: "start",
          }}
        >
          <div className="num section-num" data-reveal>
            § 01 — THE PRACTICE
          </div>

          <div data-reveal>
            <h2 className="h-section" style={{ margin: 0 }}>
              A small practice,
              <br />
              <span className="accent-shimmer">privately retained.</span>
            </h2>
            <p
              className="small-copy"
              style={{ marginTop: 32, fontSize: 17, maxWidth: "54ch" }}
            >
              An independent voice between your home and an industry that is,
              candidly, uneven. We accept no fees from contractors — ever. We do
              not bid on the work, sell remediation, or take a position in any
              party performing it.
            </p>
            <p
              className="small-copy"
              style={{ marginTop: 18, fontSize: 17, maxWidth: "54ch" }}
            >
              We are paid by the homeowner. We represent only the homeowner. That
              distinction is the entire firm.
            </p>
          </div>

          <div className="practice-stats" data-reveal style={{ textAlign: "right" }}>
            <div style={{ display: "grid", gap: 28 }}>
              {PRACTICE_STATS.map((stat, i) => (
                <React.Fragment key={stat.label}>
                  {i > 0 && <div className="hr accent" />}
                  <div>
                    <StatDisplay value={stat.value} accent={stat.accent} />
                    <div
                      className="mono"
                      style={{ opacity: 0.55, marginTop: 8 }}
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
