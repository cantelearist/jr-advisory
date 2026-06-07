import React from "react";
import Image from "next/image";

export function Founders() {
  return (
    <section id="origin" data-testid="founders" className="origin-section">
      {/* Full-width split layout: photo left, story right */}
      <div className="origin-layout">
        <div className="origin-photo" data-reveal>
          <Image
            src="/images/founders/founders-malibu-beach.png"
            alt="Roman & Stephen — Co-founders, James Roman Advisory, on Malibu beach"
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            style={{ objectFit: "cover", objectPosition: "center top" }}
          />
          <div className="origin-photo-caption">
            <span className="mono" style={{ fontSize: 11, letterSpacing: ".2em", opacity: 0.7 }}>
              Roman &amp; Stephen · Malibu
            </span>
            <br />
            <span className="mono" style={{ fontSize: 10, letterSpacing: ".2em", opacity: 0.5 }}>
              Co-founders
            </span>
          </div>
        </div>

        <div className="origin-story" data-reveal>
          <div className="mono" style={{ opacity: 0.5, marginBottom: 16, fontSize: 11, letterSpacing: ".28em" }}>
            The Origin
          </div>
          <h2 className="h-section" style={{ margin: "0 0 0", fontSize: "clamp(36px, 4vw, 56px)" }}>
            Twice in thirty years,<br />
            the canyon <span className="accent-shimmer">claimed<br />the ridge.</span>
          </h2>

          <div className="hr" style={{ margin: "32px 0" }} />

          <div className="origin-paragraphs">
            <p className="small-copy" style={{ fontSize: 17, lineHeight: 1.85, opacity: 0.75 }}>
              Stephen was born in Malibu. He watched his family&apos;s home burn
              in 1993 and again in 2018. Both times, the hardest part wasn&apos;t
              the loss — it was what came after: contractors who couldn&apos;t be
              trusted, advisors who worked for the insurance company.
            </p>
            <p className="small-copy" style={{ fontSize: 17, lineHeight: 1.85, opacity: 0.75, marginTop: 20 }}>
              Roman spent years overseeing construction across Los Angeles
              and watched, repeatedly, how quickly standards drift when no
              one is clearly standing for the person paying the bill.
            </p>
            <p className="small-copy" style={{ fontSize: 17, lineHeight: 1.85, opacity: 0.75, marginTop: 20 }}>
              James Roman Advisory exists because both of them needed it,
              years before they built it.
            </p>
          </div>

          <a href="#contact" className="mono inquiry-link" style={{ marginTop: 40, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, letterSpacing: ".22em", opacity: 0.6 }}>
            Book a private consultation <span className="arr">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
