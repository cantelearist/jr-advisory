import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/auth/magic-link/route';

const signInWithOtpMock = vi.hoisted(() => vi.fn());

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOtp: signInWithOtpMock,
    },
  })),
}));

vi.mock('@/lib/audit', () => ({
  AUDIT_ACTIONS: {
    MAGIC_LINK_SENT: 'auth.magic_link.sent',
    RATE_LIMITED: 'security.rate_limited',
  },
  logAudit: vi.fn(),
}));

function magicLinkRequest(email = 'client@jamesroman.la') {
  return new NextRequest('https://www.jamesroman.la/api/auth/magic-link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': crypto.randomUUID(),
    },
    body: JSON.stringify({ email }),
  });
}

describe('POST /api/auth/magic-link', () => {
  afterEach(() => {
    signInWithOtpMock.mockReset();
    vi.unstubAllEnvs();
  });

  it('sends a magic link through Supabase OTP email', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.jamesroman.la');
    signInWithOtpMock.mockResolvedValueOnce({ data: {}, error: null });

    const response = await POST(magicLinkRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: 'If an account exists with this email, a login link has been sent.',
    });
    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: 'client@jamesroman.la',
      options: {
        emailRedirectTo: 'https://www.jamesroman.la/portal',
        shouldCreateUser: false,
      },
    });
  });

  it('reports real OTP delivery failures without leaking provider details', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    signInWithOtpMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Email provider is disabled' },
    });

    const response = await POST(magicLinkRequest('admin@jamesroman.la'));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'Failed to send login link.' });
  });

  it('returns a clear rate-limit response when Supabase throttles OTP email', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    signInWithOtpMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'email rate limit exceeded', status: 429 },
    });

    const response = await POST(magicLinkRequest('client@jamesroman.la'));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: 'Too many login link requests. Please wait a few minutes and try again.',
    });
  });

  it('does not expose invalid or non-member email classifications', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    signInWithOtpMock.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Email address "client@jamesroman.la" is invalid',
        status: 400,
        code: 'email_address_invalid',
      },
    });

    const response = await POST(magicLinkRequest('client@jamesroman.la'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: 'If an account exists with this email, a login link has been sent.',
    });
  });
});
