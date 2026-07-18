/* ── Forgot Password API — rate-limited password reset request ──
 *
 * POST /api/auth/forgot-password { email }
 *
 * Rate-limited to prevent email enumeration. Always returns success
 * regardless of whether the email exists (security best practice).
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit — tight: 3 per 15 minutes
  const rl = checkRateLimit(ip, 'forgot-password', RATE_LIMITS['forgot-password']);
  if (!rl.allowed) {
    logAudit({
      action: AUDIT_ACTIONS.RATE_LIMITED,
      entity_type: 'auth',
      metadata: { route: '/api/auth/forgot-password', ip },
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { email } = body as { email?: unknown };

  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');

  if (!url || !anonKey || !siteUrl) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const supabase = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Supabase sends the recovery email itself. `admin.generateLink()` only
  // creates a link and would leave the user with no email to click.
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${siteUrl}/portal/reset-password`,
  });

  if (error) {
    // Keep the public response neutral, but retain the failure in server logs
    // for operational diagnosis without exposing account existence.
    console.error('[auth/forgot-password] reset email dispatch failed:', error.message);
  }

  logAudit({
    action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
    entity_type: 'auth',
    metadata: { email: email.trim() },
    ip_address: ip,
  });

  // Always return success — don't reveal whether the email exists
  return NextResponse.json({
    success: true,
    message: 'If an account exists with this email, a reset link has been sent.',
  });
}
