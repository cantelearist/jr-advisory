/* ── Magic Link API — rate-limited server-side OTP dispatch ──
 *
 * POST /api/auth/magic-link { email }
 *
 * Keeps the public response neutral and moves Supabase's variable email work
 * off the response path so account existence is not exposed by status or timing.
 * P3: Session & Token Security hardening.
 */

import { after, NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit';

const NEUTRAL_MAGIC_LINK_RESPONSE = {
  success: true,
  message: 'If an account exists with this email, a login link has been sent.',
};
const MAGIC_LINK_RESPONSE_FLOOR_MS = 300;

function isNonMemberOtpError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('signups not allowed') ||
    normalized.includes('user not found') ||
    normalized.includes('email_address_invalid') ||
    normalized.includes('email address') && normalized.includes('invalid')
  );
}

function siteBaseUrl(): string | null {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) return null;
  return siteUrl.replace(/\/$/, '');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function applyNeutralResponseFloor(startedAt: number): Promise<void> {
  const remaining = MAGIC_LINK_RESPONSE_FLOOR_MS - (Date.now() - startedAt);
  if (remaining > 0) {
    await sleep(remaining);
  }
}

async function dispatchMagicLink({
  email,
  redirectTo,
  ip,
  supabaseUrl,
  supabaseAnonKey,
}: {
  email: string;
  redirectTo: string;
  ip: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false,
      },
    });

    if (error?.status === 429) {
      logAudit({
        action: AUDIT_ACTIONS.RATE_LIMITED,
        entity_type: 'auth',
        metadata: { route: '/api/auth/magic-link', source: 'supabase' },
        ip_address: ip,
      });
      return;
    }

    if (error && !isNonMemberOtpError(error.message)) {
      logAudit({
        action: AUDIT_ACTIONS.MAGIC_LINK_SENT,
        entity_type: 'auth',
        metadata: { email, error: error.message },
        ip_address: ip,
      });
      return;
    }

    logAudit({
      action: AUDIT_ACTIONS.MAGIC_LINK_SENT,
      entity_type: 'auth',
      metadata: { email },
      ip_address: ip,
    });
  } catch (error) {
    logAudit({
      action: AUDIT_ACTIONS.MAGIC_LINK_SENT,
      entity_type: 'auth',
      metadata: {
        email,
        error: error instanceof Error ? error.message : 'Unknown magic-link dispatch failure',
      },
      ip_address: ip,
    });
  }
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
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
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';

  if (!trimmedEmail) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteUrl = siteBaseUrl();

  if (!url || !anonKey || !siteUrl) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  after(() => dispatchMagicLink({
    email: trimmedEmail,
    redirectTo: `${siteUrl}/portal`,
    ip,
    supabaseUrl: url,
    supabaseAnonKey: anonKey,
  }));

  await applyNeutralResponseFloor(startedAt);

  return NextResponse.json(NEUTRAL_MAGIC_LINK_RESPONSE);
}
