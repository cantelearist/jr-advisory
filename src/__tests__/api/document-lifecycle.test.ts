import { NextRequest, NextResponse } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DELETE } from '@/app/api/documents/delete/route';
import { POST } from '@/app/api/documents/upload/route';

const requireAdminMock = vi.hoisted(() => vi.fn());
const requireAuthMock = vi.hoisted(() => vi.fn());
const sendNotificationMock = vi.hoisted(() => vi.fn());
const sendNotificationsMock = vi.hoisted(() => vi.fn());
const createNotificationMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireAdmin: requireAdminMock,
  requireAuth: requireAuthMock,
  isAuthError: (value: unknown) => value instanceof NextResponse,
}));

vi.mock('@/lib/notifications', () => ({
  sendNotification: sendNotificationMock,
  sendNotifications: sendNotificationsMock,
  createInAppNotification: createNotificationMock,
}));

describe('document storage lifecycle', () => {
  afterEach(() => {
    requireAdminMock.mockReset();
    requireAuthMock.mockReset();
    sendNotificationMock.mockReset();
    sendNotificationsMock.mockReset();
    createNotificationMock.mockReset();
  });

  it('keeps the database record when storage deletion fails', async () => {
    const deleteRowMock = vi.fn();
    const removeMock = vi.fn(async () => ({
      error: { message: 'storage unavailable' },
    }));
    const admin = {
      storage: { from: vi.fn(() => ({ remove: removeMock })) },
      from: vi.fn((table: string) => {
        if (table === 'documents') {
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
        }
        if (table === 'change_orders') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({ data: null, error: null })),
                })),
              })),
            })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
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

  it('preserves an original contract referenced by a change order', async () => {
    const removeMock = vi.fn();
    const admin = {
      storage: { from: vi.fn(() => ({ remove: removeMock })) },
      from: vi.fn((table: string) => {
        if (table === 'documents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: { id: 'document-1', file_path: 'client/contract.pdf', name: 'Contract' },
                  error: null,
                })),
              })),
            })),
          };
        }
        if (table === 'change_orders') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { id: 'change-order-1' },
                    error: null,
                  })),
                })),
              })),
            })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
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

    expect(response.status).toBe(409);
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('removes an uploaded object when the document row cannot be created', async () => {
    const removeMock = vi.fn(async () => ({ error: null }));
    const uploadMock = vi.fn(async () => ({ error: null }));
    const admin = {
      storage: {
        from: vi.fn(() => ({ upload: uploadMock, remove: removeMock })),
      },
      from: vi.fn((table: string) => {
        if (table === 'engagements') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({ data: { id: 'engagement-1' }, error: null })),
                })),
              })),
            })),
          };
        }
        if (table === 'clients') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: {
                    id: 'client-1',
                    profile_id: 'client-user',
                    name: 'Client One',
                    email: 'client@example.com',
                  },
                  error: null,
                })),
              })),
            })),
          };
        }
        if (table === 'documents') {
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
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    requireAuthMock.mockResolvedValueOnce({
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

  it('emails the client after an admin uploads a document', async () => {
    const doc = {
      id: 'document-1',
      client_id: 'client-1',
      engagement_id: 'engagement-1',
      name: 'Final Report',
      category: 'reports',
      status: 'final',
      file_path: 'client-1/engagement-1/reports/final.pdf',
    };
    const admin = {
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(async () => ({ error: null })),
        })),
      },
      from: vi.fn((table: string) => {
        if (table === 'engagements') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({ data: { id: 'engagement-1' }, error: null })),
                })),
              })),
            })),
          };
        }
        if (table === 'clients') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: {
                    id: 'client-1',
                    profile_id: 'client-user',
                    name: 'Client One',
                    email: 'client@example.com',
                  },
                  error: null,
                })),
              })),
            })),
          };
        }
        if (table === 'documents') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({ data: doc, error: null })),
              })),
            })),
          };
        }
        return { insert: vi.fn(async () => ({ data: null, error: null })) };
      }),
    };
    requireAuthMock.mockResolvedValueOnce({
      user: { id: 'admin-1' },
      isAdmin: true,
      sb: admin,
    });
    sendNotificationMock.mockResolvedValueOnce({ success: true });
    createNotificationMock.mockResolvedValueOnce({ success: true });

    const form = new FormData();
    form.set('file', new File(['report'], 'report.pdf', { type: 'application/pdf' }));
    form.set('client_id', 'client-1');
    form.set('engagement_id', 'engagement-1');
    form.set('category', 'reports');
    form.set('name', 'Final Report');
    const response = await POST({
      formData: vi.fn(async () => form),
    } as unknown as NextRequest);

    expect(response.status).toBe(200);
    expect(sendNotificationMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'document_uploaded',
      recipientEmail: 'client@example.com',
    }));
    expect(createNotificationMock).toHaveBeenCalledWith(expect.objectContaining({
      target: 'client-1',
      link: '/portal/documents',
    }));
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      notification: { emailSent: true },
    });
  });
});
