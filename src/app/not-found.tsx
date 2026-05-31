import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Not Found — James Roman Advisory",
};

export default function NotFound() {
  return (
    <div
      style={{
        background: "var(--bg)",
        color: "var(--fg)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 24px",
      }}
    >
      <div
        className="display"
        style={{
          fontSize: "clamp(72px, 12vw, 140px)",
          lineHeight: 1,
          color: "rgba(236,230,214,.12)",
          marginBottom: 24,
        }}
      >
        404
      </div>
      <h1
        className="h-section"
        style={{ margin: "0 0 20px", fontSize: "clamp(28px, 3vw, 44px)" }}
      >
        Page not{" "}
        <span className="accent-shimmer">found.</span>
      </h1>
      <p
        className="small-copy"
        style={{
          maxWidth: "40ch",
          margin: "0 auto 40px",
          textAlign: "center",
        }}
      >
        The page you are looking for does not exist or has been moved. If you
        believe this is an error, please contact our office.
      </p>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" className="btn ghost" style={{ textDecoration: "none" }}>
          Return Home <span className="arr">→</span>
        </Link>
        <Link href="/#contact" className="btn ghost" style={{ textDecoration: "none" }}>
          Contact Us <span className="arr">→</span>
        </Link>
      </div>
      <div
        className="mono"
        style={{ marginTop: 64, opacity: 0.3, fontSize: 12 }}
      >
        JAMES ROMAN ADVISORY · MMXXVI
      </div>
    </div>
  );
}
