/* ── API Route Authentication Helpers ── */
/* Shared session verification for all API routes. Uses Supabase cookie-based auth. */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export interface AuthResult {
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
  profile: { id: string; role: string; full_name?: string; email?: string } | null;
  isAdmin: boolean;
  /** Service-role Supabase client for DB operations (only use after auth is verified) */
  sb: any; // SupabaseClient with service role — generic typing omitted for compat
}

/**
 * Verify session from cookies and return user + profile.
 * Returns an AuthResult on success, or a NextResponse (401/500) on failure.
 */
export async function requireAuth(
  req: NextRequest,
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
    user.user_metadata?.role === 'admin';

  return { user, profile, isAdmin, sb };
}

/**
 * Require an authenticated admin. Returns AuthResult or a 401/403 response.
 */
export async function requireAdmin(
  req: NextRequest,
): Promise<AuthResult | NextResponse> {
  const result = await requireAuth(req);
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
