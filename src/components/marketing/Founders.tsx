import React from "react";
import { FOUNDERS } from "@/lib/constants";

export function Founders() {
  return (
    <section
      id="founders"
      data-testid="founders"
      style={{ padding: "160px 0 140px" }}
    >
      <div className="page">
        <div className="num section-num" data-reveal>
          § 06 — THE FOUNDERS
        </div>

        <div data-reveal style={{ marginTop: 40, maxWidth: "52ch" }}>
          <h2 className="h-section" style={{ margin: "0 0 28px" }}>
            Two locals,{" "}
            <span className="accent-shimmer">one obligation</span>
            <br />
            to the place they call home.
          </h2>
          <p
            className="small-copy"
            style={{ fontSize: 15, lineHeight: 1.8, opacity: 0.8 }}
          >
            When the smoke clears and the gates open again, someone has to stand
            on your side of it. We do. Not as a secondary concern — as the
            primary one.
          </p>
        </div>

        <div className="hr" style={{ margin: "56px 0" }} />

        <div className="founders-grid">
          {FOUNDERS.map((f) => (
            <div key={f.name} className="founder-card" data-reveal>
              <div className="founder-card-inner">
                <div className="founder-initial display">{f.initial}</div>
                <div>
                  <h3
                    className="display"
                    style={{
                      fontSize: "clamp(22px, 2.2vw, 30px)",
                      margin: "0 0 4px",
                      letterSpacing: ".04em",
                    }}
                  >
                    {f.name}
                  </h3>
                  <div
                    className="mono"
                    style={{
                      color: "var(--accent)",
                      fontSize: 10,
                      marginBottom: 24,
                    }}
                  >
                    {f.title}
                  </div>
                  <p
                    className="small-copy founder-quote"
                    style={{
                      fontSize: 14,
                      lineHeight: 1.85,
                      margin: 0,
                      opacity: 0.85,
                    }}
                  >
                    {f.quote}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hr" style={{ margin: "56px 0" }} />

        <div data-reveal className="founders-credo">
          <div
            className="mono"
            style={{ color: "var(--accent)", marginBottom: 20 }}
          >
            OUR POSITION
          </div>
          <p
            className="small-copy"
            style={{
              fontSize: 15,
              lineHeight: 1.85,
              maxWidth: "60ch",
              margin: 0,
              opacity: 0.85,
            }}
          >
            Between us — over twenty years in construction, architecture, and
            remediation. We&apos;ve seen the care that goes into significant
            homes. We&apos;ve also seen what happens when that care isn&apos;t
            there on the back end. The firm stays small on purpose. Your
            engagement passes through our hands — not a junior&apos;s, not a
            project manager&apos;s. Ours. There is no exit interview from a
            place you call home.
          </p>
        </div>
      </div>
    </section>
  );
}
