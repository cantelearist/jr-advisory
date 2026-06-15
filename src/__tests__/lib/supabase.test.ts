import { afterEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

describe('getSupabase', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    createClientMock.mockReset();
  });

  it('uses an isolated non-auth storage key for browser data access', async () => {
    const client = { from: vi.fn() };
    createClientMock.mockReturnValue(client);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');

    const { getSupabase } = await import('@/lib/supabase');

    expect(getSupabase()).toBe(client);
    expect(createClientMock).toHaveBeenCalledWith('https://example.supabase.co', 'anon-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'jr-public-non-auth',
      },
    });
  });
});
