import React from "react";
import {
  CONTACT_PHONE,
  CONTACT_EMAIL,
  CONTACT_LOCATION,
} from "@/lib/constants";

export function Contact() {
  return (
    <section
      id="contact"
      data-testid="contact"
      style={{
        padding: "160px 0 180px",
        borderTop: "1px solid rgba(255,255,255,.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="page" style={{ position: "relative" }}>
        <div data-reveal>
          <div
            className="mono"
            style={{ opacity: 0.6, marginBottom: 34 }}
          >
            § 07 — BEGIN
          </div>

          <h2
            className="h-section"
            style={{
              margin: 0,
              maxWidth: "16ch",
            }}
          >
            Begin a private
            <br />
            <span className="accent-shimmer">consultation.</span>
          </h2>

          <p
            className="small-copy"
            style={{ marginTop: 32, maxWidth: "50ch", fontSize: 18, lineHeight: 1.8 }}
          >
            Tell us as much or as little as you would like. A response within
            twenty-four hours, from James personally, under standing NDA.
          </p>

          <div
            className="contact-actions"
            style={{
              marginTop: 44,
              display: "flex",
              gap: 28,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <a href="mailto:roman@jamesroman.la" className="btn primary cta-pulse">
              Request a Private Consultation <span className="arr">→</span>
            </a>
            <a href="/portal" className="btn ghost">
              Client Office <span className="arr">→</span>
            </a>
          </div>

          <div
            style={{
              marginTop: 44,
              display: "flex",
              gap: 44,
              flexWrap: "wrap",
              alignItems: "start",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <div>
                <div
                  className="mono"
                  style={{ opacity: 0.5, marginBottom: 6 }}
                >
                  Direct
                </div>
                <a href="tel:+13104302500" style={{ fontSize: 17, opacity: 0.85, color: "inherit", textDecoration: "none" }}>
                  {CONTACT_PHONE}
                </a>
              </div>
              <div>
                <div
                  className="mono"
                  style={{ opacity: 0.5, marginBottom: 6 }}
                >
                  Confidential Email
                </div>
                <a href="mailto:roman@jamesroman.la" style={{ fontSize: 17, opacity: 0.85, color: "inherit", textDecoration: "none" }}>
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>
          </div>

          <div
            className="mono"
            style={{ opacity: 0.45, marginTop: 34, fontSize: 13 }}
          >
            Submission does not create an advisory relationship.{" "}
            {CONTACT_LOCATION}
          </div>
        </div>
      </div>
    </section>
  );
}
