/* ── Magic Link API — rate-limited server-side OTP send ──
 *
 * POST /api/auth/magic-link { email }
 *
 * Wraps Supabase signInWithOtp with rate limiting so magic link sends
 * can't bypass server-side throttling. Anti-enumeration: always returns 200.
 * P3: Session & Token Security hardening.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit — same as forgot-password: 3 per 15 minutes
  const rl = checkRateLimit(ip, 'magic-link', { windowMs: 15 * 60 * 1000, maxAttempts: 3 });
  if (!rl.allowed) {
    logAudit({
      action: AUDIT_ACTIONS.RATE_LIMITED,
      entity_type: 'auth',
      metadata: { route: '/api/auth/magic-link', ip },
      ip_address: ip,
    });
    return NextResponse.json(
      { error: rl.message },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } },
    );
  }

  const body = await req.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Use admin API to generate and send the magic link
  // This doesn't reveal if the user exists (anti-enumeration)
  await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email.trim(),
    options: {
      redirectTo: `${req.nextUrl.origin}/auth/callback`,
    },
  });

  logAudit({
    action: AUDIT_ACTIONS.MAGIC_LINK_SENT,
    entity_type: 'auth',
    metadata: { email: email.trim() },
    ip_address: ip,
  });

  // Always return success — don't reveal whether the email exists
  return NextResponse.json({
    success: true,
    message: 'If an account exists with this email, a login link has been sent.',
  });
}
