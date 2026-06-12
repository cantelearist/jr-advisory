# James Roman Advisory Security Audit Handoff

Date: 2026-06-11
Site: https://www.jamesroman.la
Primary production-matching repo: `/Users/romancantelearist/Documents/Codex:ChatGPT Projects/james-roman-advisory`
Secondary Vercel-linked repo with separate changes: `/Users/romancantelearist/JR Design`

## Executive Summary

The live site still has security and operational issues until the patched production-matching source is deployed. No production deploy was performed.

Most important finding: there are multiple local James Roman codebases. `JR Design` is linked to the same Vercel project, but its current tree does not match the live route set. The production deployment inspected from Vercel matches the route structure in:

`/Users/romancantelearist/Documents/Codex:ChatGPT Projects/james-roman-advisory`

Use that repo as the handoff target unless the owner explicitly decides to reconcile all codebases first.

## Live Production Findings

Verified live production deployment:

- Vercel project name: `james-roman-advisory`
- Deployment URL: `james-roman-advisory-8ug1qn7sa-roman-2757s-projects.vercel.app`
- Deployment ID: `dpl_C8iV8PwXVoZMg9gtVpBXpUKjXaV4`
- Created: 2026-06-10 17:22:59 PDT
- Target: production
- Status: Ready

Live issues observed before patch:

- `https://www.jamesroman.la/portal` returns `500` with `x-vercel-error: MIDDLEWARE_INVOCATION_FAILED`.
- Homepage CSP includes `'unsafe-eval'`.
- Live response includes `access-control-allow-origin: *`.
- Sitemap advertises legal/support routes including `/terms`, `/disclaimer`, `/privacy`, `/cookies`, `/accessibility`, `/nda`, counsel pages, and engagement pages.
- Prior audit also flagged sitemap/redirect hygiene around `/terms` and `/disclaimer`; recheck after deploy.

Important: the fixes below were made locally. Production will remain in the old state until staged, verified, and deployed.

## Patched Codebase

Patched repo:

`/Users/romancantelearist/Documents/Codex:ChatGPT Projects/james-roman-advisory`

Current branch and tested app-code state:

- Branch: `security/audit-recovery-2026-06-11`
- Includes handoff/smoke-gate commit: `78e9e21a910d89f27962ac0a4715714cd06be905`
- Latest app-code commit smoke-tested here: `2adbfdd6ef24bc7d37a456ad76488e2e9837a2aa`
- A later documentation-only handoff refresh may advance the branch SHA; confirm current remote tip with `git ls-remote origin refs/heads/security/audit-recovery-2026-06-11`.
- Compare link: `https://github.com/cantelearist/jr-advisory/compare/main...security/audit-recovery-2026-06-11`

Primary files changed:

- `.env.example`
- `bun.lock`
- `next.config.ts`
- `package.json`
- `src/middleware.ts`
- `src/lib/security-headers.ts`
- `src/lib/internal-secret.ts`
- `scripts/preview-smoke-gate.mjs`
- `src/components/marketing/PageIntro.tsx`
- `src/components/marketing/PageShell.tsx`
- `src/__tests__/lib/security-headers.test.ts`
- `src/__tests__/lib/internal-secret.test.ts`
- `src/app/api/auth/create-test-users/route.ts`
- `src/app/api/auth/setup/route.ts`
- `src/app/api/fix-trigger/route.ts`
- `src/app/api/health/route.ts`
- `src/app/api/migrate/route.ts`
- `src/app/api/migrate/signatures/route.ts`
- `src/app/api/notifications/send/route.ts`
- `src/app/api/seed/route.ts`
- `src/app/api/seed/users/route.ts`
- `src/app/api/storage/setup/route.ts`
- `src/app/portal/admin/page.tsx`

There are also pre-existing untracked files in this repo, including `docs/`, several marketing pages, and at least one marketing component. Do not assume those are part of this patch without reviewing `git status`.

## Security Fixes Applied

### 1. CSP hardening

Created `src/lib/security-headers.ts` and moved security header generation out of inline `next.config.ts`.

Production CSP now:

- Removes `'unsafe-eval'`
- Keeps required sources for Supabase, Stripe, Vercel live tooling, Google Fonts, images, and websockets
- Adds `object-src 'none'`
- Keeps `frame-ancestors 'none'`
- Adds `upgrade-insecure-requests` in production

`next.config.ts` now also sets:

- `poweredByHeader: false`
- private surface headers for `/api`, `/portal`, `/auth`, and `/login`

### 2. Private route cache/index controls

Private surfaces now receive:

- `Cache-Control: no-store, max-age=0`
- `X-Robots-Tag: noindex, nofollow, noarchive`

This applies to API and portal/auth surfaces via Next headers and middleware responses.

### 3. Middleware fail-closed behavior

`src/middleware.ts` previously used non-null assertions for Supabase env vars and did not catch Supabase auth failures. That plausibly caused the live `MIDDLEWARE_INVOCATION_FAILED` on `/portal`.

Middleware now:

- Checks Supabase URL and anon key before creating the server client
- Returns controlled `503` when auth infrastructure is unavailable
- Adds private no-store/noindex headers to redirects and error responses
- Wraps Supabase auth work in `try/catch`
- Logs controlled server-side markers:
  - `middleware.supabase_not_configured`
  - `middleware.auth_failed`

Local smoke result after patch:

- `/portal` returned `503 Private office is temporarily unavailable.`
- Response included `X-Robots-Tag: noindex, nofollow, noarchive`
- Response included `Cache-Control: no-store, max-age=0`
- No raw Vercel middleware crash locally

### 4. Hardcoded internal key removal

Removed hardcoded internal keys from:

- `/api/health`
- `/api/notifications/send`
- `/api/fix-trigger`
- `/api/migrate`
- `/api/migrate/signatures`
- `/api/storage/setup`
- `/api/auth/create-test-users`
- `/api/auth/setup`
- `/api/seed`
- `/api/seed/users`

These now require env-configured secrets instead of public source-code defaults.

Added helper:

`src/lib/internal-secret.ts`

Added required env placeholders to `.env.example`:

- `HEALTHCHECK_SECRET`
- `NOTIFICATION_SECRET`
- `MIGRATION_SECRET`
- `SEED_SECRET`
- `SEED_USERS_SECRET`
- `SEED_USERS_DEFAULT_PASSWORD`
- `FIX_TRIGGER_SECRET`
- `STORAGE_SETUP_SECRET`
- `TEST_USERS_SETUP_SECRET`
- `AUTH_SETUP_SECRET`
- `AUTH_SETUP_ADMIN_PASSWORD`
- `AUTH_SETUP_CLIENT_PASSWORD`

Do not reuse old hardcoded values. Generate new random values per environment.

Environment scope matters:

- Production should receive only secrets needed for production behavior.
- Preview/staging may receive operational setup/seed/migration secrets when actively needed for smoke/setup work.
- Do not copy every operational secret into Production by reflex. Secret sprawl is not hardening.

Recommended Production env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HEALTHCHECK_SECRET`
- `NOTIFICATION_SECRET`

Recommended Preview/Staging-only operational env vars, unless explicitly approved for Production:

- `MIGRATION_SECRET`
- `SEED_SECRET`
- `SEED_USERS_SECRET`
- `SEED_USERS_DEFAULT_PASSWORD`
- `FIX_TRIGGER_SECRET`
- `STORAGE_SETUP_SECRET`
- `TEST_USERS_SETUP_SECRET`
- `AUTH_SETUP_SECRET`
- `AUTH_SETUP_ADMIN_PASSWORD`
- `AUTH_SETUP_CLIENT_PASSWORD`

### 5. Default setup password removal

Removed default setup passwords from auth/user setup paths:

- Former admin setup password removed from source.
- Former client setup password removed from source.
- Former seed-user default password removed from source and from API response.

Auth setup now requires:

- `AUTH_SETUP_ADMIN_PASSWORD`
- `AUTH_SETUP_CLIENT_PASSWORD`

Seed users now require:

- `SEED_USERS_DEFAULT_PASSWORD`

### 6. Admin UI hardcoded reset keys removed

`src/app/portal/admin/page.tsx` previously called:

- `/api/seed?key=...`
- `/api/auth/setup?key=...`

Those calls exposed old internal keys in browser code. The reset action now alerts that seed resets require trusted server-side tooling.

### 7. Dependency audit fix

Before patch, `npm audit --json` reported a PostCSS advisory through Next.

Patched:

- `next`: pinned to `15.5.19`
- `eslint-config-next`: pinned to `15.5.19`
- Added package override: `postcss: ^8.5.15`
- Refreshed both `package-lock.json` and `bun.lock`

Why both locks matter:

- Vercel build uses Bun because `vercel.json` contains `buildCommand: "bun run build"` and `bun.lock` exists.
- Local audit and verification used npm.

## Verification Evidence

All commands below were run from:

`/Users/romancantelearist/Documents/Codex:ChatGPT Projects/james-roman-advisory`

Important local caveat: this path contains a colon in `Codex:ChatGPT Projects`. `npm run ...` can fail to find binaries because npm adds `node_modules/.bin` to `PATH`, and the colon splits that path. Use direct binary paths for local verification.

Passed:

```sh
npm audit --json
```

Result: 0 vulnerabilities.

```sh
./node_modules/.bin/vitest run src/__tests__/lib/security-headers.test.ts src/__tests__/lib/internal-secret.test.ts
```

Result: 2 files passed, 5 tests passed.

```sh
./node_modules/.bin/tsc --noEmit
```

Result: passed.

```sh
./node_modules/.bin/eslint . --ignore-pattern '.next/**'
```

Result: 0 errors, 4 warnings.

Existing warnings:

- `src/app/layout.tsx`: custom font warning
- `src/components/portal/RichTextEditor.tsx`: missing hook dependency
- `src/components/portal/admin/MfaSetup.tsx`: missing hook dependency
- `src/components/portal/client/DocumentViewer.tsx`: unused eslint-disable directive

```sh
./node_modules/.bin/next build
```

Result: passed on Next `15.5.19`.

Build generated 69 app routes and middleware.

Local production smoke:

```sh
./node_modules/.bin/next start -p 3023
curl -sS -D - -o /tmp/jra-local-home.html http://localhost:3023/
curl -sS -D - -o /tmp/jra-local-portal.html http://localhost:3023/portal
curl -sS -D - -o /tmp/jra-local-health.html 'http://localhost:3023/api/health?key=jr-health-2026'
```

Observed:

- Homepage CSP did not contain `'unsafe-eval'`
- Homepage CSP contained `upgrade-insecure-requests`
- `/portal` returned controlled `503`
- `/portal` included `noindex/no-store`
- Old health key returned `401 Unauthorized`

The local smoke server was stopped after testing.

Automated preview smoke gate added:

```sh
HEALTHCHECK_SECRET=<preview-health-secret> node scripts/preview-smoke-gate.mjs <latest-jr-advisory-preview-url>
```

The script reports eight checks individually:

1. Homepage returns 200
2. Portal dashboard auth gate redirects or fails closed
3. Portal has private cache/index headers
4. Production CSP is hardened
5. Health secret reaches configured Supabase
6. Old and anonymous health access are rejected
7. CORS has no wildcard and explicit origins are allowlisted
8. Sitemap legal routes are not advertised as redirects

The CORS rule is deliberately narrow:

- `Access-Control-Allow-Origin: *` fails.
- A missing CORS header is acceptable unless a product requirement says otherwise.
- An explicit origin is acceptable only when it is in the trusted allowlist.
- Default allowlist: the checked preview origin, `https://www.jamesroman.la`, and `https://jamesroman.la`.
- To add trusted origins for a one-off run, set `CORS_ALLOWED_ORIGINS` as a comma-separated env var.

Any wildcard CORS result should be treated as P1 after deployment.

Latest observed preview deployment status before this final handoff refresh:

- `jr-advisory`: Ready preview at `https://jr-advisory-d414gyqut-roman-2757s-projects.vercel.app`
- `jr-advisory-test`: Ready preview at `https://jr-advisory-test-7k92lzk6o-roman-2757s-projects.vercel.app`, but direct smoke is blocked by Vercel protection/SSO `401`

Latest observed smoke result shape for an app-accessible `jr-advisory` preview, run without `HEALTHCHECK_SECRET` in the local runner:

```txt
PASS 1. Homepage returns 200 -- status=200
PASS 2. Portal dashboard auth gate redirects or fails closed -- status=307 location=/portal?redirect=%2Fportal%2Fdashboard
PASS 3. Portal has private cache/index headers -- cache-control=private, no-cache, no-store, max-age=0, must-revalidate x-robots-tag=noindex, nofollow, noarchive
PASS 4. Production CSP is hardened -- CSP present, no unsafe-eval, includes upgrade-insecure-requests
FAIL 5. Health secret reaches configured Supabase -- set HEALTHCHECK_SECRET before running this gate
PASS 6. Old and anonymous health access are rejected -- old-key=status=401 anonymous=status=401 cache-control=no-store, max-age=0
PASS 7. CORS has no wildcard and explicit origins are allowlisted -- allowed origins: https://jr-advisory-d414gyqut-roman-2757s-projects.vercel.app, https://www.jamesroman.la, https://jamesroman.la
PASS 8. Sitemap legal routes are not advertised as redirects -- sitemap status=200; /terms: not advertised; /disclaimer: not advertised
```

Interpretation: preview build/deploy is now healthy and CORS is no longer wildcard on the smoke-tested `jr-advisory` preview. Do not merge yet. Check 5 still needs a rerun with the preview `HEALTHCHECK_SECRET` after env vars are configured. Use the latest Ready `jr-advisory` preview URL from Vercel/GitHub status, because documentation-only pushes create fresh preview URLs. Production remains untouched.

## Verification Not Clean

Full unit suite is not clean:

```sh
./node_modules/.bin/vitest run
```

Result:

- 17 test files passed
- 9 test files failed
- 158 tests passed
- 46 tests failed

The failures are stale marketing/content expectations, not failures from the security patch. Examples:

- `Hero.test.tsx` expects old hero copy like `Respond. Protect. Restore.`
- `Nav.test.tsx` expects old `Private Inquiry` CTA
- `Founders.test.tsx` expects old founder content
- `Practice.test.tsx` expects old section copy
- `ClientOffice.test.tsx` expects old private office copy
- `SiteFooter.test.tsx` expects old footer structure
- `constants.test.ts` expects 6 nav items, current constants have 4

Recommendation: update or delete stale marketing-content tests before treating CI as healthy. Do not confuse those failures with the security patch.

## Current Live vs Local Status

Production live remains unpatched until deploy:

- Live `/portal` still needs recheck after deployment.
- Live CSP still needs recheck after deployment.
- Live CORS still needs recheck after deployment. `access-control-allow-origin: *` is a P1 post-deployment gate if it remains on production responses. An explicit trusted origin is acceptable; a wildcard or non-allowlisted origin is not.
- Live sitemap/route hygiene for `/terms` and `/disclaimer` should be rechecked after deployment.

Why CORS is P1 after deployment:

- Wildcard CORS is not automatically exploitable on a static public page.
- This site has private portal, admin, document, invoice, message, health, and setup/API surfaces.
- Wildcard CORS plus future authenticated APIs is latent security debt.
- If `Access-Control-Allow-Origin: *` remains after deploying the patched source, remove or scope it before calling production healthy.
- The current repo-level mitigation is `vercel.json`, which scopes the global header to `https://www.jamesroman.la`; that is acceptable only if the deployed response is not wildcard and the origin is intentionally trusted.

## Secondary Repo Warning: JR Design

There are also security changes in:

`/Users/romancantelearist/JR Design`

That repo is Vercel-linked to the same project but does not match the live route set. It currently has uncommitted changes from an earlier patch pass:

- `next.config.ts`
- `package-lock.json`
- `package.json`
- `src/lib/security.test.ts`
- `src/lib/security.ts`
- `src/proxy.ts`
- `src/proxy.security.test.ts`

Do not deploy from `JR Design` unless the source-of-truth decision is made intentionally. It builds a different app surface than the live production deployment inspected during this audit.

## Deployment Recommendation

Do not deploy directly to production.

Recommended sequence:

1. Decide source of truth.
   Use `/Users/romancantelearist/Documents/Codex:ChatGPT Projects/james-roman-advisory` unless deliberately reconciling repos first.

2. Configure Vercel environment variables.
   Production should receive the 3 Supabase variables plus `HEALTHCHECK_SECRET` and `NOTIFICATION_SECRET`. Put seed/migration/setup/test-user/fix/storage secrets in Preview/Staging only unless explicitly approved for Production.

3. Deploy to staging/preview first.

4. Verify staging/preview with the automated eight-check smoke gate:

   ```sh
   HEALTHCHECK_SECRET=<preview-health-secret> node scripts/preview-smoke-gate.mjs <latest-jr-advisory-preview-url>
   ```

   The smoke gate must report each check individually. Wildcard CORS on representative surfaces is a hard failure. Explicit CORS is acceptable only for trusted origins.

   Also verify sitemap/legal route hygiene before production, especially `/terms` and `/disclaimer`.

   Manual checks still required after the automated gate:
   - admin session still works
   - MFA still works for privileged accounts

5. Only after staging verification, request explicit owner approval for production.

6. Production deploy must be followed by alias checks for:
   - `https://jamesroman.la`
   - `https://www.jamesroman.la`

7. Re-run live verification:
   - `curl -sS -D - -o /tmp/live-home.html https://www.jamesroman.la/`
   - `curl -sS -D - -o /tmp/live-portal.html https://www.jamesroman.la/portal`
   - `curl -sS -D - -o /tmp/live-health.html https://www.jamesroman.la/api/health`
   - `curl -sS -X OPTIONS -D - -o /tmp/live-preflight.txt -H "Origin: https://evil.example" -H "Access-Control-Request-Method: GET" https://www.jamesroman.la/api/health`
   - `curl -sS https://www.jamesroman.la/sitemap.xml`
   - `npx --yes vercel@54.11.1 inspect https://www.jamesroman.la`

8. P1 post-deploy rule:
   If wildcard CORS remains on Production after the patched deployment, do not mark Production healthy. Treat it as P1 and remove or scope it before closeout.

## Open Risks / Follow-Up

1. Source control confusion
   Multiple local repos are linked or similar. Consolidate source of truth before future production work.

2. Full test suite stale
   Many marketing tests are outdated and should be updated or removed.

3. `access-control-allow-origin: *`
   P1 after deployment if it remains. It may be from the prior deployment output, Vercel config, CDN/platform behavior, or another source not visible in the current local grep. Private routes should emit no CORS headers unless there is a documented trusted-origin allowlist.

4. Sitemap/legal hygiene
   Confirm whether `/terms` and `/disclaimer` should be canonical pages, redirects, or removed from sitemap. Legally messy navigation is still messy even when the site is beautiful.

5. Health endpoint detail exposure
   The health endpoint still returns integration status to authorized callers. That is acceptable for an internal endpoint but should stay tightly gated.

6. Preview/staging secrets
   Preview environments often touch real integrations. Treat preview secrets as real secrets, not toys.

## Exact Handoff Command Checklist

From production-matching repo:

```sh
cd "/Users/romancantelearist/Documents/Codex:ChatGPT Projects/james-roman-advisory"

git status --short --branch
npm audit --json
./node_modules/.bin/vitest run src/__tests__/lib/security-headers.test.ts src/__tests__/lib/internal-secret.test.ts
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --ignore-pattern '.next/**'
./node_modules/.bin/next build
HEALTHCHECK_SECRET=<preview-health-secret> node scripts/preview-smoke-gate.mjs <latest-jr-advisory-preview-url>
```

Use direct binaries because the absolute path contains a colon.

## Bottom Line

The security patch is implemented and locally verified in the source tree that matches the live production deployment. Production is not fixed until this is deployed from the correct repo, with fresh internal secrets configured, and verified on staging first.
