/* ── Login API — rate-limited server-side login ──
 *
 * POST /api/auth/login { email, password }
 *
 * Wraps Supabase signInWithPassword with rate limiting and audit logging.
 * The client should call this instead of direct Supabase auth for rate-limit enforcement.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit';

const LOGIN_ALIASES: Record<string, string> = {
  client: 'client@jamesroman.la',
  admin: 'admin@jamesroman.la',
};

function normalizeLoginIdentifier(identifier: string): string {
  const cleaned = identifier.trim();
  return LOGIN_ALIASES[cleaned.toLowerCase()] || cleaned;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit check
  const rl = checkRateLimit(ip, 'login', RATE_LIMITS.login);
  if (!rl.allowed) {
    logAudit({
      action: AUDIT_ACTIONS.RATE_LIMITED,
      entity_type: 'auth',
      metadata: { route: '/api/auth/login', ip },
      ip_address: ip,
    });
    return NextResponse.json(
      { error: rl.message },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) },
      },
    );
  }

  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email or username and password required' }, { status: 400 });
  }

  const loginEmail = normalizeLoginIdentifier(email);

  // Supabase SSR sets auth cookies during sign-in. Collect them and attach
  // them to the final JSON response so the browser actually receives a session.
  const pendingCookies: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          pendingCookies.push(...cookiesToSet);
        },
      },
    },
  );

  function respond(body: object, status = 200): NextResponse {
    const res = NextResponse.json(body, { status });
    for (const { name, value, options } of pendingCookies) {
      res.cookies.set(name, value, options);
    }
    return res;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password,
  });

  if (error) {
    logAudit({
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      entity_type: 'auth',
      metadata: { email: loginEmail, error: error.message },
      ip_address: ip,
    });
    return NextResponse.json(
      {
        error:
          error.message === 'Invalid login credentials'
            ? 'Invalid email or password.'
            : 'Login failed. Please try again.',
      },
      { status: 401 },
    );
  }

  if (!data?.user) {
    return NextResponse.json({ error: 'Login failed' }, { status: 401 });
  }

  logAudit({
    user_id: data.user.id,
    action: AUDIT_ACTIONS.LOGIN_SUCCESS,
    entity_type: 'auth',
    metadata: { email: data.user.email },
    ip_address: ip,
  });

  // Check MFA status
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const mfaRequired = aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2';

  return respond({
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role || 'client',
      onboarded: data.user.user_metadata?.onboarded !== false,
    },
    mfaRequired,
  });
}
