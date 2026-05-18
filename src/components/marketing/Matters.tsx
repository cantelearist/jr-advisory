"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MATTERS } from "@/lib/constants";

export function Matters() {
  const router = useRouter();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const handleClick = useCallback((idx: number, id: string) => {
    if (typeof window !== "undefined" && window.innerWidth <= 900) {
      setExpandedIdx(expandedIdx === idx ? null : idx);
    } else {
      router.push(`/engagements/${id}`);
    }
  }, [expandedIdx, router]);

  return (
    <section
      data-testid="matters"
      style={{
        padding: "140px 0",
        borderTop: "1px solid rgba(255,255,255,.06)",
        background: "var(--panel)",
      }}
    >
      <div className="page">
        <div
          className="matters-header"
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr 240px",
            gap: 40,
            marginBottom: 56,
            alignItems: "end",
          }}
        >
          <div className="num" data-reveal>
            § 05 — RECORD
          </div>
          <div data-reveal>
            <h2
              className="h-section"
              style={{ margin: 0, maxWidth: "24ch" }}
            >
              Experience
              <br />
              <span style={{ color: "rgba(236,230,214,.35)" }}>
                without exposure.
              </span>
            </h2>
          </div>
          <p
            className="small-copy matters-privacy"
            data-reveal
            style={{
              fontSize: 16,
              textAlign: "right",
              margin: 0,
              opacity: 0.7,
              lineHeight: 1.6,
            }}
          >
            Details have been intentionally limited to preserve client privacy.
            Relevant experience can be discussed during a private consultation
            — without disclosing confidential or identifying information.
          </p>
        </div>

        {/* Desktop table */}
        <table className="ledger" data-reveal>
          <thead>
            <tr>
              <th style={{ width: "18%" }}>Area</th>
              <th style={{ width: "17%" }}>Scale</th>
              <th style={{ width: "20%" }}>Concern</th>
              <th style={{ width: "25%" }}>Advisory Role</th>
              <th style={{ width: "20%" }}>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {MATTERS.map((matter, i) => (
              <tr
                key={i}
                onClick={() => handleClick(i, matter.id)}
                style={{ cursor: "pointer" }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") handleClick(i, matter.id); }}
              >
                <td>
                  <span
                    className="num"
                    style={{ marginRight: 12, opacity: 0.5 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="area">{matter.area}</span>
                </td>
                <td className="scale">{matter.scale}</td>
                <td className="concern">{matter.concern}</td>
                <td className="role">{matter.role}</td>
                <td className="outcome">{matter.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile cards — with expand */}
        <div data-reveal>
          {MATTERS.map((matter, i) => (
            <div key={i}>
              <div
                className="matter-card"
                onClick={() => handleClick(i, matter.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") handleClick(i, matter.id); }}
                style={{
                  padding: "28px 0",
                  borderTop: "1px solid rgba(255,255,255,.08)",
                  borderBottom: i === MATTERS.length - 1 && expandedIdx !== i ? "1px solid rgba(255,255,255,.08)" : "none",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                  <div>
                    <span className="num" style={{ opacity: 0.5, marginRight: 10 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="area">{matter.area}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="concern" style={{ fontSize: 13 }}>{matter.concern}</span>
                    <span style={{
                      fontFamily: "'Archivo', sans-serif",
                      fontSize: 19,
                      color: "var(--accent)",
                      opacity: 0.5,
                      transition: "transform 0.4s ease",
                      transform: expandedIdx === i ? "rotate(45deg)" : "rotate(0deg)",
                    }}>+</span>
                  </div>
                </div>
                <div className="small-copy" style={{ fontSize: 17, marginBottom: 10 }}>
                  <span style={{ opacity: 0.5 }}>Scale: </span>{matter.scale}
                </div>
                <div className="small-copy" style={{ fontSize: 17, marginBottom: 10 }}>
                  <span style={{ opacity: 0.5 }}>Role: </span>{matter.role}
                </div>
                <div className="small-copy" style={{ fontSize: 17 }}>
                  <span style={{ opacity: 0.5 }}>Outcome: </span>{matter.outcome}
                </div>
              </div>

              {/* Mobile expand detail */}
              <div style={{
                maxHeight: expandedIdx === i ? 600 : 0,
                overflow: "hidden",
                transition: "max-height 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease",
                opacity: expandedIdx === i ? 1 : 0,
              }}>
                <div style={{ padding: "8px 0 32px", borderBottom: "1px solid rgba(201,181,138,.15)" }}>
                  <p className="small-copy" style={{ fontSize: 17, lineHeight: 1.8, margin: "0 0 16px", opacity: 0.85 }}>
                    {matter.detail.overview}
                  </p>
                  <div className="mono" style={{ color: "var(--accent)", marginBottom: 10, fontSize: 12, letterSpacing: ".2em" }}>
                    CHALLENGES
                  </div>
                  <ul style={{ margin: "0 0 16px", padding: "0 0 0 18px", listStyle: "none" }}>
                    {matter.detail.challenges.map((c, ci) => (
                      <li key={ci} style={{ fontSize: 17, lineHeight: 1.7, color: "rgba(236,230,214,.7)", padding: "3px 0", position: "relative", paddingLeft: 16 }}>
                        <span style={{ position: "absolute", left: 0, color: "var(--accent)", opacity: 0.5 }}>·</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                  <div className="mono" style={{ color: "var(--accent)", marginBottom: 10, fontSize: 12, letterSpacing: ".2em" }}>
                    RESULT
                  </div>
                  <p className="small-copy" style={{ fontSize: 17, lineHeight: 1.75, margin: 0, opacity: 0.85 }}>
                    {matter.detail.result}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
