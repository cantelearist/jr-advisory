# RCA Report Style

**Scaffold for generating branded PDF reports from JR Advisory research, due diligence, and analysis outputs.**

This skill describes the visual system, typography, layout, and Python module used to produce PDF reports in the James Roman Advisory house style. It is invoked by counterparty-vetting and pitch-deck-analysis when a PDF deliverable is requested.

---

## When to Invoke

Invoke when:
- A PDF report is requested from counterparty-vetting or pitch-deck-analysis
- The user asks to "generate a report," "export to PDF," or "produce the deliverable"
- A polished deliverable is needed for client presentation

---

## Typography

The report uses **Canela Deck** (CG) typeface family:

| File | Usage |
|------|-------|
| `CG-Regular.ttf` | Body text, captions |
| `CG-Medium.ttf` | Subheadings, table headers |
| `CG-SemiBold.ttf` | Section headings |
| `CG-Bold.ttf` | Cover title, alert labels |
| `CG-Italic.ttf` | Pull quotes, evidence citations |

Fonts are located at: `~/.claude/skills/rca/rca-report-style/rca_fonts/`

If fonts are not present, fall back to ReportLab built-ins: `Helvetica` (body), `Helvetica-Bold` (headings), `Helvetica-Oblique` (italic).

Font sizes:
- Cover title: 28pt Bold
- Section heading: 16pt SemiBold
- Subheading: 12pt Medium
- Body: 10pt Regular
- Caption / footnote: 8pt Regular
- Evidence citation: 9pt Italic

---

## Color Palette

```python
# Primary
MIDNIGHT  = HexColor("#0D0D0D")   # Cover background, heavy headers
IVORY     = HexColor("#F5F2EC")   # Cover text on dark, page background
CHARCOAL  = HexColor("#2C2C2C")   # Body text

# Accents
GOLD      = HexColor("#C9A84C")   # Rule lines, section dividers, cover accent
SLATE     = HexColor("#6B7280")   # Captions, footnotes, table borders
CREAM     = HexColor("#FAF8F4")   # Alternating table rows

# Alert colors
RED_FLAG  = HexColor("#B91C1C")   # Critical / DO NOT ENGAGE
AMBER     = HexColor("#D97706")   # Elevated risk / conditions
GREEN     = HexColor("#15803D")   # Clear / Recommend
BLUE_MUTED= HexColor("#3B5FA0")   # Informational callouts
```

---

## Page Layout

- **Page size:** Letter (8.5" × 11")
- **Margins:** Top 0.75", Bottom 0.75", Left 1.0", Right 1.0"
- **Header:** Firm wordmark left, document title right — 8pt SLATE
- **Footer:** Page number centered, date right, `CONFIDENTIAL` left — 8pt SLATE
- **Column grid:** Single column for narrative; 2-column for comparison tables
- **Section divider:** 0.5pt GOLD rule, full width, 6pt space above and below

---

## Cover Page

```
[MIDNIGHT background, full bleed]
[GOLD horizontal rule — 20% from top]

JAMES ROMAN ADVISORY                    [IVORY, 10pt Medium, tracked]
[document type in GOLD, 9pt Medium]

[document title in IVORY, 28pt Bold]
[subtitle or entity name in IVORY, 14pt Regular]

[GOLD horizontal rule — bottom quarter]

[bottom-left block, IVORY 8pt]:
Prepared for: [client name]
Date: [YYYY-MM-DD]
Classification: CONFIDENTIAL

[bottom-right block, IVORY 8pt]:
James Roman Advisory
Los Angeles, California
www.jamesroman.la
```

---

## Section Template

Each section (Ring, Stage, or appendix) uses:

```
[GOLD rule]
[Section number + title — 16pt SemiBold CHARCOAL]
[2pt space]
[Body paragraphs — 10pt Regular CHARCOAL, 14pt leading]
[Findings table if applicable]
[Red flag callout boxes if applicable]
[Source citations — 9pt Italic SLATE]
[GOLD rule]
```

---

## Callout Box Styles

**Red Flag Box:**
```
Border: 1pt RF color (RED_FLAG / AMBER depending on severity)
Background: tinted (10% of border color)
Icon: ⚠ in border color
Label: [RF-CODE] in Bold
Body: 10pt Regular
```

**Strength Box:**
```
Border: 1pt GREEN
Background: 10% GREEN tint
Icon: ✓ in GREEN
Body: 10pt Regular
```

**Informational Callout:**
```
Border: 1pt BLUE_MUTED
Background: 10% BLUE_MUTED tint
Body: 10pt Regular
```

---

## Summary / Verdict Block

The cover-page summary block uses a bordered verdict panel:

| Verdict | Border & fill |
|---------|---------------|
| CLEAR / RECOMMEND | GREEN border, 10% GREEN fill |
| PROCEED WITH CONDITIONS | AMBER border, 10% AMBER fill |
| ELEVATED RISK | AMBER border, 20% AMBER fill |
| DO NOT ENGAGE / DO NOT RECOMMEND | RED_FLAG border, 10% RED_FLAG fill |

Verdict text: 14pt Bold in the border color.

---

## Python Module

The report is generated using ReportLab via the module at:

```
~/.claude/skills/rca/rca-report-style/rca_report_style.py
```

### Quick-start

```python
from rca_report_style import RCAReport

report = RCAReport(
    title="Counterparty Vetting: Acme Environmental LLC",
    doc_type="Due Diligence Report",
    client="Confidential Client",
    output_path="~/Desktop/acme_vetting.pdf"
)

report.add_section(
    number=1,
    title="Ring 1 — Legal Identity",
    body="Acme Environmental LLC is registered with the CA SOS (Entity #202012345678) as an active California LLC, formed March 2018...",
    red_flags=[("RF-DOC", "medium", "DBA 'Acme Env' does not appear in SOS filings — confirm trade name registration")],
    sources=[("CA SOS Business Search", "T1", "2026-06-14")]
)

report.add_verdict(
    rating="PROCEED WITH CONDITIONS",
    confidence="Medium",
    red_flag_count=2,
    conditions=["Obtain trade name registration proof", "Verify COI with carrier directly"]
)

report.build()
```

### Module location

`~/.claude/skills/rca/rca-report-style/rca_report_style.py`

---

## Fonts Installation

Fonts are located at `~/.claude/skills/rca/rca-report-style/rca_fonts/`. Required files:

```
CG-Regular.ttf
CG-Medium.ttf
CG-SemiBold.ttf
CG-Bold.ttf
CG-Italic.ttf
```

To install from a zip package:
```bash
unzip -o ~/Downloads/rca_fonts.zip -d ~/.claude/skills/rca/rca-report-style/rca_fonts/
```

Verify:
```bash
ls ~/.claude/skills/rca/rca-report-style/rca_fonts/*.ttf
```

If fonts are missing, the module falls back to Helvetica/Helvetica-Bold/Helvetica-Oblique and logs a warning.

---

## Dependencies

```bash
pip install reportlab
```

ReportLab 4.x required. The module is compatible with Python 3.10+.

---

## Skill Version

`v1.0` · James Roman Advisory · `~/.claude/skills/rca/rca-report-style/SKILL.md`
