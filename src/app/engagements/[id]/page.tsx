import { notFound } from "next/navigation";
import Link from "next/link";
import { MATTERS, FIRM_NAME } from "@/lib/constants";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

/* Hero images — landscape photography of each engagement area */
const HERO_IMAGES: Record<string, string> = {
  "malibu-estate": "/images/heroes/malibu.jpg",
  "pacific-palisades": "/images/heroes/pacific-palisades.jpg",
  "beverly-hills": "/images/heroes/beverly-hills.jpg",
  "brentwood": "/images/heroes/brentwood.jpg",
};

export async function generateStaticParams() {
  return MATTERS.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const matter = MATTERS.find((m) => m.id === id);
  if (!matter) return { title: "Not Found" };
  return {
    title: `${matter.area} Engagement — ${FIRM_NAME}`,
    description: `${matter.concern} — ${matter.role}`,
    openGraph: {
      title: `${matter.area} Engagement — ${FIRM_NAME}`,
      description: `${matter.concern} — ${matter.role}`,
      type: "article",
    },
  };
}

export default async function EngagementDetailPage({ params }: Props) {
  const { id } = await params;
  const matter = MATTERS.find((m) => m.id === id);
  if (!matter) notFound();
  const idx = MATTERS.indexOf(matter);
  const heroImage = HERO_IMAGES[matter.id] || HERO_IMAGES["malibu-estate"];

  return (
    <div style={{ background: "var(--bg)", color: "var(--fg)", minHeight: "100vh" }}>
      {/* Nav bar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(10,11,14,0.9)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,.06)",
        padding: "0 40px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 14,
          textDecoration: "none", color: "inherit",
        }}>
          <div style={{
            width: 34, height: 34, border: "1px solid currentColor",
            display: "grid", placeItems: "center",
            fontFamily: "var(--font-display)", fontWeight: 300,
            letterSpacing: ".04em", fontSize: 12,
          }}>JR</div>
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 13,
            letterSpacing: ".22em", textTransform: "uppercase" as const,
          }}>JAMES ROMAN</span>
        </Link>
        <Link href="/#matters" style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
          letterSpacing: ".2em", textTransform: "uppercase" as const,
          color: "var(--accent)", textDecoration: "none",
          opacity: 0.7, transition: "opacity 0.3s ease",
        }}>
          ← Back to Record
        </Link>
      </nav>

      {/* Hero Image */}
      <div style={{
        position: "relative",
        width: "100%",
        height: "clamp(320px, 45vh, 560px)",
        overflow: "hidden",
        marginTop: 64,
      }}>
        <img
          src={heroImage}
          alt={`${matter.area} landscape`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 40%",
            filter: "brightness(0.7) contrast(1.1) saturate(0.85)",
          }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(10,11,14,0.3) 0%, rgba(10,11,14,0.05) 40%, rgba(10,11,14,0.6) 75%, var(--bg) 100%)",
        }} />
        {/* Title overlay on hero */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0, right: 0,
          padding: "0 40px 48px",
          maxWidth: 1440,
          margin: "0 auto",
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
            letterSpacing: ".18em", color: "rgba(236,230,214,.6)",
            marginBottom: 20,
          }}>
            § 05 · {String(idx + 1).padStart(2, "0")} — REPRESENTATIVE ENGAGEMENT
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 300,
            fontSize: "clamp(36px, 4.5vw, 64px)", lineHeight: 1.0,
            letterSpacing: ".015em", textTransform: "uppercase" as const,
            margin: 0, color: "#fff",
            textShadow: "0 2px 40px rgba(0,0,0,0.5)",
          }}>
            {matter.area}
          </h1>
        </div>
      </div>

      {/* Content — full-width portal-style layout */}
      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "0 40px 100px" }}>

        {/* Meta chips */}
        <div style={{
          display: "flex", gap: 40, flexWrap: "wrap",
          padding: "40px 0 48px",
          borderBottom: "1px solid rgba(201,181,138,.15)",
        }}>
          <div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
              letterSpacing: ".15em", color: "rgba(236,230,214,.4)",
              display: "block", marginBottom: 6,
            }}>SCALE</span>
            <span style={{ fontSize: 17, color: "rgba(236,230,214,.85)" }}>{matter.scale}</span>
          </div>
          <div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
              letterSpacing: ".15em", color: "rgba(236,230,214,.4)",
              display: "block", marginBottom: 6,
            }}>CONCERN</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
              letterSpacing: ".12em", textTransform: "uppercase" as const,
              color: "rgba(236,230,214,.9)",
            }}>{matter.concern}</span>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
          paddingTop: 56,
        }}>
          {/* Left: Overview + Approach */}
          <div>
            <section style={{ marginBottom: 56 }}>
              <p style={{
                fontSize: 17, lineHeight: 1.85, color: "rgba(236,230,214,.82)",
                margin: 0,
              }}>
                {matter.detail.overview}
              </p>
            </section>

            <section>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                letterSpacing: ".25em", color: "var(--accent)",
                marginBottom: 24, textTransform: "uppercase" as const,
              }}>
                OUR APPROACH
              </div>
              <p style={{
                fontSize: 17, lineHeight: 1.85, color: "rgba(236,230,214,.82)",
                margin: 0,
              }}>
                {matter.detail.approach}
              </p>
            </section>
          </div>

          {/* Right: Challenges + Result panels */}
          <div>
            {/* Challenges panel */}
            <section style={{
              marginBottom: 40, padding: "40px 44px",
              background: "rgba(16,18,24,0.8)", border: "1px solid rgba(255,255,255,.06)",
              backdropFilter: "blur(12px)",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                letterSpacing: ".25em", color: "var(--accent)",
                marginBottom: 24, textTransform: "uppercase" as const,
              }}>
                CHALLENGES
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {matter.detail.challenges.map((c, i) => (
                  <li key={i} style={{
                    fontSize: 17, lineHeight: 1.75, color: "rgba(236,230,214,.72)",
                    padding: "10px 0", position: "relative", paddingLeft: 24,
                  }}>
                    <span style={{
                      position: "absolute", left: 0, color: "var(--accent)", fontSize: 10, top: 16,
                    }}>◈</span>
                    {c}
                  </li>
                ))}
              </ul>
            </section>

            {/* Result panel */}
            <section style={{
              padding: "40px 44px",
              border: "1px solid rgba(201,181,138,.12)",
              background: "rgba(201,181,138,.03)",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                letterSpacing: ".25em", color: "var(--accent)",
                marginBottom: 20, textTransform: "uppercase" as const,
              }}>
                RESULT
              </div>
              <p style={{
                fontSize: 17, lineHeight: 1.85, color: "rgba(236,230,214,.85)",
                margin: 0,
              }}>
                {matter.detail.result}
              </p>
            </section>
          </div>
        </div>

        {/* Advisory Role — full-width footer */}
        <section style={{
          marginTop: 64, paddingTop: 40,
          borderTop: "1px solid rgba(255,255,255,.06)",
          display: "grid",
          gridTemplateColumns: "200px 1fr",
          gap: 40,
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
            letterSpacing: ".25em", color: "rgba(236,230,214,.4)",
            textTransform: "uppercase" as const,
          }}>
            ADVISORY ROLE
          </div>
          <div>
            <p style={{
              fontSize: 17, lineHeight: 1.75, color: "rgba(236,230,214,.65)",
              margin: "0 0 12px",
            }}>
              {matter.role}
            </p>
            <p style={{
              fontSize: 15, lineHeight: 1.6, color: "rgba(236,230,214,.4)",
              margin: 0, fontStyle: "italic",
            }}>
              Details have been intentionally limited to preserve client privacy.
            </p>
          </div>
        </section>

        {/* CTA */}
        <div style={{ marginTop: 72, textAlign: "center" }}>
          <Link href="/#contact" style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            fontFamily: "var(--font-body)", fontSize: 15,
            letterSpacing: ".16em", textTransform: "uppercase" as const,
            padding: "18px 32px", border: "1px solid var(--accent)",
            color: "var(--accent)", background: "transparent",
            textDecoration: "none", transition: "all 0.4s ease",
          }}>
            Discuss Your Matter →
          </Link>
        </div>
      </main>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          main > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          section[style*="grid-template-columns: 200px 1fr"] {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
