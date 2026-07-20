---
name: counterparty-vetting
description: >
  Use this skill when Roman asks to vet, check, investigate, or run due
  diligence on a PERSON or their closely-held entities — a prospective
  co-investor, business partner, sponsor principal, vendor principal, buyer,
  or tenant. Triggers: "vet this co-investor", "background on", "check this
  guy out", "who is X really", "is X legit / connected / a criminal",
  "run OSINT on", "counterparty check" where the counterparty is an
  individual, or any request anchored to a person + property/entity.
  ALSO invoked as a subroutine by the pitch-deck-analysis skill at its
  Stage 4 (counterparty pass) — run in "screening" scope unless stakes
  warrant "full" scope. Produces a tagged, identity-disambiguated vetting
  memorandum in RCA house style with a risk-status verdict. Do NOT use for
  assessing a DEAL or deck on its merits (that is pitch-deck-analysis), and
  do NOT use to produce anything resembling an FCRA consumer report.
---

# Counterparty Vetting — Person-Level Due Diligence

## Doctrine (mandatory)
Load and apply the `rca-evidence-doctrine` skill before anything else —
its `rca-evidence-doctrine/SKILL.md` sits in the SAME skills root this
skill was loaded from (a project's `.claude/skills/` or the user-level
`~/.claude/skills/`). Tagging, absence rule, identity discipline, cross-check,
verdict grammar, gap mapping, adversarial review, and delivery standard all
come from the doctrine core and are not restated here. Doctrine §2's
search-protocol rule bears hardest on this skill: every NOT FOUND names the
databases queried and the name variants searched, including native-script
and transliteration forms.

## Legal boundary (set in the first response, every time)
- This is OSINT / public records, NOT an FCRA consumer report or credit
  check. Never fabricate a credit score or consumer-credit data.
- The authoritative credit / criminal / identity answers require the
  subject's WRITTEN CONSENT (credit pull, DOJ live-scan, county criminal
  index by name + DOB). Name these as the consented path.
- An arrest without conviction is weak signal; in California, sealed or
  dismissed arrests cannot lawfully be used to deny a business opportunity.
- Naming a private individual: findings are sourced facts or clearly-framed
  opinion ("based on open-source research as of [date], could not be
  verified"). Nothing asserts wrongdoing. Forum/social content never enters
  the memo as fact. This is what keeps the memo from becoming defamation.
- Never search images/social to identify a person by face.

## Scope modes
- **screening** (default as a deck-analysis subroutine): Rings 1, 4, 5, 8 —
  anchor identity, sweep litigation/entities/licenses, sanctions screen,
  media check. Output = a tagged subsection, not a standalone memo.
- **full** (default standalone, or on request / high stakes): all rings.

## The algorithm — concentric rings, outward from the hardest identifier
0. **Scope & boundary.** Fix the decision the vetting supports (admit a
   co-investor? sign a partner?), the subject's known identifiers, the
   client's specific red flag (log it as the priority question), and the
   legal boundary above. Ask which client the report is for.
1. **Identity anchor.** Build from the hardest-to-fake identifier (deeded
   property > entity registration > mailing address > name). Raise identity
   confidence only on independent corroboration.
2. **Property & ownership.** Assessor/recorder + aggregators: owner of
   record, vesting (trust/LLC), acquisition history, liens/NODs/lis pendens,
   actual use. Recognize self-to-self trust transfers as routine. A
   conflicting aggregator date is a lead to RESOLVE against the authoritative
   roll, never "aggregator error" to wave off: a Prop-13 base year is an
   assessor-declared change-of-ownership event — if it disagrees with the
   claimed acquisition date, something happened on that date (re-acquisition,
   interspousal/partial-interest transfer, correction) and it bears on the
   community-property timeline. Homeowner's-exemption status is a free
   residence-vs-rental cross-check: no exemption + listed-for-rent means
   aggregator "co-resident" data is likely stale, and the subject's actual
   residence is then unestablished (a Ring 1 gap, not a closed fact).
   County assessor parcel APIs are usually reachable without a portal form —
   run them.
3. **Permits & code enforcement.** Test the client's red flag against the
   permit record. LADBS PCIS/CEIS and ZIMAS are session-bound — if
   unreachable, say so and route to the gap list (direct pull + licensed
   inspection). Cross-check any work found against CSLB/DRE licensing.
4. **The individual.** Civil litigation both directions, judgments/abstracts,
   bankruptcy, business entities + good standing (bizfile), DBA filings,
   professional licenses. Read case DISPOSITIONS, do not just log case
   existence: a Disposed-Dismissed dissolution petition typically means the
   marriage did NOT end — the opposite of "been through a dissolution," and
   it enlarges rather than closes community-property exposure. An
   address- or asset-named entity ("4120 Broadway Center LLC") names its own
   asset: run the free assessor lookup on that address before flagging the
   entity as opaque — it often converts a "no verifiable business location"
   red flag into a located, tax-current holding.
5. **Sanctions & enforcement.** OFAC/SDN, SEC, FINRA. The OFAC screen is
   free and runnable NOW, not a gap-list item: download SDN + consolidated +
   alias files from sanctionslistservice.ofac.treas.gov, integrity-check
   against a known-listed name, then grep the subject AND every name variant
   (§2 protocol) AND circle surnames. Log the list's publication date. That
   converts "no match found" into a dated, protocol-backed NOT FOUND; the
   consented live-scan still upgrades criminal, but OFAC needs no consent.
6. **Criminal & arrest.** Court criminal indices + news. State that
   open-source criminal data is thin; nothing found = weak evidence. The
   definitive answer is the consented path (live-scan + county index by
   name AND DOB — DOB is usually the missing key).
7. **Network & entanglement.** Map spouse (community-property reach over
   contributed funds and pledged assets — CA), LLC co-members, former
   associates whose litigation could reach the subject's assets. Scope to
   asset-reach, not curiosity.
8. **Media & social.** Press first; social/forums strictly as UNVERIFIED
   leads. A low public profile is a neutral data point.
9. **Cross-check & contradiction.** Per doctrine §4.
10. **Connection-testing** (when a specific adverse nexus is alleged —
    fraud ring, organized crime, named case): pull the PRIMARY source
    (indictment/press release), extract the full roster of names, aliases,
    addresses, entities, and victim geography, then cross-reference on four
    hard axes: shared surname; shared address/entity/property; co-occurrence
    anywhere on the record; victim/asset overlap. Dismiss false signals
    (name-root cognates, shared ethnicity) explicitly and in writing. Keep
    the honest caveat (open suspects, sealed schedules). "Dig deep" = rigor
    in verification, never a lower bar for what counts as a link.
11. **Gap mapping.** Standard gap set: permit/title pulls + inspection;
    recorder title search; bizfile entity standing; consented credit +
    background check; bank references + documented SOURCE OF FUNDS
    (AML/KYC); direct CSLB/DRE + OFAC screens. The consent + proof-of-funds
    request is the instrument that unlocks the cluster — frame it as routine
    onboarding for any co-investor at this level; resistance is data.
12. **Verdict.** Conditional vetting per doctrine §5, plus the behavioural
    test stated plainly.

## Deliverable — RCA DD report standard (all co-investor vetting reports)
House style per doctrine §8, PLUS:
- (a) Risk status badge on cover AND running header: NOT CLEARED / YELLOW /
  CLEARED.
- (b) Source-of-funds as a PRIMARY conclusion, not a footnote.
- (c) Open-source-silence caveat as a visible alert box.
- (d) A cross-examination questions section (the questions to put to the
  subject; refusal or vagueness on material questions IS the finding).
- (e) Deal posture with explicit go/no-go criteria.
Structure: scope & boundary → identity confidence → anchored asset →
individual record (tagged exhibit) → associated names & namesake quarantine →
criminal/sanctions (+ any connection-test exhibit) → risk register ranked →
gaps → conditional-vetting recommendation with ring-fencing terms.

## Banked lessons (person-level — add new ones here)
- The client's own tip (e.g. a street name) independently resurfacing in
  records is a strong identity corroborator — log it as such.
- A six-figure judgment against a namesake is the exact trap this skill
  exists to avoid: quarantine by name, check for shared entities/property
  before letting ANY record attach.
- Namesake discipline is SYMMETRIC: the rigor spent keeping a scary record
  OFF the file must equal the rigor spent attaching an ordinary one ON it.
  A DCSS or dissolution case matched on name alone, in a county with
  multiple same-surname individuals, needs its own per-attribution identity
  confidence — attaching it loosely is the same error as clearing loosely.
- An address-/asset-named LLC hands you its asset: run the free assessor
  lookup on the embedded address before calling the entity opaque. (Khobian:
  "4120 Broadway Center LLC" → a real, tax-current 4120 S Broadway parcel,
  which largely answers the "UPS-mailbox, where does he operate?" flag.)
- Never dismiss a date discrepancy as "aggregator error" without the roll:
  a Prop-13 base year is an authoritative ownership-event date. (Khobian:
  the "stray 1995 figure" the prior report waved off was corroborated by the
  county's own 1995 base year — and it moves the community-property clock.)
- Read the disposition, not just the caption: Disposed-Dismissed on a
  dissolution petition usually means still-married — which ENLARGES
  community-property exposure, the opposite of what "went through a
  dissolution" implies.
- Community property: a spouse may hold an interest in "his" contribution;
  require spousal consent/quitclaim where a community asset is pledged.
- Sensitive personal matters (dissolution, child support) are reported at
  the minimum necessary for asset analysis — no detail, no speculation.
