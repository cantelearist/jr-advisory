# JR Advisory — Claude Code Project Context

## Project

**James Roman Advisory** — Independent, client-side advisory for hazardous-material remediation oversight in luxury homes across the Westside (Los Angeles).

Two apps in one repo:
- **Marketing site** — public-facing (`src/app/page.tsx` and `src/components/marketing/`)
- **Client portal** — authenticated workspace with admin panel (`src/app/portal/`)

Stack: Next.js 15, React 19, TypeScript, Supabase (Postgres + Auth + Storage), Vercel, Bun.

## RCA Skills Suite

Four skills are installed under `.claude/skills/rca/` and are available in every session:

| Skill | Path | Trigger |
|-------|------|---------|
| Evidence Doctrine | `.claude/skills/rca/rca-evidence-doctrine/` | Never self-triggers — loaded by reference |
| Counterparty Vetting | `.claude/skills/rca/counterparty-vetting/` | `/counterparty-vetting` or explicit request |
| Pitch Deck Analysis | `.claude/skills/rca/pitch-deck-analysis/` | `/pitch-deck-analysis` or explicit request |
| Report Style | `.claude/skills/rca/rca-report-style/` | Called by vetting/analysis when PDF requested |

The **Evidence Doctrine** is the shared core: it defines source tiers (T1/T2/T3), confidence scoring, red flag codes, and evidentiary standards. Both `counterparty-vetting` and `pitch-deck-analysis` load it before producing any findings.

`pitch-deck-analysis` auto-triggers `counterparty-vetting` at Stage 4 (entity vetting).

PDF reports use the ReportLab module at `.claude/skills/rca/rca-report-style/rca_report_style.py`.

**Font note:** Canela Deck (CG-*.ttf) fonts are binary and not committed to the repo. Install them locally:
```bash
unzip -o ~/Downloads/rca_fonts.zip -d ~/.claude/skills/rca/rca-report-style/rca_fonts/
```
The module falls back to Helvetica if fonts are missing.

## Dev Commands

```bash
bun install          # install deps
bun run dev          # dev server → http://localhost:3000
bun run build        # production build
bun run test         # unit tests (Vitest)
bun run lint         # ESLint
bun run typecheck    # tsc --noEmit
bun run ci           # full CI pipeline
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/constants.ts` | All firm data, copy, phone/email (update before go-live) |
| `src/app/globals.css` | Design system CSS variables |
| `src/app/portal/layout.tsx` | Portal auth wrapper |
| `src/app/api/` | All API routes |
| `supabase/` | DB migrations and schema |

## Environments

| Branch | Target | Purpose |
|--------|--------|---------|
| `main` | Vercel Production | Live site — `jamesroman.la` |
| PR branches | Vercel Preview | Review before merge |
| `feature/*` | Local | Development |
