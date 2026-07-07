# RCA Due-Diligence Skill Architecture — Install & Change Notes (v2)

## What this is
Three skills sharing one extracted doctrine core, with counterparty vetting
callable standalone or as Stage 4 of deck analysis. v2 banks the lessons
from the USpace cross-examination session (July 2026): an adversarial rerun
of the skill's own USpace memo against a rival AI-generated memo, which
surfaced residual defects in both documents and in this pack itself.

```
rca_skills/
  rca-evidence-doctrine/SKILL.md    REVISED — independence test, NOT FOUND
                                    search protocol, prose-vs-exhibit check,
                                    analytical final QC
  pitch-deck-analysis/SKILL.md      REVISED — standards 6–8, hardened kill
                                    gate, rival-analysis stage, coherence pass
  counterparty-vetting/SKILL.md     REVISED — stale Stage-3 reference fixed;
                                    doctrine §2 search-protocol note added
```

## Install
Copy the three folders into your skills directory. This zip's layout matches
these commands exactly (v1's did not — the folders were nested under a
sandbox `mnt/user-data/outputs/` path and the doctrine sat at the zip root):

```bash
cp -r rca_skills/rca-evidence-doctrine  ~/.claude/skills/
cp -r rca_skills/counterparty-vetting   ~/.claude/skills/
cp -r rca_skills/pitch-deck-analysis    ~/.claude/skills/   # overwrites existing
```

(Adjust the destination if your skills root differs — your UI/UX skill sits at
`~/.claude/skills/.claude/skills/`, so verify which root your loader reads.)

## What changed in v2 (all from the USpace cross-examination session)

### rca-evidence-doctrine
1. **§1 Independence test.** VERIFIED requires *demonstrated* independence:
   near-verbatim phrasing, identical framing/errors, or a common upstream
   source demote a corroborating pair to SINGLE-SOURCE. (Two "independent"
   USpace memos shared a near-verbatim sentence — the corroboration value of
   their convergence partially collapsed on inspection.)
2. **§2 NOT FOUND search protocol.** Every NOT FOUND logs the databases
   queried, the query terms, and all transliteration/native-script variants.
   A NOT FOUND without a protocol is UNVERIFIED. (The rival memo's "no
   press" was falsified by a named 2023 citation, poisoning its other five
   NONE FOUNDs.)
3. **§4 Prose-vs-exhibit check.** Conclusions are tested against the tables
   offered as their evidence. (The USpace memo's "at or above local market"
   sat mid-range in its own comp table.)
4. **§6** now cross-references the kill-gate rule: free checks are run, not
   gap-listed.
5. **§8 Final QC extended from cosmetic to analytical:** (i) every internal
   cross-reference resolves — the memo shipped citing a §4.4 figure that an
   earlier edit had deleted; (ii) repeated figures match everywhere — it
   shipped 600–1,000 and 800–1,200 units/yr for the same claim on one page;
   (iii) every derived number recomputed once from stated inputs. Style
   detail moved to `rca_report_style.py`'s docstring to hold the one-page
   budget.

### pitch-deck-analysis
6. **Standard #6 — program parameters, not just throughput.** Pull the full
   eligibility ruleset (price caps, geography, buyer bands, NACE/sector
   scope) and test the deck's numbers against every parameter. (Missed:
   the $1,350/m² price breached the program's $1,261/m² cap; the tax
   holiday's NACE scope excluded most of the revenue mix. Both were found
   by the rival memo.)
7. **Standard #7 — define the denominator** of every ratio at first use
   (margin-on-price 26% vs markup-on-cost 35% read as a disagreement and
   wasn't).
8. **Standard #8 — state a dollar valuation mark** alongside the return
   bridge, and reconcile every magnitude claim across sections.
9. **Stage 1 kill-gate hardened:** free/near-free kill checks are EXECUTED
   with a logged protocol; only consented/paid checks defer to the gap
   list; a verdict may not rest primarily on a check declined-to-run. (The
   memo's verdict-carrying counterparty finding was its least-performed
   check — the registry pass it listed as future diligence, the rival ran.)
10. **Stage 6:** FX / capital controls / repatriation is a mandatory risk
    row for cross-border deals (the rival memo omitted the category
    entirely).
11. **New Stage 8 — rival-analysis cross-examination.** When a second
    analysis of the same target exists: recompute both, matrix the claims,
    test provenance independence before crediting convergence, verify the
    rival's unique falsifiable facts directly, rate both as work product.
    Trigger added to the frontmatter description.
12. **Adversarial loop — dedicated internal-coherence pass:** hunt argument
    pairs that mutually undercut and magnitude claims that disagree across
    sections.

### counterparty-vetting
13. **Stale cross-reference fixed:** frontmatter said "Stage 3 (counterparty
    OSINT)"; the deck skill's rewire made it Stage 4. Same defect class as
    the memo's ghost §4.4 figure — see guardrail below.
14. Doctrine-§2 search-protocol note added under the doctrine header (name
    variants incl. native script). Rings unchanged — this session exercised
    document-level DD, not person-level; harden the rings after the next
    1–2 vetting jobs as planned.

## Routing rule for future banked lessons
- Evidentiary (any DD target)        → rca-evidence-doctrine
- Deal-economics (benchmarks, EV…)   → pitch-deck-analysis
- Person-level (namesakes, FCRA…)    → counterparty-vetting

## Guardrails on the architecture itself
- Doctrine core stays under ~one page. If it grows past that, workflow has
  leaked into doctrine — push it back into the owning skill.
- Both skills MUST keep their explicit "load the doctrine" line at the top;
  that reference is what prevents drift.
- **Pack-level coherence (new):** any edit that renames, renumbers, or
  removes a stage/section in one file requires grepping the OTHER TWO files
  for the old reference before shipping. The pack itself shipped v1 with a
  stale "Stage 3" pointer — the same ghost-reference defect the QC standard
  exists to catch in reports.
- **Packaging (new):** before zipping, verify the archive layout matches the
  install commands in this file — build from a clean `rca_skills/` folder,
  never from a sandbox output path.
- The counterparty-vetting ring structure is one engagement old (Khobian).
  Treat it as v1; expect to harden it after the next 1–2 vetting jobs, the
  same way pitch-deck-analysis was hardened after USpace — and now again
  after the USpace cross-examination.
