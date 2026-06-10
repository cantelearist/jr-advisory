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

  // Use service role to send reset email — doesn't reveal if user exists
  await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: email.trim(),
    options: {
      redirectTo: `${req.nextUrl.origin}/portal/reset-password`,
    },
  });

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
