import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/auth/mfa/route';

const getUserMock = vi.hoisted(() => vi.fn());
const listFactorsMock = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: getUserMock,
      mfa: { listFactors: listFactorsMock },
    },
  })),
}));

function statusRequest() {
  return new NextRequest('https://www.jamesroman.la/api/auth/mfa', {
    headers: { cookie: 'sb-session=test-session' },
  });
}

describe('GET /api/auth/mfa', () => {
  afterEach(() => {
    getUserMock.mockReset();
    listFactorsMock.mockReset();
    vi.unstubAllEnvs();
  });

  it('returns the authenticated user MFA factors', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } });
    listFactorsMock.mockResolvedValueOnce({
      data: { totp: [{ id: 'factor-1', status: 'verified' }] },
      error: null,
    });

    const response = await GET(statusRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      factors: [{ id: 'factor-1', status: 'verified' }],
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('does not expose MFA status without a session', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });

    const response = await GET(statusRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Not authenticated' });
    expect(listFactorsMock).not.toHaveBeenCalled();
  });

  it('returns a bounded provider error when factors cannot be read', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } });
    listFactorsMock.mockResolvedValueOnce({ data: null, error: new Error('provider unavailable') });

    const response = await GET(statusRequest());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'Unable to read MFA status' });
  });
});
