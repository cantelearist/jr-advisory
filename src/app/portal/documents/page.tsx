"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import PortalNav from "@/components/portal/PortalNav";
import { useAuth } from "@/components/portal/AuthProvider";
import { fetchPortalData } from "@/lib/portal-data";
import type { Document as DBDocument } from "@/lib/database.types";

const Scene3D = dynamic(() => import("@/components/portal/Scene3D"), {
  ssr: false,
});

const CATEGORIES = [
  "All",
  "NDA",
  "Lab Results",
  "Proposals",
  "Clearance",
  "Invoices",
  "Reports",
];

const CATEGORY_MAP: Record<string, string> = {
  nda: "NDA",
  "lab-results": "Lab Results",
  proposals: "Proposals",
  clearance: "Clearance",
  invoices: "Invoices",
  reports: "Reports",
};

const STATUS_MAP: Record<string, string> = {
  final: "final",
  draft: "review",
  "pending-review": "new",
};

const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  signed: {
    bg: "rgba(201,169,110,0.1)",
    color: "#c9a96e",
    label: "SIGNED",
  },
  final: {
    bg: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.4)",
    label: "FINAL",
  },
  review: {
    bg: "rgba(110,169,201,0.1)",
    color: "#6ea9c9",
    label: "IN REVIEW",
  },
  new: {
    bg: "rgba(169,201,110,0.1)",
    color: "#a9c96e",
    label: "NEW",
  },
  paid: {
    bg: "rgba(110,201,150,0.1)",
    color: "#6ec9a0",
    label: "PAID",
  },
};

/* Sample document content for viewer */
const SAMPLE_CONTENT: Record<string, string> = {
  nda: `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of the date of execution by and between James Roman Advisory ("Firm") and the undersigned Client ("Receiving Party").

1. CONFIDENTIAL INFORMATION
All information disclosed by either party, whether oral, written, or electronic, relating to the property, engagement scope, environmental findings, personal identity, or financial details shall be considered Confidential Information.

2. OBLIGATIONS
The Receiving Party agrees to:
(a) Maintain all Confidential Information in strict confidence
(b) Not disclose Confidential Information to any third party without prior written consent
(c) Use Confidential Information solely for the purpose of the engagement

3. EXCLUSIONS
Confidential Information does not include information that:
(a) Is or becomes publicly available through no fault of the Receiving Party
(b) Was in the Receiving Party's possession prior to disclosure
(c) Is independently developed without use of Confidential Information

4. TERM
This Agreement shall remain in effect for five (5) years from the date of execution.

5. GOVERNING LAW
This Agreement shall be governed by the laws of the State of California.

[Signature blocks redacted for sample purposes]`,

  "lab-results": `INDEPENDENT ENVIRONMENTAL ASSESSMENT
Laboratory Analysis Report

Client: [REDACTED]
Property: [REDACTED], California
Date of Sampling: [Sample Date]
Laboratory: Certified Environmental Testing, Inc.
Accreditation: AIHA-LAP, LLC — EMLAP #[REDACTED]

SUMMARY OF FINDINGS

Air Sampling Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Zone A (West Wing)     Stachybotrys:  2,400 spores/m³  ▲ ELEVATED
Zone B (Primary Bath)  Aspergillus:   1,800 spores/m³  ▲ ELEVATED
Zone C (HVAC Return)   Penicillium:     950 spores/m³  ● MODERATE
Exterior Baseline      Mixed flora:     320 spores/m³  ○ NORMAL

Moisture Readings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Zone A — Subfloor:      28.4% MC  (threshold: 16%)  ▲ ELEVATED
Zone A — Wall Cavity:   24.1% MC  (threshold: 16%)  ▲ ELEVATED
Zone B — Ceiling:       19.8% MC  (threshold: 16%)  ▲ ELEVATED
Zone C — Ductwork:      12.3% MC  (threshold: 16%)  ○ NORMAL

INTERPRETATION
Elevated spore counts in Zones A and B are consistent with active microbial growth resulting from sustained moisture intrusion. Source appears to be roof junction failure at the west wing. Remediation recommended per IICRC S520 standards.

[Full technical appendix available in vault]`,

  proposals: `REMEDIATION PROPOSAL — SCOPE COMPARISON

Prepared by: James Roman Advisory
For: [Client — REDACTED]
Date: [Prepared Date]

VENDOR A — Pacific Remediation Group
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Approach:      Full containment, simultaneous zones
Timeline:      18 working days
Crew Size:     8-10 technicians
Scope:         All three zones + HVAC decontamination
Guarantee:     2-year warranty with annual re-test
Estimate:      $[REDACTED]

VENDOR B — Westside Environmental
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Approach:      Phased containment, zone-by-zone
Timeline:      28 working days
Crew Size:     4-6 technicians
Scope:         Zones A & B primary; Zone C as add-on
Guarantee:     1-year warranty
Estimate:      $[REDACTED]

ADVISORY NOTES
• Vendor A's scope is more comprehensive and aligns with assessment findings
• Vendor B's phased approach creates risk of cross-contamination between zones
• Both vendors are IICRC S520 certified; Vendor A has more luxury residential experience
• Recommendation: Vendor A, with negotiated timeline of 15 working days

[Detailed comparison matrix available in vault]`,

  clearance: `POST-REMEDIATION CLEARANCE REPORT

Property: [REDACTED], California
Date of Testing: [Test Date]
Previous Phase: Phase III — Remediation Complete

CLEARANCE TESTING RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Zone A (West Wing)     Spore Count:    180 spores/m³   ✓ CLEAR
Zone B (Primary Bath)  Spore Count:    210 spores/m³   ✓ CLEAR
Zone C (HVAC System)   Spore Count:    140 spores/m³   ✓ CLEAR
Exterior Baseline      Spore Count:    290 spores/m³   ○ REFERENCE

Moisture Verification:
Zone A — Subfloor:      11.2% MC  ✓ WITHIN NORMAL
Zone A — Wall Cavity:   10.8% MC  ✓ WITHIN NORMAL
Zone B — Ceiling:        9.4% MC  ✓ WITHIN NORMAL

DETERMINATION
All zones meet clearance criteria per IICRC S520. Indoor spore counts are below exterior baseline. Moisture content is within acceptable parameters. Property is cleared for re-occupancy and reconstruction.

Certified by: [IEP Name — REDACTED]
License: [REDACTED]`,

  invoices: `JAMES ROMAN ADVISORY
Invoice

Invoice #: JRA-2026-[XXX]
Date: [Invoice Date]
Due: Net 15

TO: [Client — REDACTED]
RE: Environmental Advisory Services — [Property]

SERVICES RENDERED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase II — Independent Assessment
  Site inspections (3)              $[REDACTED]
  IEP coordination & review         $[REDACTED]
  Laboratory analysis coordination   $[REDACTED]
  Written assessment report          $[REDACTED]

Phase III — Scope & Vendor Curation
  Scope of work development          $[REDACTED]
  Vendor evaluation (3 proposals)    $[REDACTED]
  Comparison matrix & advisory       $[REDACTED]

SUBTOTAL                             $[REDACTED]
California Sales Tax                 N/A (Professional Services)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL DUE                            $[REDACTED]

Payment: Wire transfer or check
Terms: Net 15 from invoice date`,

  reports: `SITE DOCUMENTATION REPORT

Property: [REDACTED], California
Prepared by: James Roman Advisory
Date: [Report Date]

EXECUTIVE SUMMARY
This report documents the initial site assessment and photographic survey conducted at the subject property. All findings are confidential and subject to the standing NDA between the Firm and Client.

SITE CONDITIONS
The property was accessed on [date] for a comprehensive visual inspection. Weather conditions were clear and dry. The following areas were documented:

1. EXTERIOR — Building Envelope
   • Roof junction at west wing shows visible water staining
   • Drainage grading directs water toward foundation at southeast corner
   • Window flashing at second-floor master appears improperly sealed

2. INTERIOR — Living Areas
   • West wing hallway: visible discoloration at ceiling-wall junction
   • Primary bathroom: soft spot in flooring adjacent to shower pan
   • HVAC return grilles: visible dust accumulation, musty odor when system active

3. MECHANICAL SYSTEMS
   • HVAC system is original to construction (est. 18 years)
   • No record of duct cleaning or system remediation
   • Condensate drain line routing requires evaluation

RECOMMENDATIONS
Proceed to Phase II — Independent Assessment with IEP-coordinated sampling.

[Photo documentation appended — 47 images]`,
};

interface DocItem {
  id: number;
  name: string;
  category: string;
  date: string;
  size: string;
  status: string;
  rawCategory: string;
}

export default function PortalDocuments() {
  const { supabase } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [hoveredDoc, setHoveredDoc] = useState<number | null>(null);
  const [clientDocs, setClientDocs] = useState<DBDocument[]>([]);
  const [viewingDoc, setViewingDoc] = useState<DocItem | null>(null);

  useEffect(() => {
    fetchPortalData().then(data => {
      if (data.documents.length > 0) setClientDocs(data.documents);
    });
  }, []);

  const DOCUMENTS: DocItem[] = clientDocs.map((d, i) => ({
    id: i + 1,
    name: d.name,
    category: CATEGORY_MAP[d.category] || d.category,
    rawCategory: d.category,
    date: new Date(d.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    size: d.file_size || "—",
    status: STATUS_MAP[d.status] || d.status,
  }));

  const filtered =
    activeCategory === "All"
      ? DOCUMENTS
      : DOCUMENTS.filter((d) => d.category === activeCategory);

  const getDocContent = (doc: DocItem): string => {
    return (
      SAMPLE_CONTENT[doc.rawCategory] ||
      SAMPLE_CONTENT["reports"] ||
      "Document content loading..."
    );
  };

  return (
    <div className="vault">
      <Scene3D variant="vault" />
      <PortalNav />
      <div className="vault__vignette" />

      <main className="vault__main">
        {/* Header */}
        <section className="vault__hero">
          <span className="vault__label">DOCUMENT VAULT</span>
          <h1 className="vault__title">Your Files</h1>
          <p className="vault__sub">
            {DOCUMENTS.length} documents · Encrypted at rest · Signed URLs
          </p>
        </section>

        {/* Category filter */}
        <div className="vault__filters">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`vault__filter ${
                activeCategory === cat ? "vault__filter--active" : ""
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
              {cat !== "All" && (
                <span className="vault__filter-count">
                  {DOCUMENTS.filter((d) => d.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Document list */}
        <div className="vault__list">
          {filtered.map((doc, i) => {
            const status = STATUS_STYLES[doc.status];
            return (
              <div
                key={doc.id}
                className="vault__doc"
                style={{ animationDelay: `${i * 0.05}s` }}
                onMouseEnter={() => setHoveredDoc(doc.id)}
                onMouseLeave={() => setHoveredDoc(null)}
                onClick={() => setViewingDoc(doc)}
              >
                <div className="vault__doc-icon">
                  <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                    <path
                      d="M0 2C0 0.9 0.9 0 2 0H12L20 8V22C20 23.1 19.1 24 18 24H2C0.9 24 0 23.1 0 22V2Z"
                      fill="rgba(255,255,255,0.04)"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="0.5"
                    />
                    <path
                      d="M12 0V6C12 7.1 12.9 8 14 8H20"
                      fill="rgba(255,255,255,0.02)"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="0.5"
                    />
                  </svg>
                </div>

                <div className="vault__doc-info">
                  <span className="vault__doc-name" title={doc.name}>{doc.name}</span>
                  <span className="vault__doc-meta">
                    {doc.category} · {doc.size}
                  </span>
                </div>

                <span
                  className="vault__doc-status"
                  style={{
                    background: status?.bg,
                    color: status?.color,
                  }}
                >
                  {status?.label}
                </span>

                <span className="vault__doc-date">{doc.date}</span>

                <button
                  className="vault__doc-action"
                  style={{
                    opacity: hoveredDoc === doc.id ? 1 : 0,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingDoc(doc);
                  }}
                >
                  ⬡
                </button>
              </div>
            );
          })}
        </div>
      </main>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="viewer" onClick={() => setViewingDoc(null)}>
          <div
            className="viewer__panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="viewer__header">
              <div>
                <span className="viewer__label">
                  {viewingDoc.category} · {viewingDoc.size}
                </span>
                <h2 className="viewer__title">{viewingDoc.name}</h2>
                <span className="viewer__date">{viewingDoc.date}</span>
              </div>
              <button
                className="viewer__close"
                onClick={() => setViewingDoc(null)}
              >
                ✕
              </button>
            </div>
            <div className="viewer__body">
              <pre className="viewer__content">
                {getDocContent(viewingDoc)}
              </pre>
            </div>
            <div className="viewer__footer">
              <span className="viewer__encrypted">⬡ Encrypted Document</span>
              <span className="viewer__notice">
                Sample content for demonstration purposes
              </span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .vault {
          position: relative;
          min-height: 100vh;
          background: #000;
        }
        .vault__vignette {
          position: fixed;
          inset: 0;
          background: radial-gradient(
            ellipse at 70% 30%,
            transparent 20%,
            rgba(0, 0, 0, 0.9) 100%
          );
          z-index: 1;
          pointer-events: none;
        }
        .vault__main {
          position: relative;
          z-index: 10;
          padding: 120px 60px 60px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .vault__hero {
          margin-bottom: 48px;
          opacity: 0;
          animation: vaultReveal 1s ease 0.2s forwards;
        }
        .vault__label {
          font-family: "Inter", sans-serif;
          font-size: 10px;
          letter-spacing: 0.4em;
          color: rgba(201, 169, 110, 0.5);
        }
        .vault__title {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: clamp(40px, 6vw, 80px);
          font-weight: 300;
          color: #fff;
          margin: 12px 0 16px;
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .vault__sub {
          font-family: "Inter", sans-serif;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.2);
          letter-spacing: 0.1em;
        }

        .vault__filters {
          display: flex;
          gap: 8px;
          margin-bottom: 40px;
          opacity: 0;
          animation: vaultReveal 1s ease 0.35s forwards;
          flex-wrap: wrap;
        }
        .vault__filter {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.35);
          font-family: "Inter", sans-serif;
          font-size: 11px;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.4s ease;
        }
        .vault__filter:hover {
          border-color: rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.6);
        }
        .vault__filter--active {
          border-color: rgba(201, 169, 110, 0.3);
          color: #c9a96e;
          background: rgba(201, 169, 110, 0.05);
        }
        .vault__filter-count {
          font-size: 9px;
          opacity: 0.5;
        }

        .vault__list {
          display: flex;
          flex-direction: column;
        }
        .vault__doc {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          opacity: 0;
          animation: vaultReveal 0.8s ease forwards;
        }
        .vault__doc:hover {
          background: rgba(255, 255, 255, 0.02);
          padding-left: 32px;
          border-color: rgba(201, 169, 110, 0.08);
        }
        .vault__doc-icon {
          flex-shrink: 0;
          opacity: 0.4;
          transition: opacity 0.3s;
        }
        .vault__doc:hover .vault__doc-icon {
          opacity: 0.7;
        }
        .vault__doc-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .vault__doc-name {
          font-family: "Inter", sans-serif;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.75);
          letter-spacing: 0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.3s;
        }
        .vault__doc:hover .vault__doc-name {
          color: #fff;
        }
        .vault__doc-meta {
          font-family: "Inter", sans-serif;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.2);
          letter-spacing: 0.08em;
        }
        .vault__doc-status {
          flex-shrink: 0;
          padding: 4px 12px;
          font-family: "Inter", sans-serif;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }
        .vault__doc-date {
          flex-shrink: 0;
          font-family: "Inter", sans-serif;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.15);
          letter-spacing: 0.05em;
          width: 100px;
          text-align: right;
        }
        .vault__doc-action {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(201, 169, 110, 0.1);
          border: 1px solid rgba(201, 169, 110, 0.2);
          color: #c9a96e;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .vault__doc-action:hover {
          background: rgba(201, 169, 110, 0.2);
        }

        /* ── Document Viewer Modal ── */
        .viewer {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          animation: viewerFade 0.3s ease forwards;
        }
        .viewer__panel {
          width: 100%;
          max-width: 800px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          background: rgba(16, 18, 24, 0.98);
          border: 1px solid rgba(201, 169, 110, 0.12);
          animation: viewerSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }
        .viewer__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 28px 32px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .viewer__label {
          font-family: "Inter", sans-serif;
          font-size: 10px;
          letter-spacing: 0.15em;
          color: rgba(201, 169, 110, 0.5);
          text-transform: uppercase;
        }
        .viewer__title {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 22px;
          font-weight: 400;
          color: #fff;
          margin: 8px 0 4px;
        }
        .viewer__date {
          font-family: "Inter", sans-serif;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.2);
        }
        .viewer__close {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.5);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        .viewer__close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .viewer__body {
          flex: 1;
          overflow-y: auto;
          padding: 28px 32px;
        }
        .viewer__content {
          font-family: "JetBrains Mono", "Courier New", monospace;
          font-size: 12px;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.65);
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 0;
        }
        .viewer__footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
        }
        .viewer__encrypted {
          font-family: "Inter", sans-serif;
          font-size: 10px;
          color: rgba(110, 201, 160, 0.4);
          letter-spacing: 0.1em;
        }
        .viewer__notice {
          font-family: "Inter", sans-serif;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.15);
          letter-spacing: 0.05em;
        }

        @keyframes vaultReveal {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes viewerFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes viewerSlide {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .vault__main {
            padding: 100px 16px 40px;
          }
          .vault__header h1 { font-size: 28px; }
          .vault__filters { flex-wrap: wrap; gap: 6px; }
          .vault__filters button { font-size: 9px; padding: 6px 10px; }
          .vault__doc {
            flex-wrap: wrap;
            gap: 8px;
            padding: 16px;
          }
          .vault__doc-info {
            flex: 1 1 calc(100% - 52px);
            min-width: 0;
          }
          .vault__doc-name {
            white-space: normal;
            overflow: visible;
            text-overflow: unset;
            line-height: 1.4;
            font-size: 13px;
          }
          .vault__doc-status {
            order: 3;
          }
          .vault__doc-date {
            width: auto;
            text-align: left;
            order: 4;
          }
          .vault__doc-action {
            opacity: 1 !important;
            order: 5;
          }
          .viewer {
            padding: 16px;
          }
          .viewer__panel {
            max-height: 90vh;
          }
          .viewer__header,
          .viewer__body,
          .viewer__footer {
            padding-left: 20px;
            padding-right: 20px;
          }
        }
      `}</style>
    </div>
  );
}
