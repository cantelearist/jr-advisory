import React from "react";

interface PageIntroProps {
  label: string;
  title: string;
  body: string;
}

export function PageIntro({ label, title, body }: PageIntroProps) {
  return (
    <section className="route-hero">
      <div className="page">
        <div className="route-hero-grid">
          <div>
            <div className="num" style={{ marginBottom: 28 }}>
              {label}
            </div>
            <h1 className="h-section" style={{ margin: 0, maxWidth: "18ch" }}>
              {title}
            </h1>
          </div>
          <p className="route-hero-lead">{body}</p>
        </div>
      </div>
    </section>
  );
}
