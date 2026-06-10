# Security Blockers Complete

**Sprint:** MVP Hardening Sprint — Priority 1  
**Date:** June 10, 2026  
**Commit:** `5ea1f5d`  
**Branch:** `main`

---

## B1: `/api/messages/read` Authentication — FIXED

**Problem:** Route had no authentication — anyone could mark messages as read.

**Fix:**
- Added `requireAuth()` session verification
- Non-admin users can only mark their own messages (ownership verified via `clients.profile_id`)
- Admin can mark any message
- Audit log entry written on every call
- Rate limited: 30 requests/minute per IP

**File:** `src/app/api/messages/read/route.ts`

---

## B2: Password Reset Flow — FIXED

**Problem:** No way for users to reset a forgotten password.

**Fix:**
- Created `/portal/forgot-password` — email input → Supabase reset link
- Created `/portal/reset-password` — code exchange → new password form (min 8 chars, confirm)
- Added "Forgot password?" link to login page
- Expired/invalid links show clear error with link to request a new one
- Both routes go through rate-limited server-side API endpoints
- Audit logged: request + completion events

**Files:**
- `src/app/portal/forgot-password/page.tsx`
- `src/app/portal/reset-password/page.tsx`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`

---

## B3: Demo Mode Fallback — REMOVED

**Problem:** If Supabase wasn't configured, the app silently fell back to localStorage-based demo mode with fake data — a security hole in production.

**Fix:**
- `auth.tsx`: removed `isDemo`, `demoLogin`, `toDbClient`, all testData imports. Sets error state if Supabase missing.
- `data.ts`: removed all testData imports, converters, `DEMO_INVOICES`, localStorage fallback. Added `requireSupabase()` guard.
- `content.ts`: removed localStorage fallback for writes. Reads still return defaults for SSG/build.
- `AdminContent.tsx`: removed demo mode reference in UI copy

**Files:** `src/lib/auth.tsx`, `src/lib/data.ts`, `src/lib/content.ts`, `src/components/portal/admin/tabs/AdminContent.tsx`
