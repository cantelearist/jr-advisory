# CORS Audit — access-control-allow-origin: *
**Date:** 2026-06-11  
**Auditor:** Claude (Infrastructure & Security)  
**Triggered by:** Live site finding in `JAMES_ROMAN_SECURITY_AUDIT_HANDOFF_2026-06-11.md`  
**Status:** Root cause identified. Risk: low. Fix: optional hygiene.

---

## Finding

The live site and the staging preview both return `access-control-allow-origin: *` on some responses. The security audit identified this on the live production site and flagged it for investigation.

---

## Investigation

### What has the wildcard

```sh
# Preview: https://james-roman-advisory-e8n0a45mn-roman-2757s-projects.vercel.app
curl -sS -D - -o /dev/null $PREVIEW/             | grep access-control  → access-control-allow-origin: *
curl -sS -D - -o /dev/null $PREVIEW/sitemap.xml  | grep access-control  → access-control-allow-origin: *
curl -sS -D - -o /dev/null $PREVIEW/_next/static/css/*.css  | grep access-control  → access-control-allow-origin: *
```

### What does NOT have the wildcard

```sh
curl -sS -D - -o /dev/null $PREVIEW/portal        | grep access-control  → (empty)
curl -sS -D - -o /dev/null $PREVIEW/api/health    | grep access-control  → (empty)
```

### Pattern

The `*` appears exclusively on:
- Statically prerendered pages (`x-nextjs-prerender: 1` in response headers)
- Vercel CDN cached responses (`x-vercel-cache: HIT`)
- Static assets (`/_next/static/*`)

It is absent on:
- Middleware-handled routes (`/portal`, `/portal/*`)
- Server-rendered API routes (`/api/*`)

### Source

This header is not set anywhere in the application code.

Confirmed by grep across the entire codebase:
```sh
grep -rn "access-control-allow-origin\|CORS\|cors" src/ next.config.ts vercel.json
# Result: zero matches
```

**Root cause: Vercel's edge CDN automatically adds `access-control-allow-origin: *` to statically served content.** This is undocumented default behavior by the Vercel platform for prerendered static output and static assets. It is not controllable through `next.config.ts` `headers()` for CDN-cached responses — the app-level headers are applied at the origin, but Vercel's edge may override or supplement them for cached static content.

The security audit's "local smoke did not show the wildcard header" finding is consistent with this: running the app locally via `next start` doesn't go through Vercel's CDN, so the header doesn't appear.

---

## Risk Assessment

### Who gets the wildcard

| Surface | Has wildcard | Contains sensitive data |
|---|---|---|
| Public homepage (`/`) | Yes | No — public marketing content |
| Sitemap | Yes | No — route list only |
| Static CSS/JS bundles | Yes | No — client-side code, no credentials |
| Portal login (`/portal`) | **No** | N/A — middleware-served |
| All `/portal/*` pages | **No** | N/A — middleware-served |
| All `/api/*` routes | **No** | API routes are server-rendered |

### What the wildcard allows

`access-control-allow-origin: *` on a resource permits any website to fetch that resource via `XMLHttpRequest` or `fetch()` from the browser. For this site:

- A cross-origin request to `/` would return the homepage HTML — the same information anyone can get by visiting the URL.
- A cross-origin request to `/sitemap.xml` would return a list of routes — equally public.
- A cross-origin request to `/api/health` without auth would return `{"error":"Unauthorized"}` — the wildcard is absent here anyway.

The wildcard does NOT allow third-party sites to read authenticated responses or anything from `/portal` or `/api/*`. Cookie-based auth (which Supabase SSR uses) is not sent cross-origin by default (`SameSite=Lax`), and even if the request were made, it would return 401 or 503.

### Attack surface

**None identified.** The wildcard is on public, unauthenticated, read-only content that contains no secrets, tokens, user data, or internal system information.

The theoretical worst case would be if the homepage contained credentials or session tokens in the HTML — it does not.

---

## Recommendation

### Option A — Accept (Low effort, low risk)

Do nothing. The wildcard on public static pages exposes nothing that isn't already public. Document the behavior and move on.

**Appropriate if:** the team is comfortable with Vercel's default behavior and wants to minimize config surface.

### Option B — Override via vercel.json headers (Hygiene fix)

Add explicit `access-control-allow-origin` overrides in `vercel.json` to suppress the wildcard on all routes. Vercel respects response headers set in `vercel.json` even for CDN-cached content.

```json
{
  "buildCommand": "bun run build",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://www.jamesroman.la"
        }
      ]
    }
  ]
}
```

This ensures no surface has the wildcard header, regardless of CDN behavior. It also makes the security posture cleaner for future audits.

**Trade-off:** If any legitimate cross-origin integration ever needs to read from this site (CDN for images, monitoring services, analytics), it would need an explicit allowlist.

**Recommendation: Implement Option B.** The change is three lines of config. A future security audit will raise this again as a finding, and the answer "it's Vercel's CDN behavior" is harder to defend than "we have an explicit CORS policy." Quiet authority means your headers say what you mean.

---

## Implementation (Option B)

Current `vercel.json`:
```json
{
  "buildCommand": "bun run build"
}
```

Updated `vercel.json`:
```json
{
  "buildCommand": "bun run build",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://www.jamesroman.la"
        }
      ]
    }
  ]
}
```

**This change requires a production deploy to take effect.** Add it alongside the security patch merge, or as a standalone follow-up commit.

---

## Disposition

| Item | Status |
|---|---|
| Source of wildcard | ✅ Identified — Vercel CDN platform behavior |
| Application code exposure | ✅ None — no app-level CORS headers set |
| Sensitive data exposure | ✅ None — wildcard only on public static content |
| API/portal exposure | ✅ Clean — no wildcard on authenticated surfaces |
| Fix implemented | ⬜ Pending — Option B recommended but not yet applied |

---

## Relation to Other Findings

The CORS wildcard was the one finding from the 2026-06-11 security audit that could not be explained by a local grep ("local smoke did not show the wildcard header"). This is now explained. It is not a code defect — it is platform behavior that can be overridden with explicit config if desired.
