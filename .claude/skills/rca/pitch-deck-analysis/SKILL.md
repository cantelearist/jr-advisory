# Pitch Deck Analysis

**Investor-side assessment of contractor proposals, business decks, and engagement pitches received by James Roman Advisory or its clients.**

Applies the RCA Evidence Doctrine (`~/.claude/skills/rca/rca-evidence-doctrine/`) to all factual claims. At Stage 4, triggers counterparty-vetting (`~/.claude/skills/rca/counterparty-vetting/`) on the presenting entity. Output formatted per `~/.claude/skills/rca/rca-report-style/` when a PDF is requested.

---

## Trigger

Invoke when asked to:
- Assess, score, or critique a pitch deck, proposal, or SOW
- Evaluate a contractor's bid or presentation materials
- Review a business partnership proposal
- Provide a second opinion on a vendor's claims

---

## Pre-flight

Collect before starting:

```
Deck / document title:
Presenting entity (legal name if known):
Date of deck:
Proposed scope or ask:
File provided (PDF / slides / URL):
Context: [client engagement / advisory / internal review]
```

If the deck has not been provided, ask for it. Do not proceed on descriptions alone.

---

## 8-Stage Assessment

---

### Stage 1 — First-Read Impression

**Goal:** Capture the unguarded first impression before deep analysis. This often surfaces the strongest signals.

Read the full deck once without stopping. Note:
- What is the core thesis in one sentence?
- What is the ask (money, engagement, partnership)?
- What questions arise immediately?
- What feels off, oversold, or underexplained?

Output: A 3–5 sentence unfiltered impression. Label it `First Read` — clearly marked as pre-analysis, not a finding.

---

### Stage 2 — Structure & Completeness Audit

**Goal:** Confirm the deck contains the elements needed for informed decision-making.

Check for presence and adequacy of:

| Element | Present? | Adequate? |
|---------|----------|-----------|
| Company / entity overview | | |
| Team bios with verifiable credentials | | |
| Problem statement | | |
| Proposed solution / approach | | |
| Scope of work or deliverables | | |
| Timeline / milestones | | |
| Pricing / fee structure | | |
| Financial projections (if applicable) | | |
| Regulatory / compliance approach | | |
| References or past work samples | | |
| Risk disclosures | | |
| Legal terms or exclusions | | |

For each missing element: note it as a gap. Gaps ≥ 4 trigger an overall `INCOMPLETE` flag — the deck cannot be fully scored.

---

### Stage 3 — Claims Analysis

**Goal:** Identify all material factual claims and assess their verifiability.

Extract every claim that falls into these categories:
- Credentials ("we hold X certification")
- Experience ("we've completed X projects of this type")
- Financials ("our revenue is X" / "cost will be Y")
- Performance ("our TRIR is X" / "we've never had a regulatory violation")
- Exclusivity or uniqueness ("we are the only firm in LA that…")

For each claim:
1. Assign a Tier (T1/T2/T3) based on supporting evidence in the deck
2. Flag as **Verifiable** (can be checked) or **Unverifiable** (cannot be confirmed)
3. Note any internal inconsistencies (claim A contradicts claim B in the same deck)

Apply `RF-DOC` if any claim appears inflated or inconsistent with supporting materials.

---

### Stage 4 — Counterparty Vetting (Auto-triggered)

**Goal:** Run the 13-ring vetting framework on the presenting entity.

Automatically invoke `~/.claude/skills/rca/counterparty-vetting/SKILL.md` with:
- Entity name from the deck
- License numbers cited in the deck (Rings 2–3 pre-seeded)
- Scope of work (for Ring 10 equipment check)

Output a condensed vetting summary (Rings 1–9 minimum; Rings 10–13 if time allows). Attach as Appendix A to the pitch deck analysis.

Note: If the user has already completed a separate counterparty vetting, ask if they want to import those results rather than re-run.

---

### Stage 5 — Financial & Pricing Analysis

**Goal:** Assess whether the financial ask is reasonable, transparent, and internally consistent.

Evaluate:

**Pricing:**
- Is the fee structure clear (lump sum, T&M, unit price)?
- Are all cost components itemized or is pricing opaque?
- How does pricing compare to market norms for this scope? (Use JR Advisory benchmark data if available; note "benchmark comparison" as T2/T3)
- Are change-order triggers defined and limited?

**Financial Projections (if included):**
- Are revenue/cost assumptions stated explicitly?
- Are growth rates defensible or aspirational?
- Is burn rate / cash flow addressed?
- Are projections audited or management-only?

**Red flags:**
- `RF-FIN` for pricing that is suspiciously low (below cost of materials + labor)
- `RF-DOC` for projections with no stated assumptions
- `RF-OPS` for scope that appears understaffed for the quoted price

---

### Stage 6 — Risk & Red Flag Register

**Goal:** Compile all red flags from Stages 1–5 into a single register.

Use the Evidence Doctrine red flag codes (`RF-LIC`, `RF-INS`, `RF-FIN`, `RF-REG`, `RF-SAF`, `RF-LIT`, `RF-REP`, `RF-PER`, `RF-OPS`, `RF-DOC`).

Format each entry:

```
[Code] · Stage [N] · Severity: [Low / Medium / High / Critical]
Finding: [one sentence description]
Evidence tier: [T1 / T2 / T3]
Recommended action: [Clarify / Verify / Reject / Condition]
```

Severity thresholds:
- **Critical**: Would alone justify rejection (fraud signal, missing required license, active bankruptcy)
- **High**: Requires resolution before engagement
- **Medium**: Note and monitor; request clarification
- **Low**: Informational; document only

---

### Stage 7 — Strengths Register

**Goal:** Identify genuine positives to balance the risk register. Avoid false symmetry — only include real strengths, not filler.

Strengths must be:
- T1 or T2 verified (not self-reported without corroboration)
- Material to the proposed scope
- Differentiated (not generic "many years of experience" without specifics)

Format each entry:

```
Strength: [description]
Evidence tier: [T1 / T2]
Relevance: [why it matters for this engagement]
```

---

### Stage 8 — Recommendation

**Goal:** Provide a clear, actionable recommendation.

Outputs one of four verdicts:

| Verdict | Criteria |
|---------|----------|
| **RECOMMEND** | No critical/high flags; strengths material; pricing fair |
| **RECOMMEND WITH CONDITIONS** | 1–2 high flags resolvable by conditions; no critical flags |
| **REQUEST CLARIFICATION FIRST** | Material gaps or unverifiable claims prevent full assessment |
| **DO NOT RECOMMEND** | Any critical flag; or pattern of ≥ 3 high flags; or counterparty vetting returns DO NOT ENGAGE |

Include:
- The verdict and rationale (2–4 sentences)
- Conditions list (if applicable)
- Questions to ask the presenter before deciding (if clarification needed)
- Suggested next steps

---

## Summary Block Format

```
PITCH DECK ANALYSIS SUMMARY
Deck: [Title]
Entity: [Legal name]
Date of deck: [YYYY-MM-DD]
Analysis date: [YYYY-MM-DD]
Conducted by: RCA / James Roman Advisory

Verdict: [RECOMMEND / RECOMMEND WITH CONDITIONS / REQUEST CLARIFICATION / DO NOT RECOMMEND]
Confidence: [High / Medium / Low]

Red Flags: [count] ([Critical: N] [High: N] [Medium: N] [Low: N])
Strengths: [count]
Completeness: [Complete / Incomplete — N gaps]

Counterparty Vetting Rating: [from Appendix A]

Conditions (if applicable):
  1. [condition]

Next Steps:
  1. [action]

Evidence Doctrine v1.0 · ~/.claude/skills/rca/rca-evidence-doctrine/
Counterparty Vetting · ~/.claude/skills/rca/counterparty-vetting/
```

---

## PDF Output

When the user requests a report, invoke `~/.claude/skills/rca/rca-report-style/SKILL.md` and pass:
- Deck title as document title
- Summary block as cover
- Stages 1–8 as body sections
- Counterparty vetting results as Appendix A
- Red flag register as Appendix B
- Strengths register as Appendix C
