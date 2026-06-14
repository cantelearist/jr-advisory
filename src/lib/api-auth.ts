/* ── API Route Authentication Helpers ── */
/* Shared session verification for all API routes. Uses Supabase cookie-based auth. */
/* P3: Added MFA/AAL enforcement for admin/manager API access. */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export interface AuthResult {
  user: { id: string; email?: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> };
  profile: { id: string; role: string; full_name?: string; email?: string } | null;
  isAdmin: boolean;
  /** Service-role Supabase client for DB operations (only use after auth is verified) */
  sb: any; // SupabaseClient with service role — generic typing omitted for compat
}

/**
 * Sanitize a redirect URL to prevent open-redirect attacks.
 * Returns a safe relative path or the fallback.
 */
export function sanitizeRedirect(url: string | null, fallback = '/portal/dashboard'): string {
  if (!url) return fallback;
  // Strip whitespace and control characters
  const cleaned = url.trim();
  // Must start with / and not // (protocol-relative URL)
  if (!cleaned.startsWith('/') || cleaned.startsWith('//')) return fallback;
  // Must be a portal path or root
  // Block any attempt to inject protocol via encoded chars
  try {
    const parsed = new URL(cleaned, 'https://placeholder.local');
    if (parsed.hostname !== 'placeholder.local') return fallback;
  } catch {
    return fallback;
  }
  return cleaned;
}

/**
 * Verify session from cookies and return user + profile.
 * Returns an AuthResult on success, or a NextResponse (401/500) on failure.
 *
 * Options:
 * - skipMfaCheck: bypass AAL enforcement (for MFA-related routes themselves)
 */
export async function requireAuth(
  req: NextRequest,
  options?: { skipMfaCheck?: boolean },
): Promise<AuthResult | NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 503 },
    );
  }

  // Build a cookie-aware auth client
  const supabaseAuth = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll() {
        // Route handlers can't set cookies on the request; this is a no-op.
      },
    },
  });

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Fetch profile for role check
  const sb = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile } = await sb
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single();

  const isAdmin =
    profile?.role === 'admin' ||
    profile?.role === 'manager' ||
    user.app_metadata?.role === 'admin' ||
    user.app_metadata?.role === 'manager';

  // ── MFA enforcement for admin/manager on API routes ──
  // If user is privileged and has MFA enrolled, they must have aal2.
  // This closes the gap where middleware gates pages but not API routes.
  if (isAdmin && !options?.skipMfaCheck) {
    const { data: aal } =
      await supabaseAuth.auth.mfa.getAuthenticatorAssuranceLevel();

    if (
      aal?.nextLevel === 'aal2' &&
      aal?.currentLevel !== 'aal2'
    ) {
      return NextResponse.json(
        { error: 'MFA verification required' },
        { status: 403 },
      );
    }
  }

  return { user, profile, isAdmin, sb };
}

/**
 * Require an authenticated admin. Returns AuthResult or a 401/403 response.
 */
export async function requireAdmin(
  req: NextRequest,
  options?: { skipMfaCheck?: boolean },
): Promise<AuthResult | NextResponse> {
  const result = await requireAuth(req, options);
  if (result instanceof NextResponse) return result;

  if (!result.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return result;
}

/** Check if a result is an error response (use as type guard). */
export function isAuthError(
  result: AuthResult | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}
