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
            style={{ opacity: 0.55, marginBottom: 30 }}
          >
            § 07 — BEGIN
          </div>

          <h2
            className="h-display"
            style={{
              fontSize: "clamp(40px, 5.2vw, 78px)",
              margin: 0,
              maxWidth: "16ch",
            }}
          >
            Begin a private
            <br />
            <span style={{ color: "var(--accent)" }}>consultation.</span>
          </h2>

          <p
            className="small-copy"
            style={{ marginTop: 28, maxWidth: "50ch", fontSize: 15 }}
          >
            Tell us as much or as little as you would like. A response within
            twenty-four hours, from James personally, under standing NDA.
          </p>

          <div
            style={{
              marginTop: 40,
              display: "flex",
              gap: 40,
              flexWrap: "wrap",
              alignItems: "start",
            }}
          >
            <a href="#" className="btn primary">
              Request a Private Consultation <span className="arr">→</span>
            </a>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <div
                  className="mono"
                  style={{ opacity: 0.45, marginBottom: 4 }}
                >
                  Direct
                </div>
                <div style={{ fontSize: 14, opacity: 0.8 }}>
                  {CONTACT_PHONE}
                </div>
              </div>
              <div>
                <div
                  className="mono"
                  style={{ opacity: 0.45, marginBottom: 4 }}
                >
                  Confidential Email
                </div>
                <div style={{ fontSize: 14, opacity: 0.8 }}>
                  {CONTACT_EMAIL}
                </div>
              </div>
            </div>
          </div>

          <div
            className="mono"
            style={{ opacity: 0.4, marginTop: 30, fontSize: 10 }}
          >
            Submission does not create an advisory relationship.{" "}
            {CONTACT_LOCATION}
          </div>
        </div>
      </div>
    </section>
  );
}
