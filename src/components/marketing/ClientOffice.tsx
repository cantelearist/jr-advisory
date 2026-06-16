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
              The Private Office
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
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".2em", opacity: 0.5 }}>The Private Office</div>
                <div className="display" style={{ fontSize: 20, letterSpacing: ".02em", marginTop: 4 }}>Engagement file</div>
                <div style={{ fontSize: 13, opacity: 0.5, marginTop: 4 }}>Malibu estate · Active · Week 7</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div className="portal-badge">Sample engagement</div>
                <div className="portal-badge" style={{ color: "rgba(255,255,255,0.55)", opacity: 0.55 }}>Restricted access</div>
              </div>
            </div>

            <div className="portal-stats">
              <div className="portal-stat">
                <div className="display" style={{ fontSize: 28, letterSpacing: ".02em" }}>64<span style={{ fontSize: 16 }}>%</span></div>
                <div className="mono" style={{ fontSize: 9, opacity: 0.5, marginTop: 4 }}>Progress</div>
              </div>
              <div className="portal-stat">
                <div className="display" style={{ fontSize: 28, letterSpacing: ".02em" }}>24</div>
                <div className="mono" style={{ fontSize: 9, opacity: 0.5, marginTop: 4 }}>Documents logged</div>
              </div>
              <div className="portal-stat">
                <div className="display" style={{ fontSize: 28, letterSpacing: ".02em" }}>9</div>
                <div className="mono" style={{ fontSize: 9, opacity: 0.5, marginTop: 4 }}>Site visits</div>
              </div>
            </div>

            <div className="portal-items">
              <div className="portal-item">
                <span>Chain of custody</span>
                <span style={{ color: "var(--accent)" }}>Intact</span>
              </div>
              <div className="portal-item">
                <span>Evidence review</span>
                <span style={{ color: "var(--accent)" }}>Current</span>
              </div>
              <div className="portal-item">
                <span>Client sign-offs</span>
                <span style={{ color: "var(--accent)" }}>Current</span>
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
                <div className="mono" style={{ fontSize: 9, opacity: 0.5, marginBottom: 12 }}>Airborne asbestos</div>
                <div className="mono" style={{ fontSize: 18, color: "var(--text)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  0.008 f/cc
                </div>
                <div style={{ fontSize: 10, color: "var(--accent)", opacity: 0.6, marginTop: 8 }}>
                  Below the 0.01 f/cc clearance limit
                </div>
                <div className="mono" style={{ fontSize: 8, opacity: 0.38, marginTop: 4 }}>
                  independent PCM
                </div>
              </div>
            </div>
            <div className="portal-items">
              <div className="portal-item">
                <span>Site safety</span>
                <span style={{ color: "var(--accent)" }}>All personnel cleared</span>
              </div>
              <div className="portal-item">
                <span>Asbestos notification</span>
                <span style={{ color: "var(--accent)" }}>SCAQMD Rule 1403 · filed · #····7743</span>
              </div>
              <div className="portal-item">
                <span>Next milestone</span>
                <span style={{ color: "var(--accent)" }}>Independent clearance test · Week 8</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
