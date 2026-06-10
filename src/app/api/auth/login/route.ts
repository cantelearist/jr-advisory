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
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  // Create response so we can set cookies
  const response = NextResponse.json({ success: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    logAudit({
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      entity_type: 'auth',
      metadata: { email: email.trim(), error: error.message },
      ip_address: ip,
    });
    return NextResponse.json(
      {
        error:
          error.message === 'Invalid login credentials'
            ? 'Invalid email or password.'
            : error.message,
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

  return NextResponse.json({
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
