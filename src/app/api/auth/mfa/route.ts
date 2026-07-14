/* ── MFA API — Enroll, Verify, Unenroll TOTP ──
 *
 * POST /api/auth/mfa { action: 'enroll' | 'verify' | 'unenroll' | 'challenge', ... }
 *
 * Admin/manager only for enrollment.
 * No fail-open: once MFA is enrolled, it must be verified.
 * P3: Fixed cookie pass-through so MFA verify properly updates session to aal2.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { requireAuth, isAuthError } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit MFA attempts
  const rl = checkRateLimit(ip, 'mfa', { windowMs: 15 * 60 * 1000, maxAttempts: 10 });
  if (!rl.allowed) {
    logAudit({
      action: AUDIT_ACTIONS.RATE_LIMITED,
      entity_type: 'auth',
      metadata: { route: '/api/auth/mfa', ip },
      ip_address: ip,
    });
    return NextResponse.json({ error: rl.message }, { status: 429 });
  }

  // Collect cookies set by Supabase SSR during the request lifecycle
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

  /** Create a JSON response with all pending cookies attached */
  function respond(body: object, status = 200): NextResponse {
    const res = NextResponse.json(body, { status });
    for (const { name, value, options } of pendingCookies) {
      res.cookies.set(name, value, options);
    }
    return res;
  }

  // This route is the only privileged API allowed at aal1 so administrators
  // can enroll or verify a factor. Role still comes from the trusted profile.
  const auth = await requireAuth(req, { skipMfaCheck: true });
  if (isAuthError(auth)) return auth;
  const { user, isAdmin } = auth;

  const body = await req.json();
  const { action } = body;

  switch (action) {
    /* ── ENROLL: start TOTP enrollment ── */
    case 'enroll': {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'MFA enrollment is restricted to admin and manager accounts.' },
          { status: 403 },
        );
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) {
        return respond({ error: error.message }, 400);
      }

      logAudit({
        user_id: user.id,
        action: AUDIT_ACTIONS.MFA_ENROLLED,
        entity_type: 'auth',
        metadata: { factor_id: data.id },
        ip_address: ip,
      });

      return respond({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      });
    }

    /* ── CHALLENGE: create a challenge for verification ── */
    case 'challenge': {
      const { factorId } = body;
      if (!factorId) {
        return NextResponse.json({ error: 'factorId required' }, { status: 400 });
      }

      const { data, error } = await supabase.auth.mfa.challenge({ factorId });

      if (error) {
        return respond({ error: error.message }, 400);
      }

      return respond({ challengeId: data.id });
    }

    /* ── VERIFY: verify a TOTP code ── */
    case 'verify': {
      const { factorId, challengeId, code } = body;
      if (!factorId || !challengeId || !code) {
        return NextResponse.json(
          { error: 'factorId, challengeId, and code are required' },
          { status: 400 },
        );
      }

      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (error) {
        logAudit({
          user_id: user.id,
          action: AUDIT_ACTIONS.MFA_FAILED,
          entity_type: 'auth',
          metadata: { factor_id: factorId, error: error.message },
          ip_address: ip,
        });
        return respond({ error: error.message }, 400);
      }

      logAudit({
        user_id: user.id,
        action: AUDIT_ACTIONS.MFA_VERIFIED,
        entity_type: 'auth',
        metadata: { factor_id: factorId },
        ip_address: ip,
      });

      // respond() includes the updated session cookies (aal2)
      return respond({ success: true, session: data });
    }

    /* ── UNENROLL: remove a factor ── */
    case 'unenroll': {
      const { factorId: fid } = body;
      if (!fid) {
        return NextResponse.json({ error: 'factorId required' }, { status: 400 });
      }

      const { error } = await supabase.auth.mfa.unenroll({ factorId: fid });

      if (error) {
        return respond({ error: error.message }, 400);
      }

      logAudit({
        user_id: user.id,
        action: AUDIT_ACTIONS.MFA_UNENROLLED,
        entity_type: 'auth',
        metadata: { factor_id: fid },
        ip_address: ip,
      });

      return respond({ success: true });
    }

    default:
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 },
      );
  }
}
