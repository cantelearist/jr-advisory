# Source of Truth — James Roman Advisory
**Version:** 1.0  
**Date:** 2026-06-11  
**Author:** Claude (Infrastructure & Security)  
**Status:** Authoritative — supersedes any prior SOURCE_OF_TRUTH document

---

## Decision: Canonical Repository

**Canonical repository:** `https://github.com/cantelearist/jr-advisory.git`  
**Local path:** `/Users/romancantelearist/Documents/Codex:ChatGPT Projects/james-roman-advisory`

Do not deploy from any other local path. Do not deploy from `JR Design`. See the shadow repo section below.

---

## The Two Repos — What They Are and Why It Matters

There are two local directories linked to the same Vercel project. They are not the same codebase.

### Canonical: `james-roman-advisory`

| Property | Value |
|---|---|
| Local path | `/Users/romancantelearist/Documents/Codex:ChatGPT Projects/james-roman-advisory` |
| GitHub remote | `https://github.com/cantelearist/jr-advisory.git` |
| Auth stack | Supabase SSR (`@supabase/ssr`, `@supabase/supabase-js`) |
| Active branch | `main` |
| Latest commit | `e7616e6` — Merge security/priority-5-error-logging into main |
| Vercel project | `james-roman-advisory` |
| Vercel project ID | `prj_4DZx9UF5TR7cDCTMCklYtp4KX1hD` |
| Org ID | `team_ftaa0jTNxLRxCmbAJci8SgMY` |

This repo matches the live production deployment inspected by the 2026-06-11 security audit. All security hardening work (P1–P5) was performed here. All future work must come from here.

### Shadow: `JR Design`

| Property | Value |
|---|---|
| Local path | `/Users/romancantelearist/JR Design` |
| GitHub remote | `https://cantelearist@github.com/cantelearist/james-roman-advisory.git` |
| Auth stack | Clerk + Neon (older architecture — different route set) |
| Active branch | `security/priority-3-session-audit` |
| Latest commit | `b971c37` — security(p3): fix auth inconsistency, broken download, MFA URL |
| Vercel project | `james-roman-advisory` (same project ID — this is the danger) |

`JR Design` is linked to the same Vercel project via an identical `.vercel/project.json`. If someone runs `vercel --prod` from that directory, it deploys a Clerk-based app over the Supabase-based live site. The route sets are incompatible. The auth systems are incompatible.

**JR Design must not be deployed.** It is preserved for reference only. If the decision is ever made to retire or reconcile it, that is a deliberate owner-approved action, not an accident.

---

## Canonical Branch

**Production branch:** `main`  
**All production deploys must originate from `main`.**

### Known branches in canonical repo

| Branch | Purpose | Status |
|---|---|---|
| `main` | Production source | Active — canonical |
| `security/priority-5-error-logging` | P5 work | Merged to main |
| `feat/advisory-ux-improvements` | UX work | On hold |
| `fix/production-auth-alignment` | Auth fix | Superseded by main |
| `archive/prototype-live-2026-06-03` | Prototype snapshot | Archived — frozen |
| `staging-secure-office-foundation` | Staging work | Active (staging deploys) |

Branches prefixed `archive/` are frozen — do not modify or deploy from them.

---

## Canonical Vercel Project

| Property | Value |
|---|---|
| Project name | `james-roman-advisory` |
| Project ID | `prj_4DZx9UF5TR7cDCTMCklYtp4KX1hD` |
| Org ID | `team_ftaa0jTNxLRxCmbAJci8SgMY` |
| Production URL | `https://jamesroman.la` and `https://www.jamesroman.la` |
| Build command | `bun run build` (set in `vercel.json`) |
| Framework | Next.js 15 (App Router) |

Both aliases must be verified after every production deploy:
```sh
npx vercel alias ls | grep jamesroman.la
```

If either alias is missing, re-apply:
```sh
npx vercel alias set <deployment-url> jamesroman.la
npx vercel alias set <deployment-url> www.jamesroman.la
```

---

## Canonical Supabase Project

The Supabase project reference is not stored in source control (by design — env vars only). It is found in the Vercel dashboard under the `james-roman-advisory` project → Settings → Environment Variables.

Three required variables (all three must be present before any API route or portal page will function):

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → service_role |

**Current production status as of 2026-06-11:** All three variables are absent from Vercel production. All API routes return `503 Supabase not configured`. Production is not live for authenticated use until these are added and production is redeployed.

---

## Canonical Environment Variables

### Required for all environments

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Required internal operation secrets (security audit 2026-06-11)

Generate new random values per environment. Never reuse old hardcoded values. Never commit actual values — Vercel dashboard only.

```
HEALTHCHECK_SECRET
NOTIFICATION_SECRET
MIGRATION_SECRET
SEED_SECRET
SEED_USERS_SECRET
SEED_USERS_DEFAULT_PASSWORD
FIX_TRIGGER_SECRET
STORAGE_SETUP_SECRET
TEST_USERS_SETUP_SECRET
AUTH_SETUP_SECRET
AUTH_SETUP_ADMIN_PASSWORD
AUTH_SETUP_CLIENT_PASSWORD
```

Full reference in `.env.example` at repo root.

---

## Canonical Deployment Flow

```
1. Work on feature/fix branch from canonical repo (jr-advisory)
2. Build locally:
   ./node_modules/.bin/next build
   (use direct binary — path contains a colon, npm PATH splitting causes failures)
3. Run security tests:
   ./node_modules/.bin/vitest run src/__tests__/lib/
4. Merge branch to main via PR
5. Deploy preview from main:
   npx vercel
6. Verify preview URL before promoting
7. Deploy to production:
   npx vercel --prod
8. Re-alias both domains (required after every production deploy):
   npx vercel alias set <deployment-url> jamesroman.la
   npx vercel alias set <deployment-url> www.jamesroman.la
9. Run eight-point post-deploy smoke gate
```

### Eight-point post-deploy smoke gate

All eight must pass before Client #1 is cleared:

| # | Check | Expected |
|---|---|---|
| 1 | `GET /` | 200, CSP contains no `unsafe-eval` |
| 2 | `GET /portal/dashboard` (unauthenticated) | Redirect to `/portal` login — not 500, not 503 |
| 3 | `GET /api/documents` (unauthenticated) | 401 — not 503 |
| 4 | `GET /api/documents` (authenticated non-admin) | 403 on admin-only routes |
| 5 | `GET /api/health?key=$HEALTHCHECK_SECRET` | 200, `supabase: true` |
| 6 | P5 error handling | Triggered 500 returns generic message + requestId, no stack trace |
| 7 | `GET /api/health?key=jr-health-2026` (old hardcoded key) | 401 |
| 8 | Both aliases resolve | `curl https://jamesroman.la/` and `https://www.jamesroman.la/` → 200 |

---

## What Is Frozen — Do Not Touch

| Area | Location | Reason |
|---|---|---|
| WIP marketing pages | `src/app/advisory-vs-remediation/`, `src/app/engagements/`, `src/app/insights/`, `src/app/intake/`, `src/app/process/`, `src/app/services/`, `src/app/wildfire-recovery/` | Gemini track |
| Prototype2 snapshot | `archive/prototype-live-2026-06-03` branch | Frozen reference |
| Founder images / Private Office Visuals | Public assets | Gemini track |
| JR Design repo | `/Users/romancantelearist/JR Design` | Shadow repo — read-only reference only |

---

## Outstanding Blockers (as of 2026-06-11)

1. **Supabase env vars missing from Vercel production** — requires owner action in Vercel dashboard. Claude cannot add these.  
2. **Security audit patches uncommitted** — 16 modified files + 6 new untracked files in the working tree of the canonical repo. Must be committed to a security branch and merged to `main` before staging deploy.  
3. **Stale test suite** — 46 tests failing due to outdated marketing copy expectations. Does not affect security tests. Must be resolved before CI is treated as fully healthy.

---

## Agent Ownership

| Domain | Agent |
|---|---|
| Repository, deployment, security hardening, infrastructure docs | Claude |
| Marketing pages, visual design, brand assets | Gemini |

No cross-contamination. Each agent touches only its assigned domain. Both tracks must complete before `MATTER_LIFECYCLE.md`, `SECURITY_MODEL.md`, and `ARCHITECTURE.md` are updated.
