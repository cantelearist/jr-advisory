---
name: rca-evidence-doctrine
description: >
  Shared evidentiary doctrine for ALL Roman Cantelearist Advisory due-diligence
  work. NEVER triggers on its own. Load this file whenever the
  pitch-deck-analysis or counterparty-vetting skill is invoked — both skills
  reference it as their doctrine core. If a banked lesson is evidentiary
  (applies to any DD target), it is added HERE, once, and inherited by both.
---

# RCA Evidence Doctrine (core — keep under one page)

## 1. Tagging — every finding carries its weight
- **VERIFIED** — two or more independent public sources.
- **SINGLE-SOURCE** — one source, uncorroborated. Usable, flagged.
- **UNVERIFIED** — forum/social/rumor. A lead to corroborate, never a finding.
- **NOT FOUND** — absent from sources searched. Not the same as cleared.

Independence must be demonstrated, not assumed: before crediting two
sources or analyses as mutually confirming, test for shared provenance —
verbatim or near-verbatim phrasing, identical framing, identical errors, or
a common upstream source demote the pair to SINGLE-SOURCE. Convergence of
non-independent sources is one source.

## 2. Absence rule
"Not found" ≠ "disproven." "No adverse record" ≠ "cleared." Unverifiability is
itself a finding. Distinguish low-INFORMATION from low-QUALITY; mark
screening-stage conclusions as conditional and revisable. State plainly which
records are portal-bound or paywalled and could not be reached.

A NOT FOUND carries its search protocol: the registries/databases queried,
the query terms used, and — in any non-Latin-script jurisdiction — every
transliteration and native-script variant searched. A NOT FOUND without a
logged protocol is UNVERIFIED. (A false "no press" negative is born exactly
here: searching a Latin brand name against a Cyrillic record base.)

## 3. Identity discipline
- State identity confidence explicitly (high / mod-high / moderate) for every
  attribution; never collapse two people or entities to tidy the picture.
- Quarantine namesakes by name: list who is explicitly NOT the subject.
- Refuse the false cognate: a shared name-root, surname ending, ethnicity, or
  association is NOT a link. A connection = a shared record (address, entity,
  transaction, co-party). Never infer wrongdoing from identity.

## 4. Cross-check
Test findings against each other (address↔ownership, ownership↔entities,
claims↔registries), prose conclusions against the tables offered as their
evidence, and re-test early findings against later ones. The picture
must be internally coherent before any verdict. Rhetorical force is not
analytical validity — verify a frame before deploying its argument, and flag
when you have adopted a source's own framing.

## 5. Verdict grammar
Verdicts are conditional, never binary: state the position, the conditions
precedent, the explicit go/no-go criteria, and the exact evidence that would
change the answer. Refusal or vague answers to material questions IS the
finding. Frame economics as option cost vs. option value.

## 6. Gap mapping
Enumerate what open sources cannot close and route each gap to the consented
or paid tool that can. The gap list is part of the product, not an apology.
Only consented or paid checks belong on the gap list — a check that is free
or near-free is run inside the engagement, not recommended (see the owning
skill's kill-gate).

## 7. Adversarial review
A solid draft is the input, not the output: independent reviewer persona with
no prior context → address every point with real fixes and fresh research →
re-rate. Always give the real rating; admit and fix errors in the open.

## 8. Delivery & final QC
House style per `rca_report_style.py` and its docstring (light ivory ground
on every page — NEVER a dark cover; Cormorant Garamond heads; champagne/gold
+ oxblood accents; small-caps wordmark; PRIVILEGED & CONFIDENTIAL; footer =
email + phone + page; transliterate Cyrillic in rendered text; ASCII hyphens
in serif cells). ALWAYS ask Roman for the client name before building.

Final QC = clean-room read of the rendered file, style AND substance:
- (i) every internal cross-reference resolves to content that exists in THIS
  draft — cutting material orphans its citations; hunt the ghosts;
- (ii) every figure appearing more than once matches everywhere it appears;
- (iii) every derived number is recomputed once from its stated inputs;
- (iv) cover and metadata go stale first — re-read them last; deliver a
  send-ready filename.
