import React from "react";
import { Logo } from "./Logo";
import { FOOTER_COLUMNS, FIRM_YEAR } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer data-testid="site-footer">
      <div className="page">
        <div
          className="footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
            gap: 40,
            marginBottom: 60,
          }}
        >
          <div className="footer-brand">
            <Logo />
            <p
              className="small-copy"
              style={{
                marginTop: 24,
                maxWidth: "34ch",
                fontSize: 12,
              }}
            >
              Private advisory for hazardous-material remediation oversight and
              property-integrity matters in luxury properties across Malibu,
              Santa Monica, Pacific Palisades, Beverly Hills, Bel Air, and
              Brentwood.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <div
                className="mono"
                style={{ opacity: 0.55, marginBottom: 16 }}
              >
                {col.heading}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {col.items.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="footer-link"
                    style={{ fontSize: 13, opacity: 0.8 }}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="hr" style={{ marginBottom: 24 }} />

        <div
          className="mono footer-bottom"
          style={{
            display: "flex",
            justifyContent: "space-between",
            opacity: 0.5,
            fontSize: 10,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span>
            © James Roman Advisory · {FIRM_YEAR} · All Rights Reserved
          </span>
          <span>
            An independent advisory representative. Not a contractor.
          </span>
          <span>Los Angeles · California</span>
        </div>
      </div>
    </footer>
  );
}
