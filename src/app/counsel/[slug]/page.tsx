import { notFound } from "next/navigation";
import Link from "next/link";
import { COUNSEL_AREAS, FIRM_NAME } from "@/lib/constants";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return COUNSEL_AREAS.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = COUNSEL_AREAS.find((a) => a.slug === slug);
  if (!area) return { title: "Not Found" };
  return {
    title: `${area.title} — ${FIRM_NAME}`,
    description: area.description,
  };
}

export default async function CounselAreaPage({ params }: Props) {
  const { slug } = await params;
  const area = COUNSEL_AREAS.find((a) => a.slug === slug);
  if (!area) notFound();

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
        <Link href="/#counsel" style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
          letterSpacing: ".2em", textTransform: "uppercase" as const,
          color: "var(--accent)", textDecoration: "none",
          opacity: 0.7, transition: "opacity 0.3s ease",
        }}>
          ← Back to Counsel
        </Link>
      </nav>

      {/* Full-width header section */}
      <header style={{
        paddingTop: 120,
        paddingBottom: 64,
        borderBottom: "1px solid rgba(201,181,138,.1)",
        background: "linear-gradient(180deg, rgba(16,18,24,0.6) 0%, var(--bg) 100%)",
      }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 40px" }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
            letterSpacing: ".18em", color: "rgba(236,230,214,.45)",
            marginBottom: 24,
          }}>
            § 02 · {area.numeral.toUpperCase()} — COUNSEL AREA
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 300,
            fontSize: "clamp(36px, 4.5vw, 64px)", lineHeight: 1.05,
            letterSpacing: ".015em", textTransform: "uppercase" as const,
            margin: "0 0 32px",
          }}>
            {area.title}
          </h1>
          <p style={{
            fontSize: 18, lineHeight: 1.8, color: "rgba(236,230,214,.82)",
            maxWidth: "60ch", margin: 0,
          }}>
            {area.description}
          </p>
        </div>
      </header>

      {/* Main content — full-width portal-style */}
      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "0 40px 100px" }}>

        {/* Overview — full-width */}
        <section style={{ padding: "64px 0 56px" }}>
          <p style={{
            fontSize: 17, lineHeight: 1.85, color: "rgba(236,230,214,.82)",
            maxWidth: "72ch", margin: 0,
          }}>
            {area.detail.overview}
          </p>
        </section>

        {/* Two-column layout: Process + Indicators */}
        <div className="counsel-detail-grid" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 48,
        }}>
          {/* Process — left panel */}
          <section style={{
            padding: "44px 48px",
            background: "rgba(16,18,24,0.8)",
            border: "1px solid rgba(255,255,255,.06)",
            backdropFilter: "blur(12px)",
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
              letterSpacing: ".25em", color: "var(--accent)",
              marginBottom: 32, textTransform: "uppercase" as const,
            }}>
              OUR PROCESS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {area.detail.process.map((step, i) => (
                <div key={i} style={{
                  display: "flex", gap: 20, padding: "20px 0",
                  borderTop: "1px solid rgba(255,255,255,.05)",
                  alignItems: "flex-start",
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                    color: "var(--accent)", opacity: 0.6, minWidth: 28,
                    paddingTop: 3,
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{
                    fontSize: 17, lineHeight: 1.65, color: "rgba(236,230,214,.78)",
                  }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Right column: Indicators + Timeline stacked */}
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            {/* Indicators panel */}
            <section style={{
              padding: "44px 48px",
              background: "rgba(16,18,24,0.8)",
              border: "1px solid rgba(201,181,138,.08)",
              backdropFilter: "blur(12px)",
              flex: 1,
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                letterSpacing: ".25em", color: "var(--accent)",
                marginBottom: 28, textTransform: "uppercase" as const,
              }}>
                WHEN CLIENTS CALL US
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {area.detail.indicators.map((ind, i) => (
                  <li key={i} style={{
                    fontSize: 17, lineHeight: 1.75, color: "rgba(236,230,214,.72)",
                    padding: "10px 0", position: "relative", paddingLeft: 24,
                  }}>
                    <span style={{
                      position: "absolute", left: 0, color: "var(--accent)", fontSize: 10,
                      top: 16,
                    }}>◈</span>
                    {ind}
                  </li>
                ))}
              </ul>
            </section>

            {/* Timeline panel */}
            <section style={{
              padding: "32px 48px",
              border: "1px solid rgba(201,181,138,.12)",
              background: "rgba(201,181,138,.03)",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                letterSpacing: ".2em", color: "var(--accent)",
                marginBottom: 14, textTransform: "uppercase" as const,
              }}>
                TYPICAL TIMELINE
              </div>
              <p style={{
                fontSize: 17, lineHeight: 1.7, color: "rgba(236,230,214,.75)",
                margin: 0,
              }}>
                {area.detail.timeline}
              </p>
            </section>
          </div>
        </div>

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
            Request a Consultation →
          </Link>
        </div>
      </main>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .counsel-detail-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </div>
  );
}
