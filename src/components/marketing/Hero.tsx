"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { SERVICE_AREAS } from "@/lib/constants";

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const tm = setTimeout(() => {
      ref.current
        ?.querySelectorAll(".stage, [data-reveal], .mask-reveal")
        .forEach((n) => n.classList.add("in"));
    }, 60);
    return () => clearTimeout(tm);
  }, []);

  return (
    <section
      ref={ref}
      id="hero"
      data-testid="hero"
      className="hero-section"
    >
      {/* Background image */}
      <div className="hero-bg">
        <Image
          src="/images/jra-hero.jpg"
          alt="Malibu coastline luxury estate"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
        <div className="hero-overlay" />
        <div className="hero-gradient" />
        <div className="hero-bottom-fade" />
      </div>

      {/* Content */}
      <div className="hero-content page">
        <div className="stage">
          <div className="hero-eyebrow">
            <span className="mono" style={{ fontSize: 11, letterSpacing: ".28em", opacity: 0.5 }}>
              Owner-side advisory · No contractors · No conflicts
            </span>
          </div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: ".32em", opacity: 0.4, marginBottom: 24 }}>
            Private advisory · Los Angeles coastal estates
          </div>

          <h1 className="hero-headline">
            Protecting<br />
            The Coast<br />
            We Call <span className="accent-shimmer">Home.</span>
          </h1>

          <div className="hero-rule" />

          <div className="hero-bottom-row">
            <p className="small-copy" style={{ maxWidth: "52ch", fontSize: 17, lineHeight: 1.75, opacity: 0.8, margin: 0 }}>
              Ultra-discreet hazardous materials remediation advisory and structural inspection
              oversight for coastal estate owners where cost, liability, and pressure arrive together.
            </p>
            <a href="#practice" className="mono inquiry-link" style={{ fontSize: 12, letterSpacing: ".22em", opacity: 0.6, whiteSpace: "nowrap" }}>
              View practice <span className="arr">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Location strip */}
      <div style={{ position: "relative", zIndex: 1, padding: "20px 0 28px" }} data-reveal>
        <div className="hr gold-line" style={{ marginBottom: 20 }} />
        <div className="cities-marquee-wrap">
          <div className="cities-marquee">
            {[...SERVICE_AREAS, ...SERVICE_AREAS].map((area, i) => (
              <span key={`${area}-${i}`} className="mono cities-marquee-item">
                <span className="cities-sep">/</span>
                {area.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
