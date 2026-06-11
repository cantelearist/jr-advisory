# Staging Security Validation Report
**Date:** 2026-06-11  
**Branch:** `security/audit-recovery-2026-06-11`  
**Preview URL:** `https://james-roman-advisory-e8n0a45mn-roman-2757s-projects.vercel.app`  
**Vercel Inspect:** `https://vercel.com/roman-2757s-projects/james-roman-advisory/8LAB73DWp4ApeisiyQ9kuyEhQnRM`  
**Build:** Passed — 69 app routes, middleware compiled  
**Author:** Claude (Infrastructure & Security)

---

## Summary

The security audit patches (CSP hardening, middleware fail-closed, internal secret gates) are verified on the staging preview. **The patches work as intended.** The portal returning 503 instead of crashing is the correct behavior — it means the middleware fix is working. Full smoke gate cannot complete until Supabase env vars are added to this environment.

---

## Build Verification

```
✅  next build passed on Next 15.5.19
✅  69 app routes compiled
✅  Middleware compiled (90.1 kB)
✅  vitest: security-headers.test.ts — 3 tests passed
✅  vitest: internal-secret.test.ts — 2 tests passed
✅  npm audit — 0 vulnerabilities
```

---

## Smoke Results

### 1. Homepage — CSP without unsafe-eval

```
curl -sS -D - -o /dev/null https://james-roman-advisory-e8n0a45mn-roman-2757s-projects.vercel.app/
```

| Check | Result |
|---|---|
| HTTP status | **200** ✅ |
| `unsafe-eval` absent from CSP | **PASS** ✅ |
| `upgrade-insecure-requests` present | **PASS** ✅ |
| `object-src 'none'` present | **PASS** ✅ |
| `frame-ancestors 'none'` present | **PASS** ✅ |
| `X-Frame-Options: DENY` | **PASS** ✅ |
| `X-Content-Type-Options: nosniff` | **PASS** ✅ |
| `Strict-Transport-Security` present | **PASS** ✅ |
| `X-Powered-By` absent | **PASS** ✅ |

Full CSP observed:
```
default-src 'self'; 
script-src 'self' 'unsafe-inline' https://js.stripe.com https://vercel.live; 
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
font-src 'self' https://fonts.gstatic.com data:; 
img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com; 
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://vercel.live; 
frame-src 'self' https://js.stripe.com https://hooks.stripe.com; 
object-src 'none'; base-uri 'self'; form-action 'self'; 
frame-ancestors 'none'; upgrade-insecure-requests
```

---

### 2. Middleware Fail-Closed — /portal

```
curl -sS -D - -o /dev/null https://.../portal
```

| Check | Result | Notes |
|---|---|---|
| HTTP status | **503** ✅ | Controlled response, not crash |
| Response body | "Private office is temporarily unavailable." | Not a raw stack trace |
| `Cache-Control: no-store, max-age=0` | **PASS** ✅ |
| `X-Robots-Tag: noindex, nofollow, noarchive` | **PASS** ✅ |
| `Content-Security-Policy` present | **PASS** ✅ |
| `X-Frame-Options: DENY` | **PASS** ✅ |

**This 503 is correct behavior.** Before the patch, `/portal` returned `MIDDLEWARE_INVOCATION_FAILED` — a raw Vercel crash with no security headers and an opaque error. After the patch, it returns a controlled 503 with all private surface headers applied, and a human-readable message that exposes nothing internal.

The 503 persists because `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set in this preview environment. Once they are set and the preview is redeployed, `/portal` will show the login page (200) and `/portal/dashboard` will redirect unauthenticated users to login.

---

### 3. /portal/dashboard Unauthenticated

```
curl -sS -D - -o /dev/null https://.../portal/dashboard
```

| Check | Result | Notes |
|---|---|---|
| HTTP status | **503** | Expected redirect once env vars set |
| `X-Robots-Tag: noindex, nofollow, noarchive` | **PASS** ✅ | Private surface headers working |

Same root cause as #2 — Supabase env vars missing. With env vars set: middleware would redirect unauthenticated users to `/portal` (login page). This redirect path is unit-tested in the middleware and has been verified locally.

---

### 4. Old Hardcoded Health Key Rejected

```
curl -sS -w "\nHTTP %{http_code}" https://.../api/health?key=jr-health-2026
```

| Check | Result |
|---|---|
| HTTP status | **401** ✅ |
| Response | `{"error":"Unauthorized"}` ✅ |

The old hardcoded value `jr-health-2026` no longer grants access. The route now requires `HEALTHCHECK_SECRET` env var. Since that var isn't set in this preview, even a correct env-based key would return 401 — which is the right behavior for a misconfigured environment.

---

### 5. CORS Headers

See `CORS_AUDIT.md` for full analysis. Summary:

| Surface | `access-control-allow-origin` |
|---|---|
| `/` (static prerendered) | `*` — Vercel CDN behavior, not app code |
| `/_next/static/*` | `*` — Vercel CDN behavior |
| `/sitemap.xml` | `*` — Vercel CDN behavior |
| `/portal` | None ✅ |
| `/api/health` | None ✅ |

The wildcard is injected by Vercel's edge CDN for prerendered public pages. No sensitive data is exposed. API routes and portal routes are clean.

---

## What Requires Env Vars Before It Can Be Verified

These checks cannot pass until Supabase env vars are added to this environment and redeployed:

| Check | Gate |
|---|---|
| `/portal` returns login page (200) | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `/portal/dashboard` redirects to login | Same |
| `/api/*` returns 401 (not 503) | All three Supabase vars |
| `/api/health?key=$HEALTHCHECK_SECRET` returns 200 | `HEALTHCHECK_SECRET` + Supabase vars |
| Admin session works | All env vars |
| MFA enforcement functional | All env vars |

---

## Checks Passed Without Env Vars (Static/Middleware-Level)

| # | Check | Status |
|---|---|---|
| 1 | Build passes | ✅ |
| 2 | CSP: no `unsafe-eval` in production | ✅ |
| 3 | CSP: `upgrade-insecure-requests` present | ✅ |
| 4 | CSP: `object-src 'none'` | ✅ |
| 5 | `X-Frame-Options: DENY` | ✅ |
| 6 | `X-Content-Type-Options: nosniff` | ✅ |
| 7 | `Strict-Transport-Security` | ✅ |
| 8 | `poweredByHeader: false` | ✅ |
| 9 | Middleware fail-closed (503 not crash) | ✅ |
| 10 | Private surface headers on 503 responses | ✅ |
| 11 | Old hardcoded health key rejected (401) | ✅ |
| 12 | CORS wildcard absent from portal + API routes | ✅ |

---

## Merge and Production Deploy Recommendation

The security patch branch is ready to merge to `main` after owner review. The patches are self-contained and do not affect the public-facing visual experience.

**Before merging:**
- [ ] Owner reviews this validation report
- [ ] No new failing tests introduced (security-specific tests: 5/5 pass)

**Before production deploy:**
- [ ] Supabase env vars added to Vercel production
- [ ] All new internal secrets generated and added to Vercel production:
  `HEALTHCHECK_SECRET`, `NOTIFICATION_SECRET`, `MIGRATION_SECRET`, `SEED_SECRET`,
  `SEED_USERS_SECRET`, `SEED_USERS_DEFAULT_PASSWORD`, `FIX_TRIGGER_SECRET`,
  `STORAGE_SETUP_SECRET`, `TEST_USERS_SETUP_SECRET`, `AUTH_SETUP_SECRET`,
  `AUTH_SETUP_ADMIN_PASSWORD`, `AUTH_SETUP_CLIENT_PASSWORD`
- [ ] Production deploy: `npx vercel --prod`
- [ ] Re-alias: `jamesroman.la` and `www.jamesroman.la`
- [ ] Run eight-point smoke gate (see `docs/operations/source-of-truth.md`)
