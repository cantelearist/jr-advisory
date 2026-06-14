# RCA Evidence Doctrine

**Shared doctrine core — never self-triggers. Loaded by reference from counterparty-vetting and pitch-deck-analysis.**

This file defines the evidentiary standards, source hierarchy, and confidence-scoring methodology used across all RCA research and due-diligence work. Any skill that generates findings, assessments, or reports must apply this doctrine before presenting conclusions.

---

## Evidentiary Standards

### Source Tiers

| Tier | Label | Examples | Weight |
|------|-------|----------|--------|
| T1 | Primary / authoritative | Secretary of State filings, CSLB license database, court dockets, EPA ECHO, OSHA IMIS, Supabase portal records | 1.0 |
| T2 | Secondary / corroborated | Verified third-party reports, trade references with contact confirmation, insurance certificates with carrier verification | 0.75 |
| T3 | Tertiary / unverified | Press mentions, web bios, Yelp/Google reviews, LinkedIn profiles, unverified claims | 0.35 |
| T0 | Hearsay / unverifiable | Anonymous tips, secondhand accounts, AI-generated summaries without citation | 0.0 — flag only, never score |

### Confidence Scoring

For each Ring or section, compute a confidence score (0–100) as follows:

```
raw_score = Σ (finding_weight × tier_weight) / max_possible
confidence = floor(raw_score × 100)
```

Report confidence as one of:
- **High** (75–100): T1 evidence covers all material claims
- **Medium** (40–74): Mix of T1 and T2; no material gaps
- **Low** (0–39): Gaps exist; T3 dominates; flag explicitly
- **Inconclusive**: Insufficient evidence to score — do not infer

### Conflicting Evidence Protocol

When T1 sources conflict with T2/T3:
1. State both findings explicitly — do not suppress the minority finding
2. Note the discrepancy with source citations
3. Score based on the T1 source but flag for human review
4. Add an `⚠ CONFLICT` marker in the summary block

When two T1 sources conflict (rare):
- Present both verbatim
- Label the section `CONTESTED — VERIFY DIRECT`
- Do not resolve the conflict in the output

---

## Evidence Chain Requirements

Every material finding must include:
1. **Source**: Name of database, document, or person
2. **Date retrieved / dated**: When the evidence was captured or dated
3. **Tier**: T1 / T2 / T3
4. **Verifiable link or reference**: URL, docket number, license number, etc.

Findings without a source citation are inadmissible for scoring purposes. They may appear in a `Unverified Leads` appendix only.

---

## Materiality Thresholds

A finding is **material** if it meets any of the following:
- It would cause a reasonable client to alter their decision
- It represents a legal or regulatory violation
- It involves a financial exposure > $10,000
- It contradicts a claim made by the counterparty
- It reveals a pattern (≥ 2 incidents of the same type)

Immaterial findings may be noted in passing but must not inflate risk scores.

---

## Red Flag Taxonomy

Use these standard labels to tag adverse findings:

| Code | Meaning |
|------|---------|
| `RF-LIC` | Licensing deficiency (expired, suspended, wrong class) |
| `RF-INS` | Insurance gap or lapse |
| `RF-FIN` | Financial distress signal (lien, judgment, bankruptcy) |
| `RF-REG` | Regulatory violation or consent order |
| `RF-SAF` | Safety violation (OSHA citation, incident record) |
| `RF-LIT` | Material litigation (active or recent adverse judgment) |
| `RF-REP` | Reputation risk (pattern of complaints, media coverage) |
| `RF-PER` | Personnel concern (undisclosed principals, background issue) |
| `RF-OPS` | Operational deficiency (equipment, capacity, process) |
| `RF-DOC` | Document inconsistency or potential falsification |

Multiple RF codes may apply to a single finding. List all that apply.

---

## Output Obligations

Every skill that applies this doctrine must:

1. Display source tier for each cited finding
2. Show the confidence level per section and overall
3. Apply red flag codes where applicable
4. Include a `Doctrine version` footer: `Evidence Doctrine v1.0 · ~/.claude/skills/rca/rca-evidence-doctrine/`
5. Never present an opinion as a finding — clearly distinguish analysis from fact

---

## Doctrine Version

`v1.0` · James Roman Advisory · `~/.claude/skills/rca/rca-evidence-doctrine/SKILL.md`
