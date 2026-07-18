import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/auth/magic-link/route';

const signInWithOtpMock = vi.hoisted(() => vi.fn());
const afterCallbacks = vi.hoisted(() => [] as Array<() => unknown | Promise<unknown>>);
const afterMock = vi.hoisted(() => vi.fn((task: () => unknown | Promise<unknown>) => {
  afterCallbacks.push(task);
}));

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    after: afterMock,
  };
});

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

function magicLinkRequest(email = 'client@jamesroman.la', ip = crypto.randomUUID()) {
  return new NextRequest('https://www.jamesroman.la/api/auth/magic-link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify({ email }),
  });
}

async function flushAfterCallbacks() {
  const callbacks = afterCallbacks.splice(0);
  await Promise.all(callbacks.map((callback) => callback()));
}

describe('POST /api/auth/magic-link', () => {
  afterEach(() => {
    signInWithOtpMock.mockReset();
    afterMock.mockClear();
    afterCallbacks.splice(0);
    vi.unstubAllEnvs();
  });

  it('returns the neutral response before dispatching Supabase OTP email', async () => {
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
    expect(afterMock).toHaveBeenCalledOnce();
    expect(signInWithOtpMock).not.toHaveBeenCalled();

    await flushAfterCallbacks();

    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: 'client@jamesroman.la',
      options: {
        emailRedirectTo: 'https://www.jamesroman.la/portal',
        shouldCreateUser: false,
      },
    });
  });

  it('fails closed when the canonical site URL is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');

    const response = await POST(magicLinkRequest('client@jamesroman.la'));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Not configured' });
    expect(afterMock).not.toHaveBeenCalled();
    expect(signInWithOtpMock).not.toHaveBeenCalled();
  });

  it('keeps provider delivery failures off the public response path', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.jamesroman.la');
    signInWithOtpMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Email provider is disabled' },
    });

    const response = await POST(magicLinkRequest('admin@jamesroman.la'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: 'If an account exists with this email, a login link has been sent.',
    });

    await flushAfterCallbacks();

    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: 'admin@jamesroman.la',
      options: {
        emailRedirectTo: 'https://www.jamesroman.la/portal',
        shouldCreateUser: false,
      },
    });
  });

  it('keeps Supabase OTP throttling off the public response path', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.jamesroman.la');
    signInWithOtpMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'email rate limit exceeded', status: 429 },
    });

    const response = await POST(magicLinkRequest('client@jamesroman.la'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: 'If an account exists with this email, a login link has been sent.',
    });

    await flushAfterCallbacks();

    expect(signInWithOtpMock).toHaveBeenCalledOnce();
  });

  it('does not expose invalid or non-member email classifications', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.jamesroman.la');
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

    await flushAfterCallbacks();

    expect(signInWithOtpMock).toHaveBeenCalledOnce();
  });

  it('still rate-limits repeated requests per IP before scheduling background work', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.jamesroman.la');
    signInWithOtpMock.mockResolvedValue({ data: {}, error: null });
    const ip = crypto.randomUUID();

    expect((await POST(magicLinkRequest('client@jamesroman.la', ip))).status).toBe(200);
    expect((await POST(magicLinkRequest('client@jamesroman.la', ip))).status).toBe(200);
    expect((await POST(magicLinkRequest('client@jamesroman.la', ip))).status).toBe(200);

    const limited = await POST(magicLinkRequest('client@jamesroman.la', ip));

    expect(limited.status).toBe(429);
    expect(afterMock).toHaveBeenCalledTimes(3);
  });
});
