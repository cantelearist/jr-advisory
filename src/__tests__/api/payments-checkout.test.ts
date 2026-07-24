import { NextRequest, NextResponse } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/payments/checkout/route';

const requireAuthMock = vi.hoisted(() => vi.fn());
const retrieveSessionMock = vi.hoisted(() => vi.fn());
const createSessionMock = vi.hoisted(() => vi.fn());
const expireSessionMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireAuth: requireAuthMock,
  isAuthError: (value: unknown) => value instanceof NextResponse,
}));

vi.mock('stripe', () => ({
  default: vi.fn(function Stripe() {
    return {
      checkout: {
        sessions: {
          retrieve: retrieveSessionMock,
          create: createSessionMock,
          expire: expireSessionMock,
        },
      },
    };
  }),
}));

function checkoutRequest() {
  return new NextRequest('https://www.jamesroman.la/api/payments/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': crypto.randomUUID(),
    },
    body: JSON.stringify({ invoice_id: 'invoice-1' }),
  });
}

function configure() {
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.jamesroman.la');
  const invoice = {
    id: 'invoice-1',
    client_id: 'client-1',
    engagement_id: 'engagement-1',
    invoice_number: 'INV-100',
    description: 'Advisory services',
    amount: 1500,
    status: 'sent',
    stripe_session_id: 'cs_existing',
    updated_at: '2026-07-23T00:00:00.000Z',
  };
  const sb = {
    from: vi.fn((table: string) => {
      if (table === 'invoices') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({ data: invoice, error: null })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
        };
      }
      if (table === 'clients') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: { name: 'Client One', email: 'client@example.com' },
                error: null,
              })),
            })),
          })),
        };
      }
      return { insert: vi.fn(async () => ({ data: null, error: null })) };
    }),
  };
  requireAuthMock.mockResolvedValueOnce({
    user: { id: 'admin-1' },
    profile: { role: 'admin' },
    isAdmin: true,
    sb,
  });
}

describe('POST /api/payments/checkout', () => {
  afterEach(() => {
    requireAuthMock.mockReset();
    retrieveSessionMock.mockReset();
    createSessionMock.mockReset();
    expireSessionMock.mockReset();
    vi.unstubAllEnvs();
  });

  it('reuses an existing open session instead of creating a second payment link', async () => {
    configure();
    retrieveSessionMock.mockResolvedValueOnce({
      id: 'cs_existing',
      status: 'open',
      payment_status: 'unpaid',
      url: 'https://checkout.stripe.com/existing',
    });

    const response = await POST(checkoutRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: 'https://checkout.stripe.com/existing',
      reused: true,
    });
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it('does not issue another link while a completed payment awaits its webhook', async () => {
    configure();
    retrieveSessionMock.mockResolvedValueOnce({
      id: 'cs_existing',
      status: 'complete',
      payment_status: 'paid',
      url: null,
    });

    const response = await POST(checkoutRequest());

    expect(response.status).toBe(409);
    expect(createSessionMock).not.toHaveBeenCalled();
  });
});
