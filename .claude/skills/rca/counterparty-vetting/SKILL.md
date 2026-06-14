# Counterparty Vetting

**Person- and company-level due diligence. 13-ring framework for hazmat remediation contractors, subcontractors, vendors, and business partners.**

Applies the RCA Evidence Doctrine (`~/.claude/skills/rca/rca-evidence-doctrine/`) at every ring. Output formatted per `~/.claude/skills/rca/rca-report-style/` when a PDF deliverable is requested.

---

## Trigger

Invoke this skill when asked to:
- Vet, screen, or background-check a contractor, vendor, partner, or individual
- Produce a counterparty due-diligence report
- Assess risk before engaging a remediation firm
- Compare two or more bidders

Do **not** self-trigger. Only run when explicitly called by the user or invoked by pitch-deck-analysis at Stage 4.

---

## Pre-flight

Before running the 13 rings, collect:

```
Entity name (legal):
DBA / trade name:
License number (if known):
State of incorporation:
Principal contact name:
Website / LinkedIn:
Scope of proposed engagement:
```

If any field is missing, ask before proceeding. Do not infer license numbers or entity names.

---

## The 13 Rings

Work each ring sequentially. At each ring, apply the Evidence Doctrine: assign tier, check for red flags, and compute section confidence.

---

### Ring 1 — Legal Identity & Corporate Structure

**Goal:** Confirm the entity is legally registered and in good standing.

Sources (T1):
- Secretary of State: CA SOS Business Search (`bizfileonline.sos.ca.gov`)
- If LLC/Corp: check registered agent, filing date, active/suspended status
- FEIN confirmation if available

Findings to capture:
- Entity type (LLC, Corp, SP)
- Date of formation
- Registered agent name and address
- Current status (Active / Suspended / Dissolved)
- Any name changes or DBA registrations

Red flags: `RF-DOC` if name on contract ≠ registered name; `RF-FIN` if suspended.

---

### Ring 2 — State & Local Licensing

**Goal:** Confirm the entity holds the correct contractor licenses for the proposed scope.

Sources (T1):
- CSLB License Check (`cslb.ca.gov/OnlineServices/CheckLicense`)
- LA City Building & Safety if applicable
- Any specialty licenses (lead, asbestos, mold — CDPH)

Findings to capture:
- License class(es) and numbers
- Expiration date(s)
- License holder name (must match contract entity or RMO listed)
- Bond amount on license
- Any disciplinary actions on the license record

Red flags: `RF-LIC` for expired, suspended, wrong class, or RMO mismatch.

---

### Ring 3 — EPA / DTSC / CDPH Certifications

**Goal:** Confirm environmental certifications are current and match scope.

Sources (T1):
- EPA RCRA Info / ECHO (`echo.epa.gov`)
- DTSC Enforcement Actions (`dtsc.ca.gov`)
- CDPH Lead & Asbestos certifications
- AHERA accreditation if school/public building work

Findings to capture:
- Certification type and number
- Expiration date
- Issuing agency
- Any violations, consent orders, or permit revocations

Red flags: `RF-REG` for violations or lapsed certifications; `RF-LIC` for missing required certs.

---

### Ring 4 — Insurance & Surety Bonds

**Goal:** Confirm adequate insurance and bonding for the scope.

Minimum thresholds (JR Advisory standard):
- General Liability: $2M per occurrence / $4M aggregate
- Workers' Comp: Statutory CA limits
- Pollution Liability: $1M minimum for hazmat work
- Contractor License Bond: $25,000 (CA statutory)
- Umbrella: $5M recommended for engagements > $500K

Sources (T2 — verify with carrier):
- Certificate of Insurance (COI) from entity
- Carrier confirmation call or ACORD 25 verification
- CSLB bond check

Findings to capture:
- Each policy: carrier, policy number, limits, expiration
- Named insured matches contract entity
- Additional insured endorsement status
- Any gaps, lapses, or exclusions for hazmat work

Red flags: `RF-INS` for gaps, lapses, insufficient limits, or missing pollution coverage.

---

### Ring 5 — Financial Solvency

**Goal:** Assess financial health and ability to complete the engagement.

Sources (T1/T2):
- UCC lien search via CA SOS or PACER
- Judgment search via county court records
- Bankruptcy search via PACER (`pacer.gov`)
- D&B or Experian Business (if available)
- Dun & Bradstreet PAYDEX score (T2)

Findings to capture:
- Active UCC filings (secured creditors)
- Judgments and amounts
- Bankruptcy history (Chapter 7, 11, 13)
- Payment index / PAYDEX if available
- Any tax liens (CA FTB or IRS)

Red flags: `RF-FIN` for active bankruptcy, large unsatisfied judgments, multiple liens, or IRS levies.

---

### Ring 6 — Litigation History

**Goal:** Identify pattern of disputes, fraud, or professional negligence.

Sources (T1):
- CA Courts case search (`courts.ca.gov`)
- PACER federal courts
- LA Superior Court (`lacourt.org`)
- CSLB arbitration and complaint history

Findings to capture:
- Case captions, numbers, and case types
- Outcome (settled, judgment, dismissed)
- Patterns: contractor abandonment, defective work, wage theft, fraud
- Cases naming key principals individually

Red flags: `RF-LIT` for active material litigation; flag patterns of same issue type (≥ 2 = pattern).

---

### Ring 7 — Regulatory Sanctions & Violations

**Goal:** Find regulatory enforcement actions beyond licensing.

Sources (T1):
- EPA ECHO enforcement search
- DTSC enforcement actions
- CA DIR / DLSE wage claims
- Cal/OSHA enforcement data
- LA County Dept of Public Health violations

Findings to capture:
- Agency, violation type, date
- Penalty amount (paid vs. unpaid)
- Consent orders or corrective action plans
- Recurrence of same violation type

Red flags: `RF-REG` for all violations; elevate to critical if hazmat-specific and within 36 months.

---

### Ring 8 — OSHA & Safety Record

**Goal:** Assess workplace safety culture and incident history.

Sources (T1):
- OSHA Establishment Search (`osha.gov/pls/imis/establishment.html`)
- Cal/OSHA inspection history (`dir.ca.gov`)
- EMR (Experience Modification Rate) from workers' comp carrier (T2)

Findings to capture:
- Total recordable incident rate (TRIR) if available
- Number and severity of OSHA citations (serious, willful, repeat)
- Fatalities or hospitalization events
- EMR value (benchmark: < 1.0 is standard; < 0.8 preferred for hazmat)

Red flags: `RF-SAF` for willful/repeat violations; critical if fatality within 5 years.

---

### Ring 9 — Key Personnel Background

**Goal:** Assess principals, RMOs, project managers, and supervisors.

Sources (T1/T2):
- CA SOS officer filings
- CSLB RMO verification
- LinkedIn profile cross-check (T3 — flag discrepancies only)
- State Bar / professional license check for named professionals
- Criminal background via professional screening vendor if authorized

Findings to capture:
- Legal name of principals vs. public representation
- Prior entity associations and their outcomes
- Any professional license suspensions or revocations
- Resume accuracy flags (T3 only — note, do not score)

Red flags: `RF-PER` for undisclosed principals, prior license revocations on key individuals, or prior fraud allegations.

---

### Ring 10 — Equipment & Material Certifications

**Goal:** Confirm the entity has certified equipment and compliant materials for hazmat scope.

Sources (T2):
- Equipment certification records (supplied by entity)
- Material Safety Data Sheets (SDS) for any chemicals used
- Disposal facility permits (licensed TSDF)
- Chain-of-custody documentation for hazardous waste transport

Findings to capture:
- Equipment list vs. scope requirements
- TSDF name, permit number, expiration
- Any use of unlicensed disposal or non-compliant materials

Red flags: `RF-OPS` for gaps; `RF-REG` if using unpermitted disposal facilities.

---

### Ring 11 — Reference Interviews

**Goal:** Independently verify quality, reliability, and conduct on past projects.

Protocol:
1. Request 3 references from entity — similar scope and scale
2. Contact all three via phone (not email — email allows coached responses)
3. Use structured questions:
   - Did they complete on time and on budget?
   - Were there any regulatory issues during the project?
   - Would you hire them again? Why / why not?
   - Were there any disputes or change order conflicts?
4. Seek one unsolicited reference (former client not on their list)

Sources (T2):
- Reference call notes (contemporaneous)
- Permit records for cited past projects (cross-check via T1)

Red flags: `RF-REP` if ≥ 2 of 3 references raise the same concern; flag unsolicited reference negatives at full weight.

---

### Ring 12 — Physical Site & Operations Inspection

**Goal:** Confirm entity has real operational presence at claimed location.

When to conduct: Engagements > $250K or when Rings 1–11 produce conflicting signals.

Protocol:
1. Unannounced or short-notice visit to business address
2. Confirm: signage, equipment present, staff on site
3. Review: license postings, safety binder, MSDS binder
4. Note: condition of facility, organization, professionalism

Red flags: `RF-OPS` for virtual-only address, no equipment, unstaffed, or address mismatch with SOS filing.

---

### Ring 13 — Online Reputation & Press

**Goal:** Detect reputation risks not captured in formal records.

Sources (T3 — all findings must be labeled T3 and not scored):
- Google News, Yelp, BBB, Houzz, Angi
- LinkedIn company profile and principals
- Glassdoor (employee satisfaction)
- Local news archives (LA Times, Daily News)
- Any social media red flags (claims, disputes, public conflicts)

Findings to capture:
- Pattern of BBB complaints or unresolved disputes
- Media coverage (positive and negative)
- Glassdoor signals on management or safety culture

Red flags: `RF-REP` — label T3, note pattern if ≥ 3 consistent negative signals across independent sources.

---

## Scoring & Summary

After all 13 rings, compile:

### Overall Risk Rating

| Rating | Criteria |
|--------|----------|
| **CLEAR** | No red flags; confidence High across all material rings |
| **PROCEED WITH CONDITIONS** | 1–2 low-severity red flags; conditions documented |
| **ELEVATED RISK** | ≥ 1 medium-severity flag or ≥ 3 low-severity flags |
| **DO NOT ENGAGE** | Any critical red flag (willful OSHA, active fraud litigation, insurance gap for hazmat scope, lapsed core certifications) |

### Summary Block Format

```
COUNTERPARTY VETTING SUMMARY
Entity: [Legal name]
Date: [YYYY-MM-DD]
Conducted by: RCA / James Roman Advisory

Overall Rating: [CLEAR / PROCEED WITH CONDITIONS / ELEVATED RISK / DO NOT ENGAGE]
Confidence: [High / Medium / Low]

Red Flags Identified: [count]
  [code] [ring] [one-line description]

Conditions (if applicable):
  1. [condition]
  2. [condition]

Evidence Doctrine v1.0 · ~/.claude/skills/rca/rca-evidence-doctrine/
```

---

## PDF Output

When the user requests a report, invoke `~/.claude/skills/rca/rca-report-style/SKILL.md` and pass:
- Entity name as document title
- Summary block as cover page content
- Ring findings as body sections
- Red flag log as appendix
