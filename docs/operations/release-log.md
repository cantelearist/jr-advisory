# Release Log — James Roman Advisory

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
