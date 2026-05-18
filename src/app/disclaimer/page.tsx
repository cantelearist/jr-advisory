import React from "react";
import Link from "next/link";

export default function DisclaimerPage() {
  return (
    <div style={{ background: "var(--bg)", color: "var(--fg)", minHeight: "100vh", padding: "120px 24px 80px" }}>
      <div className="page" style={{ maxWidth: 720 }}>
        <Link href="/" className="mono" style={{ color: "var(--accent)", textDecoration: "none", fontSize: 13, letterSpacing: ".2em" }}>
          ← JAMES ROMAN ADVISORY
        </Link>
        <h1 className="h-display" style={{ margin: "32px 0 48px", fontSize: "clamp(32px, 4vw, 56px)" }}>
          Disclaimer
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <p className="small-copy" style={{ opacity: 0.7, lineHeight: 1.8 }}>
            This page is a placeholder. Full legal content will be added before launch.
          </p>
          <p className="small-copy" style={{ opacity: 0.7, lineHeight: 1.8 }}>
            For questions regarding our policies, contact us at{" "}
            <a href="mailto:roman@jamesroman.la" style={{ color: "var(--accent)", textDecoration: "none" }}>
              roman@jamesroman.la
            </a>
          </p>
        </div>
        <div style={{ marginTop: 60, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/" className="btn ghost" style={{ textDecoration: "none" }}>
            ← Return to Site
          </Link>
        </div>
      </div>
    </div>
  );
}
