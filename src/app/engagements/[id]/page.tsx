import { notFound } from "next/navigation";
import Link from "next/link";
import { MATTERS, FIRM_NAME } from "@/lib/constants";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return MATTERS.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const matter = MATTERS.find((m) => m.id === id);
  if (!matter) return { title: "Not Found" };
  return {
    title: `${matter.area} Engagement — ${FIRM_NAME}`,
    description: matter.role,
  };
}

export default async function EngagementDetailPage({ params }: Props) {
  const { id } = await params;
  const matter = MATTERS.find((m) => m.id === id);
  if (!matter) notFound();
  const idx = MATTERS.indexOf(matter);

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
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          letterSpacing: ".2em", textTransform: "uppercase" as const,
          color: "var(--accent)", textDecoration: "none",
          opacity: 0.7, transition: "opacity 0.3s ease",
        }}>
          ← Back to Record
        </Link>
      </nav>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "120px 40px 100px" }}>
        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
            letterSpacing: ".18em", color: "rgba(236,230,214,.45)",
            marginBottom: 20,
          }}>
            § 05 · {String(idx + 1).padStart(2, "0")} — REPRESENTATIVE ENGAGEMENT
          </div>

          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 300,
            fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.05,
            letterSpacing: ".015em", textTransform: "uppercase" as const,
            margin: "0 0 20px",
          }}>
            {matter.area}
          </h1>

          {/* Meta */}
          <div style={{
            display: "flex", gap: 32, flexWrap: "wrap",
            marginBottom: 8,
          }}>
            <div>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                letterSpacing: ".15em", color: "rgba(236,230,214,.4)",
                display: "block", marginBottom: 4,
              }}>SCALE</span>
              <span style={{ fontSize: 15, color: "rgba(236,230,214,.75)" }}>{matter.scale}</span>
            </div>
            <div>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                letterSpacing: ".15em", color: "rgba(236,230,214,.4)",
                display: "block", marginBottom: 4,
              }}>CONCERN</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                letterSpacing: ".12em", textTransform: "uppercase" as const,
                color: "rgba(236,230,214,.85)",
              }}>{matter.concern}</span>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(201,181,138,.15)", margin: "0 0 48px" }} />

        {/* Overview */}
        <section style={{ marginBottom: 48 }}>
          <p style={{
            fontSize: 17, lineHeight: 1.85, color: "rgba(236,230,214,.82)",
            margin: 0,
          }}>
            {matter.detail.overview}
          </p>
        </section>

        {/* Challenges */}
        <section style={{
          marginBottom: 48, padding: "36px 40px",
          background: "var(--panel)", border: "1px solid rgba(255,255,255,.06)",
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            letterSpacing: ".25em", color: "var(--accent)",
            marginBottom: 24, textTransform: "uppercase" as const,
          }}>
            CHALLENGES
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {matter.detail.challenges.map((c, i) => (
              <li key={i} style={{
                fontSize: 15, lineHeight: 1.75, color: "rgba(236,230,214,.72)",
                padding: "8px 0", position: "relative", paddingLeft: 20,
              }}>
                <span style={{
                  position: "absolute", left: 0, color: "var(--accent)", fontSize: 8, top: 14,
                }}>◈</span>
                {c}
              </li>
            ))}
          </ul>
        </section>

        {/* Approach */}
        <section style={{ marginBottom: 48 }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            letterSpacing: ".25em", color: "var(--accent)",
            marginBottom: 20, textTransform: "uppercase" as const,
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

        {/* Result */}
        <section style={{
          padding: "36px 40px",
          border: "1px solid rgba(201,181,138,.12)",
          background: "rgba(201,181,138,.02)",
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            letterSpacing: ".25em", color: "var(--accent)",
            marginBottom: 16, textTransform: "uppercase" as const,
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

        {/* Advisory Role note */}
        <section style={{ marginTop: 48, paddingTop: 36, borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            letterSpacing: ".25em", color: "rgba(236,230,214,.4)",
            marginBottom: 12, textTransform: "uppercase" as const,
          }}>
            ADVISORY ROLE
          </div>
          <p style={{
            fontSize: 16, lineHeight: 1.75, color: "rgba(236,230,214,.65)",
            margin: "0 0 8px",
          }}>
            {matter.role}
          </p>
          <p style={{
            fontSize: 13, lineHeight: 1.6, color: "rgba(236,230,214,.4)",
            margin: 0, fontStyle: "italic",
          }}>
            Details have been intentionally limited to preserve client privacy.
          </p>
        </section>

        {/* CTA */}
        <div style={{ marginTop: 64, textAlign: "center" }}>
          <Link href="/#contact" style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            fontFamily: "var(--font-body)", fontSize: 13,
            letterSpacing: ".16em", textTransform: "uppercase" as const,
            padding: "16px 28px", border: "1px solid var(--accent)",
            color: "var(--accent)", background: "transparent",
            textDecoration: "none", transition: "all 0.4s ease",
          }}>
            Discuss Your Matter →
          </Link>
        </div>
      </main>
    </div>
  );
}
