import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPortalData, PORTAL_DATA_TIMEOUT_MS } from '@/lib/portal-data';

describe('fetchPortalData', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns a bounded unavailable result when the API does not respond', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) => (
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      })
    )));

    const request = fetchPortalData();
    await vi.advanceTimersByTimeAsync(PORTAL_DATA_TIMEOUT_MS);

    await expect(request).resolves.toMatchObject({
      error: 'unavailable',
      documents: [],
      messages: [],
    });
  });

  it('distinguishes an expired session from an unavailable API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(fetchPortalData()).resolves.toMatchObject({ error: 'unauthorized' });
  });
});
