# Release Log — James Roman Advisory

---

## Release: Visual Baseline Restoration

**Date:** 2026-06-12  
**PR:** #15  
**Branch merged:** `recovery/visual-baseline-to-main`  
**Merge commit SHA:** `c8df46a`  
**Restored visual commit SHA:** `d980a20` (cherry-picked from `a75897f`)  
**Final deployment ID:** `jr-advisory-azqc5wuoi`  
**Approved by:** Roman Cantelearist  
**Gate result:** ✅ Production visual smoke passed

### Scope

- Restored public homepage visual baseline from the reference deployment
- Limited change surface to global visual styling and marketing homepage components
- No API, Supabase, middleware, security, or deployment configuration files touched
- Production deployment triggered by merge to `main`

### Changed Files

- `src/app/globals.css`
- `src/components/marketing/ClientOffice.tsx`
- `src/components/marketing/Contact.tsx`
- `src/components/marketing/Cornerstone.tsx`
- `src/components/marketing/Founders.tsx`
- `src/components/marketing/Hero.tsx`
- `src/components/marketing/Practice.tsx`

### Production Visual Smoke

| Check | Result |
|---|---|
| Desktop render at 1440x1200 | ✅ PASS |
| Mobile render at 390x844 | ✅ PASS |
| Mobile after cookie accept | ✅ PASS |
| No horizontal mobile overflow | ✅ PASS |
| Hero title and advisory copy visible | ✅ PASS |
| Next assets present | ✅ PASS |
| Founders image direct asset and lazy-load behavior | ✅ PASS |

### Domain Verification

| Domain | Status | HTTP |
|---|---|---|
| `https://www.jamesroman.la` | ✅ Verified | 200 |
| `https://jamesroman.la` | ✅ Verified | 200 |
| `http://www.jamesroman.la` | ✅ HTTPS upgrade | 308 |
| `http://jamesroman.la` | ✅ HTTPS upgrade | 308 |

### Apex Note

`https://jamesroman.la` currently serves `200` instead of redirecting to `https://www.jamesroman.la`. This is not urgent because both canonical and Open Graph metadata point to `https://www.jamesroman.la`, but a later P2 tidy-up should add an apex-to-www `308` redirect.

### Freeze State

Security recovery and visual restoration are complete. Production is live. Freeze restored.

---

## Release: Security Audit Recovery

**Date:** 2026-06-11  
**PR:** #14  
**Branch merged:** `security/audit-recovery-2026-06-11`  
**Merge commit SHA:** `0062939`  
**Hotfix commit SHA:** `79f754a` (sitemap legal-route exclusion)  
**Final deployment ID:** `jr-advisory-hetdjq2vg`  
**Deployed by:** Claude (Infrastructure & Security)  
**Approved by:** Roman Cantelearist  
**Gate result:** ✅ 8/8 passed

### Scope

- CSP hardening — `unsafe-eval` removed from production
- Middleware fail-closed — 503 instead of crash when Supabase env vars absent
- Internal secret migration — 12 hardcoded keys replaced with env-gated secrets; `HEALTHCHECK_SECRET` rotated (old `jr-health-2026` invalidated)
- CORS wildcard suppressed — explicit `Access-Control-Allow-Origin: https://www.jamesroman.la` in `vercel.json`
- Source-of-truth documentation — canonical repo decision; JR Design retired as deploy source
- Sitemap hotfix — redirect-only legal routes removed from `sitemap.xml`

### Domain Verification

| Domain | Status | HTTP |
|---|---|---|
| `https://jamesroman.la` | ✅ Verified | 200 |
| `https://www.jamesroman.la` | ✅ Verified | 200 |

### Eight-Point Smoke Gate Results

| # | Check | Result |
|---|---|---|
| 1 | `GET /` — 200, no `unsafe-eval` in CSP | ✅ PASS |
| 2 | `GET /portal/dashboard` unauthenticated — redirect to `/portal` | ✅ PASS |
| 3 | `GET /api/documents` unauthenticated — 401/403/503 | ✅ PASS |
| 4 | Portal — `no-store`, `noindex`, no `MIDDLEWARE_INVOCATION_FAILED` | ✅ PASS |
| 5 | `GET /api/health?key=$HEALTHCHECK_SECRET` — 200, `supabase: true` | ✅ PASS |
| 6 | `GET /api/health?key=jr-health-2026` (old hardcoded key) — 401 | ✅ PASS |
| 7 | No wildcard `*` `Access-Control-Allow-Origin` on any surface | ✅ PASS |
| 8 | Sitemap 200, legal routes clean | ✅ PASS |

### Rollback Target

If rollback is required:

```sh
npx vercel rollback dpl_C8iV8PwXVoZMg9gtVpBXpUKjXaV4
npx vercel alias set <rollback-url> jamesroman.la
npx vercel alias set <rollback-url> www.jamesroman.la
```

Prior production deployment: `dpl_C8iV8PwXVoZMg9gtVpBXpUKjXaV4` (2026-06-10 17:22 PDT)

### Notes

- Unrelated untracked local files left untouched during deployment
- JR Design repo remains live but must NOT be deployed — see `docs/operations/source-of-truth.md`
- macOS TCC permission drop during session caused Desktop Commander EPERM on `Documents/`; all substantive work was committed to GitHub before the drop; no data lost
- CORS wildcard on `/` confirmed as Vercel CDN platform behavior (`x-nextjs-prerender: 1`, `x-vercel-cache: HIT`), not application code; suppressed via `vercel.json`

---

## Release: P1–P5 Security Hardening (Completed)

**Date:** 2026-06-11  
**Branch merged:** `security/priority-5-error-logging`  
**Commit SHA:** `e7616e6`  
**Status:** ✅ Deployed to production

### Scope

- P1: Auth + role matrix audit
- P2: MFA enforcement, rate limiting, audit logging
- P3: Session + token security hardening
- P4: Input validation + XSS hardening
- P5: Error handling — correlation IDs, redacted responses, `internalError()` helper

---
