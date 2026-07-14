import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/auth/login/route';

const signInWithPasswordMock = vi.hoisted(() => vi.fn());
const getAuthenticatorAssuranceLevelMock = vi.hoisted(() => vi.fn());
const profileMaybeSingleMock = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((_url, _key, options) => ({
    auth: {
      signInWithPassword: async (credentials: unknown) => {
        options.cookies.setAll([
          {
            name: 'sb-access-token',
            value: 'test-access-token',
            options: { path: '/', httpOnly: true, sameSite: 'lax' },
          },
        ]);
        return signInWithPasswordMock(credentials);
      },
      mfa: {
        getAuthenticatorAssuranceLevel: getAuthenticatorAssuranceLevelMock,
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: profileMaybeSingleMock,
        }),
      }),
    }),
  })),
}));

vi.mock('@/lib/audit', () => ({
  AUDIT_ACTIONS: {
    LOGIN_SUCCESS: 'auth.login.success',
    LOGIN_FAILED: 'auth.login.failed',
    RATE_LIMITED: 'security.rate_limited',
  },
  logAudit: vi.fn(),
}));

function loginRequest(email = 'client@jamesroman.la') {
  return new NextRequest('https://www.jamesroman.la/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': crypto.randomUUID(),
    },
    body: JSON.stringify({ email, password: 'Client1!' }),
  });
}

describe('POST /api/auth/login', () => {
  afterEach(() => {
    signInWithPasswordMock.mockReset();
    getAuthenticatorAssuranceLevelMock.mockReset();
    profileMaybeSingleMock.mockReset();
    vi.unstubAllEnvs();
  });

  it('attaches Supabase auth cookies to the final login response', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    signInWithPasswordMock.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1',
          email: 'client@jamesroman.la',
          user_metadata: { role: 'client', onboarded: true },
        },
      },
      error: null,
    });
    getAuthenticatorAssuranceLevelMock.mockResolvedValueOnce({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
    });
    profileMaybeSingleMock.mockResolvedValueOnce({ data: { role: 'client' }, error: null });

    const response = await POST(loginRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      user: { email: 'client@jamesroman.la', role: 'client' },
    });
    expect(response.headers.get('set-cookie')).toContain('sb-access-token=test-access-token');
  });

  it('maps the Client username alias to the client test email', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    signInWithPasswordMock.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1',
          email: 'client@jamesroman.la',
          user_metadata: { role: 'client', onboarded: true },
        },
      },
      error: null,
    });
    getAuthenticatorAssuranceLevelMock.mockResolvedValueOnce({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
    });
    profileMaybeSingleMock.mockResolvedValueOnce({ data: { role: 'client' }, error: null });

    const response = await POST(loginRequest('Client'));

    expect(response.status).toBe(200);
    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: 'client@jamesroman.la',
      password: 'Client1!',
    });
  });

  it('does not trust user_metadata for the role returned after login', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    signInWithPasswordMock.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1',
          email: 'client@jamesroman.la',
          user_metadata: { role: 'admin', onboarded: true },
        },
      },
      error: null,
    });
    profileMaybeSingleMock.mockResolvedValueOnce({ data: { role: 'client' }, error: null });
    getAuthenticatorAssuranceLevelMock.mockResolvedValueOnce({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    });

    const response = await POST(loginRequest());

    await expect(response.json()).resolves.toMatchObject({
      user: { role: 'client' },
      mfaRequired: false,
    });
  });

  it('requires MFA enrollment for a profile-backed administrator', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    signInWithPasswordMock.mockResolvedValueOnce({
      data: {
        user: {
          id: 'admin-1',
          email: 'admin@jamesroman.la',
          user_metadata: { role: 'client', onboarded: true },
        },
      },
      error: null,
    });
    profileMaybeSingleMock.mockResolvedValueOnce({ data: { role: 'admin' }, error: null });
    getAuthenticatorAssuranceLevelMock.mockResolvedValueOnce({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    });

    const response = await POST(loginRequest('admin@jamesroman.la'));

    await expect(response.json()).resolves.toMatchObject({
      user: { role: 'admin' },
      mfaRequired: true,
    });
  });
});
