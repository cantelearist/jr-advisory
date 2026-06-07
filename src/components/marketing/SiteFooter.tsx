import React from "react";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer data-testid="site-footer" className="site-footer">
      <div className="page">
        <div className="footer-content">
          <div className="footer-left">
            <Image
              src="/images/jra-logo-transparent.png"
              alt="James Roman Advisory"
              width={92}
              height={38}
              style={{ height: 30, width: "auto", objectFit: "contain", opacity: 0.8 }}
            />
            <div className="footer-copy">
              <p>© 2026 James Roman Advisory LLC</p>
              <p style={{ fontSize: 12, opacity: 0.5 }}>
                Malibu, California · Fully Certified · Privacy Guaranteed
              </p>
            </div>
          </div>
          <nav className="footer-nav" aria-label="Footer navigation">
            <a href="#practice" className="footer-link">Practice</a>
            <a href="#origin" className="footer-link">Origin</a>
            <a href="#cornerstones" className="footer-link">The Cornerstone</a>
            <a href="#contact" className="footer-link">Contact</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
