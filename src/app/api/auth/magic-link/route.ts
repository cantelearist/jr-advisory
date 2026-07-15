/* ── Magic Link API — rate-limited server-side OTP send ──
 *
 * POST /api/auth/magic-link { email }
 *
 * Wraps Supabase signInWithOtp with rate limiting so magic link sends
 * can't bypass server-side throttling.
 * P3: Session & Token Security hardening.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit';

function isNonMemberOtpError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('signups not allowed') ||
    normalized.includes('user not found') ||
    normalized.includes('email_address_invalid') ||
    normalized.includes('email address') && normalized.includes('invalid')
  );
}

function callbackBaseUrl(req: NextRequest): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, '');
}

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
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const supabase = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // The browser client uses Supabase's implicit flow, which returns
        // access and refresh tokens in the URL hash. Send users directly to
        // the portal so AuthProvider can consume and clear those tokens.
        emailRedirectTo: `${callbackBaseUrl(req)}/portal`,
        shouldCreateUser: false,
      },
  });

  if (error?.status === 429) {
    return NextResponse.json(
      { error: 'Too many login link requests. Please wait a few minutes and try again.' },
      { status: 429 },
    );
  }

  if (error && !isNonMemberOtpError(error.message)) {
    logAudit({
      action: AUDIT_ACTIONS.MAGIC_LINK_SENT,
      entity_type: 'auth',
      metadata: { email: email.trim(), error: error.message },
      ip_address: ip,
    });
    return NextResponse.json({ error: 'Failed to send login link.' }, { status: 502 });
  }

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
