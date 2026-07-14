import { NextRequest, NextResponse } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DELETE } from '@/app/api/documents/delete/route';
import { POST } from '@/app/api/documents/upload/route';

const requireAdminMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireAdmin: requireAdminMock,
  isAuthError: (value: unknown) => value instanceof NextResponse,
}));

describe('document storage lifecycle', () => {
  afterEach(() => {
    requireAdminMock.mockReset();
  });

  it('keeps the database record when storage deletion fails', async () => {
    const deleteRowMock = vi.fn();
    const removeMock = vi.fn(async () => ({
      error: { message: 'storage unavailable' },
    }));
    const admin = {
      storage: { from: vi.fn(() => ({ remove: removeMock })) },
      from: vi.fn((table: string) => {
        if (table !== 'documents') throw new Error(`Unexpected table: ${table}`);
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: { id: 'document-1', file_path: 'client/report.pdf', name: 'Report' },
                error: null,
              })),
            })),
          })),
          delete: deleteRowMock,
        };
      }),
    };
    requireAdminMock.mockResolvedValueOnce({
      user: { id: 'admin-1' },
      isAdmin: true,
      sb: admin,
    });

    const response = await DELETE(new NextRequest(
      'https://www.jamesroman.la/api/documents/delete?id=document-1',
      { method: 'DELETE' },
    ));

    expect(response.status).toBe(502);
    expect(deleteRowMock).not.toHaveBeenCalled();
  });

  it('removes an uploaded object when the document row cannot be created', async () => {
    const removeMock = vi.fn(async () => ({ error: null }));
    const uploadMock = vi.fn(async () => ({ error: null }));
    const admin = {
      storage: {
        from: vi.fn(() => ({ upload: uploadMock, remove: removeMock })),
      },
      from: vi.fn((table: string) => {
        if (table !== 'documents') throw new Error(`Unexpected table: ${table}`);
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: null,
                error: { message: 'database unavailable' },
              })),
            })),
          })),
        };
      }),
    };
    requireAdminMock.mockResolvedValueOnce({
      user: { id: 'admin-1' },
      isAdmin: true,
      sb: admin,
    });

    const form = new FormData();
    form.set('file', new File(['report'], 'report.pdf', { type: 'application/pdf' }));
    form.set('client_id', 'client-1');
    form.set('engagement_id', 'engagement-1');
    form.set('category', 'reports');
    form.set('name', 'Final Report');
    const req = {
      formData: vi.fn(async () => form),
    } as unknown as NextRequest;

    const response = await POST(req);

    expect(response.status).toBe(500);
    expect(uploadMock).toHaveBeenCalledOnce();
    expect(removeMock).toHaveBeenCalledWith([
      expect.stringMatching(/^client-1\/engagement-1\/reports\/\d+-Final_Report\.pdf$/),
    ]);
  });
});
