/* ── Logout API — server-side session revocation ──
 *
 * POST /api/auth/logout
 *
 * Revokes the refresh token server-side so the session cannot be reused
 * even if the JWT hasn't expired yet. Clears Supabase auth cookies.
 * P3: Session & Token Security hardening.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit';
import { getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  // Build response so we can clear cookies
  const response = NextResponse.json({ success: true });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Get current user before signing out
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Revoke session server-side using admin API
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Sign out all sessions for this user (scope: 'global' revokes all refresh tokens)
    await admin.auth.admin.signOut(user.id, 'global');

    logAudit({
      user_id: user.id,
      action: AUDIT_ACTIONS.LOGOUT,
      entity_type: 'auth',
      metadata: { email: user.email, scope: 'global' },
      ip_address: ip,
    });
  }

  // Also sign out locally (clears cookies)
  await supabase.auth.signOut();

  // Explicitly clear all Supabase auth cookies to be thorough
  const allCookies = req.cookies.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      });
    }
  }

  return response;
}
