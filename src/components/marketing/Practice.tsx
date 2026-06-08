import React from "react";

const PRACTICE_CARDS = [
  {
    num: "01",
    title: "Mold and Water Damage",
    text: "Moisture mapping, containment strategy, clearance standards, and contractor performance reviewed before damage turns into a second problem.",
  },
  {
    num: "02",
    title: "Fire and Smoke Residue",
    text: "Residue testing, odor pathways, cleaning protocols, and documentation tracked so restoration decisions are based on evidence, not pressure.",
  },
  {
    num: "03",
    title: "Asbestos and Legacy Materials",
    text: "Legacy materials identified, sampled, abated, and closed out with the right custody trail before renovation or rebuild work moves forward.",
  },
  {
    num: "04",
    title: "Indoor Air Quality and VOCs",
    text: "Airborne particulate, volatile organic compounds, and post-remediation clearance coordinated with independent testing and readable reporting.",
  },
  {
    num: "05",
    title: "Pre-Sale Diligence",
    text: "Environmental and structural risk reviewed before acquisition, listing, or negotiation so hidden liability does not arrive after the transaction.",
  },
  {
    num: "06",
    title: "Contractor Procurement",
    text: "License, insurance, bonding, scope, and field performance reviewed before any crew steps on site. Every contract questioned before it is signed.",
  },
];

export function Practice() {
  return (
    <section id="practice" data-testid="practice" className="practice-section scroll-reveal">
      <div className="page">
        <div>
          <div className="mono" style={{ opacity: 0.5, marginBottom: 16, fontSize: 11, letterSpacing: ".28em" }}>
            The Practice
          </div>
          <h2 className="h-section" style={{ margin: "0 0 16px", fontSize: "clamp(36px, 4vw, 56px)" }}>
            Advocacy,<br />
            <span className="accent-shimmer">not remediation.</span>
          </h2>
          <p className="small-copy" style={{ maxWidth: "56ch", fontSize: 17, lineHeight: 1.75, opacity: 0.75 }}>
            We carry no hammers and file no invoices for work. Our only product is judgment
            applied exclusively on behalf of the owner.
          </p>
        </div>

        <div className="practice-cards">
          {PRACTICE_CARDS.map((card) => (
            <div key={card.num} className="practice-card dossier-panel luxury-hover">
              <div className="mono" style={{ color: "var(--accent)", opacity: 0.6, fontSize: 12 }}>
                {card.num}
              </div>
              <h3 className="display" style={{ fontSize: "clamp(22px, 2.5vw, 30px)", margin: "16px 0 12px", letterSpacing: ".02em" }}>
                {card.title}
              </h3>
              <p className="small-copy" style={{ fontSize: 15, lineHeight: 1.7, opacity: 0.7, margin: 0 }}>
                {card.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
