# Auth Hardening Report — Priority 2

**Sprint:** MVP Hardening Sprint  
**Date:** June 10, 2026  
**Commit:** `f8066f4`  
**Branch:** `main`  
**Build:** ✅ Passes

---

## P2.1: MFA for Admin/Advisor — No Fail-Open

### What was built

| Component | Path | Purpose |
|-----------|------|---------|
| MFA API | `/api/auth/mfa` | Enroll, challenge, verify, unenroll TOTP |
| MFA Verification Page | `/portal/mfa` | 6-digit code entry after login |
| MFA Setup Component | `MfaSetup.tsx` | QR enrollment UI in Admin Settings |
| Middleware Update | `middleware.ts` | Enforces AAL2 for enrolled admin/manager |
| Login Flow Update | `portal/page.tsx` | Checks MFA after login, redirects if needed |

### How it works

1. Admin navigates to Settings → Two-Factor Authentication → Enable MFA
2. Server enrolls a TOTP factor, returns QR code + secret
3. Admin scans with authenticator app, enters 6-digit code to verify
4. Factor is now enrolled — subsequent logins require 2FA
5. After password login, middleware detects `aal1` with `nextLevel=aal2`
6. User is redirected to `/portal/mfa` — must enter TOTP code
7. On successful verification, session upgrades to `aal2`
8. **No fail-open:** if enrolled, MFA cannot be bypassed. Middleware checks every protected route.

### Scope

- **Admin** and **manager** roles only (privileged accounts)
- Client accounts are not prompted for MFA
- MFA can be disabled from Settings (with confirmation)

---

## P2.2: Rate Limiting on Auth-Sensitive Routes

### Implementation

**Type:** In-memory sliding window per IP address  
**Library:** Custom `src/lib/rate-limit.ts` — zero dependencies  
**Trade-off:** Resets on cold start/redeploy (acceptable for MVP; persistent store can be added later)

### Rate limits by route

| Route | Max Attempts | Window | Category |
|-------|-------------|--------|----------|
| `/api/auth/login` | 5 | 15 min | login |
| `/api/auth/forgot-password` | 3 | 15 min | forgot-password |
| `/api/auth/reset-password` | 5 | 15 min | reset-password |
| `/api/auth/invite` | 10 | 15 min | invite |
| `/api/auth/mfa` | 10 | 15 min | mfa |
| `/api/messages/read` | 30 | 1 min | messages-read |
| `/api/messages/send` | 20 | 1 min | messages-send |
| `/api/payments/checkout` | 10 | 1 min | checkout |

### Response on rate limit hit

- HTTP 429 with `Retry-After` header
- JSON body: `{ "error": "Too many attempts. Try again in X minutes." }`
- Audit log entry written (action: `rate_limited`)

---

## P2.3: Password Hashing/Crypto Review

### Finding: No custom crypto needed

| Check | Result |
|-------|--------|
| Password storage | Supabase Auth (bcrypt internally) |
| Local password tables | None found |
| Custom hashing code | None found |
| `signInWithPassword` | Delegates to Supabase server |
| `admin.createUser({ password })` | Delegates to Supabase server |
| Setup/seed hardcoded passwords | Guarded by `VERCEL_ENV === 'production'` check + setup key |

**Conclusion:** All password operations are handled by Supabase Auth, which uses bcrypt with auto-salting. No custom password crypto exists or is needed.

---

## P2.4: Audit Logging

### Implementation

**Table:** Existing `audit_log` table via service-role client  
**Library:** `src/lib/audit.ts` — fire-and-forget (`logAudit`) + sync variant (`logAuditSync`)

### Logged events

| Action | When |
|--------|------|
| `login_success` | Successful password login |
| `login_failed` | Bad credentials |
| `mfa_enrolled` | TOTP factor enrollment complete |
| `mfa_verified` | Successful MFA verification |
| `mfa_failed` | Bad TOTP code |
| `mfa_unenrolled` | MFA disabled |
| `password_reset_requested` | Reset email sent |
| `password_reset_completed` | New password set |
| `invite_created` | Client account created |
| `rate_limited` | Any route rate limit hit |

### Fields per log entry

```
user_id, action, entity_type, entity_id, metadata (JSON), ip_address, created_at
```

---

## P2.5: Additional Fixes

### is_admin() SQL function
- **Before:** Only checked `role = 'admin'`
- **After:** Checks `role IN ('admin', 'manager')`
- **Migration:** `005_auth_hardening.sql`

### Import fixes
- `messages/send/route.ts` — changed `rateLimit`/`getClientIP` → `checkRateLimit`/`getClientIp`
- `payments/checkout/route.ts` — same fix

### Login flow
- Login page now calls `/api/auth/login` (server-side, rate-limited) instead of direct `supabase.auth.signInWithPassword`
- Forgot-password page calls `/api/auth/forgot-password` (server-side)
- Reset-password page calls `/api/auth/reset-password` (server-side)

---

## Files Changed (18 files, +1432/-90)

### New files
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/mfa/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/portal/mfa/page.tsx`
- `src/components/portal/admin/MfaSetup.tsx`
- `src/lib/audit.ts`
- `supabase/migrations/005_auth_hardening.sql`

### Modified files
- `src/app/api/auth/invite/route.ts` — rate limit + audit
- `src/app/api/messages/read/route.ts` — rate limit + audit
- `src/app/api/messages/send/route.ts` — fixed imports
- `src/app/api/payments/checkout/route.ts` — fixed imports
- `src/app/portal/forgot-password/page.tsx` — use API route
- `src/app/portal/page.tsx` — use login API + MFA check
- `src/app/portal/reset-password/page.tsx` — use API route
- `src/components/portal/admin/tabs/AdminSettings.tsx` — MFA UI
- `src/lib/rate-limit.ts` — new unified rate-limit module
- `src/middleware.ts` — MFA enforcement
