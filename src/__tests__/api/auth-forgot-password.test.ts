import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/auth/forgot-password/route';

const resetPasswordForEmailMock = vi.hoisted(() => vi.fn());
const createClientMock = vi.hoisted(() => vi.fn(() => ({
  auth: { resetPasswordForEmail: resetPasswordForEmailMock },
})));

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

vi.mock('@/lib/audit', () => ({
  AUDIT_ACTIONS: { PASSWORD_RESET_REQUESTED: 'auth.password_reset.requested', RATE_LIMITED: 'security.rate_limited' },
  logAudit: vi.fn(),
}));

function resetRequest(email = 'client@jamesroman.la') {
  return new NextRequest('https://attacker.example/api/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-real-ip': crypto.randomUUID(),
    },
    body: JSON.stringify({ email }),
  });
}

describe('POST /api/auth/forgot-password', () => {
  afterEach(() => {
    resetPasswordForEmailMock.mockReset();
    createClientMock.mockClear();
    vi.unstubAllEnvs();
  });

  it('sends the reset email through the anon client and uses the canonical site URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.jamesroman.la/');
    resetPasswordForEmailMock.mockResolvedValueOnce({ data: {}, error: null });

    const response = await POST(resetRequest());

    expect(response.status).toBe(200);
    expect(resetPasswordForEmailMock).toHaveBeenCalledWith(
      'client@jamesroman.la',
      { redirectTo: 'https://www.jamesroman.la/portal/reset-password' },
    );
    expect(createClientMock).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  });

  it('keeps provider failures neutral', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.jamesroman.la');
    resetPasswordForEmailMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'User not found' },
    });

    const response = await POST(resetRequest('unknown@example.com'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });

  it('fails closed when the canonical site URL is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');

    const response = await POST(resetRequest());

    expect(response.status).toBe(503);
    expect(resetPasswordForEmailMock).not.toHaveBeenCalled();
  });
});
