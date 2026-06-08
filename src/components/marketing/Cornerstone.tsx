import React from "react";

const CORNERSTONES = [
  {
    num: "01",
    title: "Privacy",
    text: "NDA-protected engagements. No public client list. Your property and family context stay tightly held — not filed, not referenced, not discussed.",
  },
  {
    num: "02",
    title: "Transparency",
    text: "Every test result, invoice, and report logged to your Private Office. Decisions are reconstructable. Nothing circulates informally.",
  },
  {
    num: "03",
    title: "Concierge",
    text: "A direct line to the founding partner. We limit engagements to six projects annually — intentionally. Judgment cannot be scaled.",
  },
];

export function Cornerstone() {
  return (
    <section id="cornerstones" data-testid="cornerstones" className="cornerstone-section scroll-reveal">
      <div className="page">
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="mono" style={{ opacity: 0.5, marginBottom: 16, fontSize: 11, letterSpacing: ".28em" }}>
            The Cornerstone
          </div>
          <h2 className="h-section" style={{ margin: "0 auto", fontSize: "clamp(36px, 4vw, 56px)", maxWidth: "20ch" }}>
            The terms we don&apos;t <span className="accent-shimmer">negotiate.</span>
          </h2>
        </div>

        <div className="cornerstone-grid">
          {CORNERSTONES.map((item) => (
            <div key={item.num} className="cornerstone-card dossier-panel luxury-hover">
              <div className="mono" style={{ color: "var(--accent)", opacity: 0.6, fontSize: 12, marginBottom: 20 }}>
                {item.num}
              </div>
              <h3 className="display" style={{ fontSize: "clamp(28px, 3vw, 40px)", margin: "0 0 16px", letterSpacing: ".02em" }}>
                {item.title}
              </h3>
              <p className="small-copy" style={{ fontSize: 15, lineHeight: 1.75, opacity: 0.7, margin: 0 }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
