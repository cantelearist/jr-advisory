import React from "react";

export function ClientOffice() {
  return (
    <section data-testid="client-office" style={{ padding: "60px 0 120px" }}>
      <div className="page">
        <div
          data-reveal
          className="gate"
          style={{
            padding: "60px 56px",
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            gap: 56,
            alignItems: "center",
          }}
        >
          <div>
            <div
              className="mono"
              style={{ color: "var(--accent)", marginBottom: 22 }}
            >
              § 06 — PRIVATE CLIENT OFFICE
            </div>
            <h2
              className="h-section"
              style={{
                margin: "0 0 22px",
                fontSize: "clamp(28px, 2.8vw, 40px)",
              }}
            >
              By invitation
              <br />
              <span style={{ color: "var(--accent)" }}>only.</span>
            </h2>
            <p className="small-copy" style={{ margin: 0 }}>
              Each accepted client receives a dedicated, two-factor-secured
              project space — documents, status, and a controlled communication
              channel. The portal feels like a private office, not a public app.
            </p>
          </div>

          <div
            style={{
              borderLeft: "1px solid rgba(201,181,138,.25)",
              paddingLeft: 32,
            }}
          >
            <div
              className="display"
              style={{
                fontSize: 13,
                letterSpacing: ".18em",
                marginBottom: 18,
                opacity: 0.7,
              }}
            >
              CLIENT ACCESS
            </div>
            <a
              href="#"
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
              style={{ marginTop: 16, opacity: 0.5, fontSize: 10 }}
            >
              BY INVITATION ONLY · 2FA REQUIRED
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
