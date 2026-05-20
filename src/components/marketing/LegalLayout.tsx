import React from "react";
import Link from "next/link";

interface LegalLayoutProps {
  breadcrumb: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  lead: string;
  children: React.ReactNode;
}

export function LegalLayout({
  breadcrumb,
  eyebrow,
  title,
  titleAccent,
  lead,
  children,
}: LegalLayoutProps) {
  return (
    <div style={{ background: "var(--bg)", color: "var(--fg)", minHeight: "100vh" }}>
      {/* Page Hero */}
      <section className="legal-hero">
        <div className="page" style={{ maxWidth: 1440 }}>
          <div className="legal-hero-inner">
            <div>
              <div className="legal-breadcrumb">
                <Link href="/">Home</Link>
                <span className="legal-breadcrumb-sep">·</span>
                {breadcrumb}
              </div>
              <div className="eyebrow" style={{ marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 12 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" style={{ color: "currentColor" }}>
                  <rect x="2.5" y="2.5" width="9" height="9" fill="currentColor" />
                  <rect x="2.5" y="2.5" width="9" height="9" fill="currentColor" transform="rotate(45 7 7)" />
                </svg>
                {eyebrow}
              </div>
              <h1 className="legal-hero-title">
                {title} <em>{titleAccent}</em>
              </h1>
            </div>
            <p className="legal-hero-lead">{lead}</p>
          </div>
        </div>
      </section>

      {/* Article Body */}
      <section style={{ paddingBottom: 80 }}>
        <div className="page" style={{ maxWidth: 860, margin: "0 auto" }}>
          <article className="legal-article">
            {children}
          </article>

          <div style={{ marginTop: 80, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Link href="/" className="btn ghost" style={{ textDecoration: "none" }}>
              ← Return to Site
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        .legal-hero {
          padding-top: 120px;
          padding-bottom: 0;
          background: var(--bg);
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .legal-hero-inner {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 64px;
          align-items: end;
          padding-bottom: 64px;
        }
        .legal-breadcrumb {
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(236,230,214,0.4);
          font-weight: 400;
          margin-bottom: 20px;
        }
        .legal-breadcrumb a {
          color: rgba(236,230,214,0.4);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: all 0.3s ease;
        }
        .legal-breadcrumb a:hover {
          color: var(--fg);
        }
        .legal-breadcrumb-sep {
          margin: 0 10px;
        }
        .legal-hero-title {
          font-family: var(--font-body), system-ui, sans-serif;
          font-weight: 200;
          font-size: clamp(1.4rem, 3.15vw, 3.15rem);
          line-height: 1.05;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin: 16px 0 0;
          color: var(--fg);
        }
        .legal-hero-title em {
          font-style: normal;
          color: rgba(236,230,214,0.55);
        }
        .legal-hero-lead {
          font-family: var(--font-display);
          font-weight: 300;
          font-size: clamp(1.125rem, 1.6vw, 1.4rem);
          line-height: 1.55;
          color: rgba(236,230,214,0.65);
          margin: 0;
          max-width: 40ch;
        }

        @media (max-width: 900px) {
          .legal-hero-inner {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .legal-hero {
            padding-top: 100px;
          }
        }
      `}</style>
    </div>
  );
}
