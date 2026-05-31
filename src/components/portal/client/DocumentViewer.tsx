'use client';

import type { DocItem } from './DocumentList';
import './documents.css';

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

  'lab-results': `INDEPENDENT ENVIRONMENTAL ASSESSMENT
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

interface DocumentViewerProps {
  document: DocItem;
  onClose: () => void;
}

export default function DocumentViewer({ document: doc, onClose }: DocumentViewerProps) {
  const content = SAMPLE_CONTENT[doc.rawCategory] || SAMPLE_CONTENT['reports'] || 'Document content loading...';

  return (
    <div className="viewer" onClick={onClose}>
      <div className="viewer__panel" onClick={(e) => e.stopPropagation()}>
        <div className="viewer__header">
          <div>
            <span className="viewer__label">{doc.category} · {doc.size}</span>
            <h2 className="viewer__title">{doc.name}</h2>
            <span className="viewer__date">{doc.date}</span>
          </div>
          <button className="viewer__close" onClick={onClose}>✕</button>
        </div>
        <div className="viewer__body">
          <pre className="viewer__content">{content}</pre>
        </div>
        <div className="viewer__footer">
          <span className="viewer__encrypted">⬡ Encrypted Document</span>
          <span className="viewer__notice">Sample content for demonstration purposes</span>
        </div>
      </div>
    </div>
  );
}
