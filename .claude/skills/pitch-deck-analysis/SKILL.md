---
name: pitch-deck-analysis
description: >
  Use this skill when Roman provides an investment pitch deck, teaser, PPM, or
  fundraising/partnership proposal and wants it assessed on behalf of a
  prospective INVESTOR (not the issuer). Triggers: "analyze this deck",
  "should we invest", "review this opportunity", "is this a scam / is this real",
  "due diligence on [a deal/deck]", or any uploaded deck whose purpose is to
  raise capital or secure a partner. Also use when Roman provides a SECOND
  analysis of the same target and asks to compare or cross-examine — see the
  rival-analysis step. Produces a quantified, benchmarked, stress-tested
  investment + counterparty + political-risk memorandum in the Roman
  Cantelearist Advisory house style (PDF), with an adversarial multi-agent
  review loop. Do NOT use for the issuer's own fundraising materials (that is
  a deck-creation task), for non-investment document review, or for vetting a
  PERSON as such (that is counterparty-vetting).
---

# Pitch Deck Analysis — Investor-Side Assessment

## Doctrine (mandatory)
Load and apply `~/.claude/skills/rca-evidence-doctrine/SKILL.md` before
anything else. Tagging, absence rule, identity discipline, cross-check,
verdict grammar, gap mapping, adversarial review, and the delivery standard
come from the doctrine core and are not restated here.

## Purpose
Turn a promotional pitch deck into a hard, investor-side decision memo. The
deck is advocacy; the job is to find what is true, what is unverifiable, and
what the terms would have to be — then give a defensible verdict.

## Posture (non-negotiable)
- Represent the INVESTOR. The issuer's numbers are *claims* until verified.
- Look equally hard for strengths and weaknesses. No cheerleading, no
  hit-piece.

## Deal-economics standards (deck-specific banked lessons — add new ones here)
1. **Benchmarks must be like-for-like.** Never compare a development IRR to
   operating-company equity bands or to debt yields. Use the correct
   comparator and explicitly label any different instrument shown for
   reference (e.g. sovereign yield = liquidity floor). Show the premium
   bridge (base hurdle + named premia), never a bare asserted band.
2. **Price enforceability of mitigants.** Legal security (mortgage, pledge,
   step-in, escrow) is only as good as the forum. In weak-rule-of-law /
   wartime jurisdictions, treat recovery as politically binary regardless of
   paper.
3. **Demand the term sheet.** If ticket, instrument, stake, valuation, and
   exit mechanics are absent, state that you are evaluating a *concept* and
   specify the terms the deal would have to meet.
4. **Project IRR is not a platform return.** A platform return depends on
   fees, carry, and stakes across many projects, each of which must clear its
   own risk-adjusted hurdle. Flag any conflation, and any internal
   inconsistency between exhibits and stated totals.
5. **Use breakeven probability, not point EV, where inputs are soft.** Show
   the arithmetic either way; never let computed precision launder uncertain
   inputs.
6. **Test program parameters, not just program throughput.** When a deck
   leans on a state program or tax regime, pull the FULL eligibility ruleset
   — price caps, geographic bands, buyer criteria, sector/NACE scope — and
   test the deck's own numbers against every parameter. Throughput tells you
   the pool is small; parameters tell you the deal may not be in the pool at
   all. (USpace lesson: sized eOselya's volume, missed that the unit price
   breached the program's per-m² cap and that the tax holiday's NACE scope
   excluded most of the revenue mix.)
7. **Define the denominator.** State the basis of every ratio — margin,
   spread, premium, discount, on-cost vs on-price — at first use. Two memos
   said "26%" and "35%" about the same claim and both were right.
8. **State a dollar mark, not just return adequacy.** Always give a
   defensible valuation range in dollars alongside the return bridge; the
   pitched-narrative-vs-fundable-mark gap is usually the finding the client
   repeats. Reconcile every magnitude claim ("×", "%", "orders of
   magnitude") wherever it appears — three unreconciled magnitudes in one
   section is how a rival memo lost a point.

## Workflow
0. **Scope triage (before any research).** Fix: whose chair (which principal's
   capital), realistic check size and instrument (the six doors of a deck are
   not equal — pick the one actually being walked through), and counterparty
   scope (screening vs full). Ask which client the report is for.
1. **Kill-first triage gate.** Identify the 2–4 claims the entire thesis
   stands on and the cheapest checks that could kill each. Run those FIRST.
   A kill-check that is free or near-free (open registries, program
   parameter tables, price-cap lookups) is EXECUTED here, with its search
   protocol logged per doctrine §2 — only consented or paid checks may be
   deferred to the gap list. A verdict may not rest primarily on a check you
   declined to run. All later analysis is explicitly provisional on the
   gate: if the counterparty cannot be shown to exist, or the central demand
   mechanism is mischaracterized, the engagement can resolve here — do not
   build EV machinery on a vehicle that fails existence.
2. **Read & extract.** Read the deck end to end; register every quantified
   claim and every named entity/person/site/program as hypotheses to test.
3. **Verify externally** (web research, scaled to load-bearing claims):
   macro need, cited government programs (real name, actual throughput,
   caps, eligibility parameters per standard #6, who the money actually goes
   to), tax/legal regime, comparable BUILT projects, FX, cost-of-capital
   benchmarks, insurance availability & cost, political/anti-corruption
   backdrop. Maintain a disconfirmation budget: spend real effort trying to
   break the claims you most want to be true.
4. **Counterparty pass → INVOKE the counterparty-vetting skill**
   (`~/.claude/skills/counterparty-vetting/SKILL.md`) on the sponsor's
   principals and entities. Default scope = screening; escalate to full when
   the check is large, the counterparty is thin, or Roman asks. Its findings
   come back tagged per doctrine and slot into the memo as the counterparty
   section. Entity-level checks stay here: registration/UBO, prior projects
   (DELIVERED or only pitched?), registry status of claimed assets, anchor
   tenants, comparator projects (and whether the pitch is borrowing a real
   third party's credibility).
5. **Quantify the counter-case.** Pricing comps in the RIGHT geography,
   demand TAM/SAM/SOM, funding gap per buyer, unit economics incl.
   horizontal/site cost, like-for-like return bridge ending risk-adjusted,
   dollar valuation mark per standard #8.
6. **Decompose risk** into a scored heat map (demand, counterparty,
   political, execution, financial/FX, legal), flagging mitigable vs.
   terminal. FX / capital controls / repatriation is a mandatory row for any
   cross-border deal — a rival memo omitted the category entirely and it
   alone could consume the claimed return premium.
7. **Scenarios.** Bull/base/bear with anchored probabilities (market data,
   e.g. prediction markets, where available); breakeven probability per
   standard #5; steelmanned bull; sensitivity. Show the arithmetic.
8. **Rival-analysis cross-examination (when a second analysis of the same
   target exists — supplied, discovered, or commissioned).** Cross-examine,
   never average: recompute both documents' arithmetic from stated inputs;
   matrix the claims (agree / diverge / found-by-only-one); test
   independence per doctrine §1 BEFORE crediting convergence as
   corroboration (a shared sentence is a provenance alarm); treat the
   rival's unique falsifiable facts as free kill-checks and verify them
   directly; rate both documents as work product, separately from the
   verdict on the target.
9. **Diligence by leverage.** Rank remaining checks by value-of-information;
   cheapest, highest-leverage first; specify conditions precedent whose
   failure terminates the engagement.
10. **Structure & walk-away.** Secured, asset-level, escrowed,
    milestone-tranched; explicit walk-away triggers; enforceability caveat
    per standard #2.
11. **Verdict.** Per doctrine §5: conditional, option-framed, with the exact
    evidence that would change it and the downgraded alternative (e.g.
    platform equity → single ring-fenced insured site) named.

## Adversarial review loop (the multiplier)
Per doctrine §7, with this skill's full ladder for deep passes:
- Independent reviewer persona (senior PE/commercial-DD analyst, no prior
  context): rate 1–10, list improvements, opine. Fix everything with real
  research; re-rate.
- Deep pass: 3 mid-level analysts with distinct lenses (political-economy /
  quant-finance / deal-PE), independent reads, disagreements resolved on the
  evidence, consensus + rating. Reviewers must show genuine-independence
  markers (own sources, own arithmetic), not paraphrase the draft.
- **Internal-coherence pass (dedicated):** one reviewer hunts exclusively
  for (a) argument pairs that mutually undercut — e.g. "input inflation will
  crush margins" beside "the cost assumption already sits 35–58% above the
  official index" — and (b) magnitude/figure claims that disagree across
  sections. Each finding is resolved or reconciled in the text, not
  footnoted.
- Escalate to a manager persona (high-risk-investment specialist):
  option-pricing framing, enforceability cautions, rating-axis critique.
  Cross-examine manager vs first reviewer; reconcile to a final rating.
- Internal review docs use a distinct cooler "INTERNAL USE ONLY" treatment,
  NOT the client masthead; never reproduce any real third-party (e.g. Bain)
  brand.

## Output
House style and final QC per doctrine §8 — including the cross-reference,
repeated-figure, and recomputation checks (a phantom reference to a deleted
figure survived one clean-room read; it will not survive this one).
Lead with a one-page IC decision memo (metric strip: rating · risk ·
breakeven/EV · verdict). Confidentiality framing: names retained, marked
privileged & confidential, evidentiary-basis disclaimer so hard claims read
as sourced opinion, distribution restricted to the named client.

## Reusable assets
- Style scaffold: `rca_report_style.py` (+ rca_fonts/) — fonts cut via
  fonttools from the Cormorant variable font; tracked() uses a text object,
  not canvas.setCharSpace.
