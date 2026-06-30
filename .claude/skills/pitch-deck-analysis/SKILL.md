---
name: pitch-deck-analysis
description: Analyze a startup pitch deck (PDF, PowerPoint, Google Slides, or images) and produce a structured investor-grade assessment — slide-by-slide coverage check, scoring across the standard VC dimensions, strengths, weaknesses, red flags, and diligence questions. Use when the user shares a pitch deck or asks to review, evaluate, score, or critique one.
---

# Pitch Deck Analysis

Evaluate a pitch deck the way an experienced early-stage investor would: assess
whether the deck tells a fundable story, scores well on the dimensions that
drive investment decisions, and surfaces the gaps and questions that diligence
would chase down.

## When to use this skill

Trigger on any of: "review this deck", "analyze this pitch deck", "score my
deck", "what's missing from this pitch", "would you invest", "critique these
slides", or whenever the user attaches a pitch deck file.

## Inputs

A deck arrives in one of these forms. Get it into readable text/images first.

| Format | How to read it |
| --- | --- |
| PDF | Use the `Read` tool with `pages` to read slides as images/text. For decks over 10 pages, read in batches of ≤20 pages. |
| PowerPoint (.pptx) | Convert with a tool (e.g. `libreoffice --headless --convert-to pdf deck.pptx`) then read the PDF, or extract text from the XML. |
| Google Slides | Ask for an exported PDF, or use the Google Drive tools to download/export. |
| Images (.png/.jpg) | Read each slide image directly with the `Read` tool. |
| A link | Ask the user to export to PDF and attach, unless a fetch tool can retrieve it. |

If you cannot access the deck, ask the user to attach it as a PDF — do not
fabricate an analysis from the filename or a description.

## Workflow

1. **Ingest every slide.** Read the entire deck before judging anything. Note
   the slide count and the order. Decks are a narrative; sequence matters.

2. **Map coverage.** Check which of the canonical deck components are present,
   missing, or weak. See `references/deck-components.md` for the checklist and
   what "good" looks like for each.

3. **Score each dimension.** Rate the seven investment dimensions in
   `references/scoring-rubric.md` on a 1–5 scale with one-line justifications.
   Anchor scores to evidence in the deck, not vibes.

4. **Identify red flags.** Flag anything that would stall or kill a deal —
   inflated TAM, hockey-stick projections with no basis, no real traction,
   undisclosed cap-table problems, vague use of funds, no clear moat. See the
   red-flags list in the rubric reference.

5. **Write diligence questions.** The 5–10 questions an investor would ask in
   the first meeting. These are the most useful output for a founder.

6. **Render the report.** Use the structure in
   `references/report-template.md`. Lead with the verdict, then the evidence.

## Operating principles

- **Be specific and cite the deck.** "Slide 6's TAM of $50B is top-down with no
  bottom-up build" beats "market sizing could be stronger."
- **Separate the deck from the company.** A weak deck can hide a strong company
  and vice versa. Note when a gap is a *presentation* problem (fixable by
  editing) versus a *business* problem (fixable only by the company).
- **Calibrate to stage.** Pre-seed is judged on team + insight + market;
  Series A is judged on traction, unit economics, and repeatable GTM. Don't
  ding a pre-seed deck for lacking three years of revenue. Ask the stage if it
  is not stated.
- **Be candid, not cruel.** The goal is to make the raise succeed. Frame every
  weakness with what would fix it.
- **Don't invent numbers.** If the deck omits CAC, LTV, burn, or runway, say
  so — that absence is itself a finding.

## Output

Produce the report inline by default. If the user wants a deliverable file
(PDF, slide notes, a one-pager), offer to generate it after the inline review.
