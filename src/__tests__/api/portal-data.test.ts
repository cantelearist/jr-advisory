import { NextRequest, NextResponse } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/portal/data/route';

const requireAuthMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireAuth: requireAuthMock,
  isAuthError: (value: unknown) => value instanceof NextResponse,
}));

interface QueryBuilder {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: PromiseLike<{ data: unknown; error: null }>['then'];
}

function query(data: unknown): QueryBuilder {
  const builder = {} as QueryBuilder;
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.neq = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
  builder.maybeSingle = vi.fn(async () => ({ data, error: null }));
  builder.then = (resolve, reject) => Promise.resolve({ data, error: null }).then(resolve, reject);
  return builder;
}

describe('GET /api/portal/data', () => {
  afterEach(() => {
    requireAuthMock.mockReset();
  });

  it('ignores a client-supplied target id and never exposes document storage paths', async () => {
    const queries: Record<string, QueryBuilder> = {
      clients: query({ id: 'own-client', name: 'Own Client' }),
      engagements: query({ id: 'engagement-1', client_id: 'own-client' }),
      documents: query([{ id: 'document-1', name: 'Report.pdf' }]),
      messages: query([]),
      invoices: query([]),
      change_orders: query([]),
      todo: query([]),
      timeline_events: query([]),
    };
    const sb = {
      from: vi.fn((table: string) => queries[table]),
    };
    requireAuthMock.mockResolvedValueOnce({
      user: { id: 'user-1', user_metadata: { role: 'admin' } },
      profile: { id: 'user-1', role: 'client' },
      isAdmin: false,
      sb,
    });

    const response = await GET(new NextRequest(
      'https://www.jamesroman.la/api/portal/data?client_id=victim-client',
    ));

    expect(response.status).toBe(200);
    expect(queries.clients.eq).toHaveBeenCalledWith('profile_id', 'user-1');
    expect(queries.clients.eq).not.toHaveBeenCalledWith('id', 'victim-client');
    expect(queries.documents.eq).toHaveBeenCalledWith('client_id', 'own-client');
    expect(queries.documents.select.mock.calls[0][0]).not.toContain('file_path');
    await expect(response.json()).resolves.toMatchObject({
      isAdmin: false,
      client: { id: 'own-client' },
      documents: [{ id: 'document-1', name: 'Report.pdf' }],
    });
  });
});
