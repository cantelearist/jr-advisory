import React from "react";

export function ClientOffice() {
  return (
    <section data-testid="client-office" style={{ padding: "60px 0 120px" }}>
      <div className="page">
        <div
          data-reveal
          className="gate client-office-layout"
          style={{
            padding: "64px 60px",
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: 56,
            alignItems: "center",
          }}
        >
          <div>
            <div
              className="mono"
              style={{ color: "var(--accent)", marginBottom: 24 }}
            >
              § 07 — PRIVATE CLIENT OFFICE
            </div>
            <h2
              className="h-section"
              style={{
                margin: "0 0 24px",
                fontSize: "clamp(30px, 3vw, 44px)",
              }}
            >
              By invitation
              <br />
              <span className="accent-shimmer">only.</span>
            </h2>
            <p className="small-copy" style={{ margin: 0, fontSize: 19, lineHeight: 1.75 }}>
              Each accepted client receives a dedicated, two-factor-secured
              project space — documents, status, and a controlled communication
              channel. The portal feels like a private office, not a public app.
            </p>
          </div>

          <div
            className="client-office-access"
            style={{
              borderLeft: "1px solid rgba(201,181,138,.25)",
              paddingLeft: 36,
            }}
          >
            <div
              className="display"
              style={{
                fontSize: 17,
                letterSpacing: ".16em",
                marginBottom: 20,
                opacity: 0.75,
              }}
            >
              CLIENT ACCESS
            </div>
            <a
              href="/portal"
              className="btn ghost"
              style={{
                width: "100%",
                justifyContent: "space-between",
              }}
            >
              Enter Client Office <span className="arr">→</span>
            </a>
            <div
              className="mono"
              style={{ marginTop: 18, opacity: 0.55, fontSize: 13 }}
            >
              BY INVITATION ONLY · 2FA REQUIRED
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
