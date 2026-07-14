import { NextRequest, NextResponse } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST as invite } from '@/app/api/auth/invite/route';
import { GET as download } from '@/app/api/documents/download/route';

const requireAuthMock = vi.hoisted(() => vi.fn());
const requireAdminMock = vi.hoisted(() => vi.fn());
const isAuthErrorMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireAuth: requireAuthMock,
  requireAdmin: requireAdminMock,
  isAuthError: isAuthErrorMock,
}));

function deniedResponse() {
  return NextResponse.json(
    { error: 'MFA enrollment and verification required' },
    { status: 403 },
  );
}

describe('privileged route MFA gates', () => {
  afterEach(() => {
    requireAuthMock.mockReset();
    requireAdminMock.mockReset();
    isAuthErrorMock.mockReset();
  });

  it('blocks document downloads before issuing a signed URL', async () => {
    const denied = deniedResponse();
    requireAuthMock.mockResolvedValue(denied);
    isAuthErrorMock.mockReturnValue(true);

    const response = await download(
      new NextRequest('https://www.jamesroman.la/api/documents/download?id=doc-1'),
    );

    expect(requireAuthMock).toHaveBeenCalledOnce();
    expect(response.status).toBe(403);
  });

  it('blocks client invitations before creating an account', async () => {
    const denied = deniedResponse();
    requireAdminMock.mockResolvedValue(denied);
    isAuthErrorMock.mockReturnValue(true);

    const response = await invite(
      new NextRequest('https://www.jamesroman.la/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'client-1' }),
      }),
    );

    expect(requireAdminMock).toHaveBeenCalledOnce();
    expect(response.status).toBe(403);
  });
});
