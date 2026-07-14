import { NextRequest, NextResponse } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST as sign } from '@/app/api/signatures/sign/route';
import { POST as decline } from '@/app/api/signatures/decline/route';

const requireAuthMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireAuth: requireAuthMock,
  isAuthError: (value: unknown) => value instanceof NextResponse,
}));

vi.mock('@/lib/notifications', () => ({
  createInAppNotification: vi.fn(),
}));

function mutationRequest(path: string, body: Record<string, unknown>) {
  return new NextRequest(`https://www.jamesroman.la${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function authWithMissingOwnedRequest() {
  const signatureEq = vi.fn();
  const signatureQuery: Record<string, unknown> = {};
  signatureQuery.eq = signatureEq.mockImplementation(() => signatureQuery);
  signatureQuery.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
  const updateMock = vi.fn();

  const sb = {
    from: vi.fn((table: string) => {
      if (table === 'clients') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: { id: 'own-client' }, error: null })),
            })),
          })),
        };
      }
      if (table === 'signature_requests') {
        return {
          select: vi.fn(() => signatureQuery),
          update: updateMock,
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };

  requireAuthMock.mockResolvedValueOnce({
    user: { id: 'user-1', email: 'client@example.com' },
    profile: { id: 'user-1', role: 'client' },
    isAdmin: false,
    sb,
  });

  return { signatureEq, updateMock };
}

describe('signature mutation authorization', () => {
  afterEach(() => {
    requireAuthMock.mockReset();
  });

  it('will not sign a request outside the authenticated client record', async () => {
    const { signatureEq, updateMock } = authWithMissingOwnedRequest();

    const response = await sign(mutationRequest('/api/signatures/sign', {
      signature_request_id: 'victim-request',
      signature_data: 'data:image/png;base64,c2lnbmF0dXJl',
    }));

    expect(response.status).toBe(404);
    expect(signatureEq).toHaveBeenCalledWith('id', 'victim-request');
    expect(signatureEq).toHaveBeenCalledWith('client_id', 'own-client');
    expect(signatureEq).toHaveBeenCalledWith('status', 'pending');
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('will not decline a request outside the authenticated client record', async () => {
    const { signatureEq, updateMock } = authWithMissingOwnedRequest();

    const response = await decline(mutationRequest('/api/signatures/decline', {
      signature_request_id: 'victim-request',
      reason: 'Not mine',
    }));

    expect(response.status).toBe(404);
    expect(signatureEq).toHaveBeenCalledWith('id', 'victim-request');
    expect(signatureEq).toHaveBeenCalledWith('client_id', 'own-client');
    expect(signatureEq).toHaveBeenCalledWith('status', 'pending');
    expect(updateMock).not.toHaveBeenCalled();
  });
});
