import React from "react";
import { MATTERS } from "@/lib/constants";

export function Matters() {
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
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr 220px",
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
              <span style={{ color: "rgba(236,230,214,.32)" }}>
                without exposure.
              </span>
            </h2>
          </div>
          <p
            className="small-copy"
            data-reveal
            style={{
              fontSize: 12,
              textAlign: "right",
              margin: 0,
              opacity: 0.65,
            }}
          >
            Details have been intentionally limited to preserve client privacy.
            Relevant experience can be discussed during a private consultation
            — without disclosing confidential or identifying information.
          </p>
        </div>

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
              <tr key={i}>
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
      </div>
    </section>
  );
}
