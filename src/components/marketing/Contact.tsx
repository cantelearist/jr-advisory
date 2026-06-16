"use client";

import React, { useState } from "react";

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", market: "", matter: "", context: "" });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { name?: string; email?: string } = {};
    const email = form.email.trim();

    if (!form.name.trim()) nextErrors.name = "We'll need your name.";
    if (!email) {
      nextErrors.email = "An email so we can reach you.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "That email looks off — worth a second glance.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Client-side only — no backend submission yet
    setSubmitted(true);
  };

  return (
    <section id="contact" data-testid="contact" className="contact-section">
      <div className="page">
        <div className="contact-layout">
          {/* Left: heading + badges */}
          <div className="contact-text" data-reveal>
            <div className="mono" style={{ opacity: 0.5, marginBottom: 16, fontSize: 11, letterSpacing: ".28em" }}>
              Get in touch
            </div>
            <h2 className="h-section" style={{ margin: "0 0 24px", fontSize: "clamp(36px, 4vw, 56px)" }}>
              Request a<br />
              <span className="accent-shimmer">confidential</span><br />
              consultation.
            </h2>
            <p className="small-copy" style={{ fontSize: 17, lineHeight: 1.75, opacity: 0.75, maxWidth: "40ch" }}>
              Share only what is necessary. Full document exchange
              happens after an engagement is accepted and secure
              client access is issued.
            </p>
            <div className="contact-badges">
              <span className="contact-badge">No portal trackers</span>
            </div>
          </div>

          {/* Right: consultation form */}
          <div className="contact-form-wrap" data-reveal style={{ "--rd": "200ms" } as React.CSSProperties}>
            {submitted ? (
              <div className="contact-form-success">
                <h3 className="display" style={{ fontSize: 28, marginBottom: 16 }}>Received.</h3>
                <p className="small-copy" style={{ opacity: 0.7 }}>
                  A founding partner reviews every inquiry personally — usually within two business days. If it&apos;s a fit,
                  we&apos;ll arrange a confidential consultation. If it isn&apos;t, we&apos;ll tell you that quickly, and point you somewhere useful if we can.
                </p>
                <p className="small-copy" style={{ opacity: 0.62, marginTop: 16 }}>
                  No need to send anything yet. Secure document exchange opens only once an engagement is accepted.
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 24 }}>
                  <h3 className="display" style={{ fontSize: 22, letterSpacing: ".02em", marginBottom: 8 }}>
                    Consultation request
                  </h3>
                  <p className="small-copy" style={{ fontSize: 14, opacity: 0.6 }}>
                    Submissions are validated locally and prepared for secure advisor review.
                  </p>
                </div>
                <form onSubmit={handleSubmit} noValidate className="consultation-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="mono form-label">Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        aria-invalid={errors.name ? "true" : "false"}
                      />
                      {errors.name ? <p className="small-copy" role="alert" style={{ fontSize: 13, opacity: 0.8 }}>{errors.name}</p> : null}
                    </div>
                    <div className="form-group">
                      <label className="mono form-label">Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        aria-invalid={errors.email ? "true" : "false"}
                      />
                      {errors.email ? <p className="small-copy" role="alert" style={{ fontSize: 13, opacity: 0.8 }}>{errors.email}</p> : null}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="mono form-label">Property location</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Malibu, Bel Air, Beverly Hills..."
                        value={form.market}
                        onChange={(e) => setForm({ ...form, market: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="mono form-label">Matter type</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Remediation, structural, diligence..."
                        value={form.matter}
                        onChange={(e) => setForm({ ...form, matter: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="mono form-label">Brief context</label>
                    <textarea
                      className="form-input form-textarea"
                      rows={4}
                      value={form.context}
                      onChange={(e) => setForm({ ...form, context: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn primary" style={{ marginTop: 8 }}>
                    Request consultation <span className="arr">→</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
