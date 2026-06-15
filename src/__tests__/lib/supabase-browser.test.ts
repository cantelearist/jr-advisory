import { afterEach, describe, expect, it, vi } from 'vitest';

const createBrowserClientMock = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: createBrowserClientMock,
}));

describe('getAuthClient', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    createBrowserClientMock.mockReset();
    delete (globalThis as typeof globalThis & { __jrSupabaseBrowserClient?: unknown }).__jrSupabaseBrowserClient;
  });

  it('reuses one browser auth client across module reloads', async () => {
    const client = { auth: { getUser: vi.fn() } };
    createBrowserClientMock.mockReturnValue(client);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');

    const firstModule = await import('@/lib/supabase-browser');
    const firstClient = firstModule.getAuthClient();

    vi.resetModules();

    const secondModule = await import('@/lib/supabase-browser');
    const secondClient = secondModule.getAuthClient();

    expect(firstClient).toBe(client);
    expect(secondClient).toBe(client);
    expect(createBrowserClientMock).toHaveBeenCalledTimes(1);
  });
});
