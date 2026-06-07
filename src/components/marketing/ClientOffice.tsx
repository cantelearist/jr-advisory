import React from "react";
import Image from "next/image";

export function ClientOffice() {
  return (
    <section id="private-office" data-testid="client-office" className="private-office-section">
      {/* Ocean sunset background */}
      <div className="private-office-bg">
        <Image
          src="/images/malibu-mountains-ocean-sunset.jpg"
          alt="Malibu mountains and ocean at sunset"
          fill
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
        <div className="private-office-overlay" />
      </div>

      <div className="page" style={{ position: "relative", zIndex: 1 }}>
        <div className="private-office-layout">
          {/* Left: text */}
          <div className="private-office-text" data-reveal>
            <div className="mono" style={{ color: "var(--accent)", opacity: 0.7, marginBottom: 16, fontSize: 11, letterSpacing: ".28em" }}>
              Concierge Experience
            </div>
            <h2 className="h-section" style={{ margin: "0 0 20px", fontSize: "clamp(36px, 4vw, 56px)" }}>
              Your <span className="accent-shimmer">Private</span><br />Office.
            </h2>
            <p className="small-copy" style={{ fontSize: 17, lineHeight: 1.75, opacity: 0.75, maxWidth: "40ch" }}>
              Every client receives a dedicated digital workspace —
              real-time transparency on compliance status, document
              custody, and site activity. Nothing circulates informally.
            </p>
            <a href="/portal" className="mono inquiry-link" style={{ marginTop: 32, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, letterSpacing: ".22em", opacity: 0.6 }}>
              Access private office <span className="arr">→</span>
            </a>
          </div>

          {/* Right: portal mockup card */}
          <div className="portal-card" data-reveal style={{ "--rd": "300ms" } as React.CSSProperties}>
            <div className="portal-card-header">
              <div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".2em", opacity: 0.5 }}>Client portal</div>
                <div className="display" style={{ fontSize: 20, letterSpacing: ".02em", marginTop: 4 }}>Engagement file</div>
                <div style={{ fontSize: 13, opacity: 0.5, marginTop: 4 }}>Broad Beach Rd · Active · Week 7</div>
              </div>
              <div className="portal-badge">Restricted</div>
            </div>

            <div className="portal-stats">
              <div className="portal-stat">
                <div className="display" style={{ fontSize: 28, letterSpacing: ".02em" }}>100<span style={{ fontSize: 16 }}>%</span></div>
                <div className="mono" style={{ fontSize: 9, opacity: 0.5, marginTop: 4 }}>Progress</div>
              </div>
              <div className="portal-stat">
                <div className="display" style={{ fontSize: 28, letterSpacing: ".02em" }}>28</div>
                <div className="mono" style={{ fontSize: 9, opacity: 0.5, marginTop: 4 }}>Documents</div>
              </div>
              <div className="portal-stat">
                <div className="display" style={{ fontSize: 28, letterSpacing: ".02em" }}>14</div>
                <div className="mono" style={{ fontSize: 9, opacity: 0.5, marginTop: 4 }}>Site visits</div>
              </div>
            </div>

            <div className="portal-items">
              <div className="portal-item">
                <span>Evidence review</span>
                <span style={{ color: "var(--accent)" }}>100%</span>
              </div>
              <div className="portal-item">
                <span>Document custody</span>
                <span style={{ color: "var(--accent)" }}>100%</span>
              </div>
              <div className="portal-item">
                <span>Client clearance</span>
                <span style={{ color: "var(--accent)" }}>100%</span>
              </div>
            </div>

            <div className="portal-charts">
              <div className="portal-chart-section">
                <div className="mono" style={{ fontSize: 9, opacity: 0.5, marginBottom: 12 }}>Weekly activity</div>
                <div className="portal-bar-chart">
                  {["M","T","W","T","F","S","S"].map((d, i) => (
                    <div key={`${d}-${i}`} className="portal-bar-col">
                      <div className="portal-bar" style={{ height: [18, 24, 14, 30, 22, 8, 4][i] }} />
                      <span style={{ fontSize: 9, opacity: 0.4, marginTop: 4 }}>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="portal-chart-section">
                <div className="mono" style={{ fontSize: 9, opacity: 0.5, marginBottom: 12 }}>Air quality mg/m³</div>
                <svg viewBox="0 0 120 40" className="portal-line-chart">
                  <polyline
                    points="0,35 20,30 40,25 60,20 80,22 100,15 120,10"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    opacity="0.6"
                  />
                </svg>
                <div style={{ fontSize: 10, opacity: 0.4, marginTop: 4 }}>
                  0.003 — Below EPA threshold
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
