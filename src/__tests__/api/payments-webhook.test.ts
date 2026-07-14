import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/payments/webhook/route';

const constructEventMock = vi.hoisted(() => vi.fn());
const createClientMock = vi.hoisted(() => vi.fn());
const updateInvoiceMock = vi.hoisted(() => vi.fn());
const createNotificationMock = vi.hoisted(() => vi.fn());

vi.mock('stripe', () => ({
  default: vi.fn(function Stripe() {
    return { webhooks: { constructEvent: constructEventMock } };
  }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

vi.mock('@/lib/notifications', () => ({
  createInAppNotification: createNotificationMock,
}));

function request(signature?: string) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (signature) headers.set('stripe-signature', signature);
  return new NextRequest('https://www.jamesroman.la/api/payments/webhook', {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'checkout.session.completed' }),
  });
}

function configureEnvironment() {
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test');
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
}

function mockDatabase(amount = 100) {
  const invoice = {
    id: 'invoice-1',
    client_id: 'client-1',
    engagement_id: 'engagement-1',
    invoice_number: 'INV-001',
    amount,
    status: 'sent',
    stripe_session_id: 'cs_1',
    stripe_payment_id: null,
  };

  const updateChain: Record<string, unknown> = {};
  updateChain.eq = vi.fn(() => updateChain);
  updateChain.select = vi.fn(() => ({
    single: vi.fn(async () => ({ data: { id: invoice.id }, error: null })),
  }));
  updateInvoiceMock.mockImplementation(() => updateChain);

  createClientMock.mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === 'invoices') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({ data: invoice, error: null })),
            })),
          })),
          update: updateInvoiceMock,
        };
      }
      if (table === 'engagements') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({ data: { phase: '3' }, error: null })),
            })),
          })),
        };
      }
      return {
        insert: vi.fn(async () => ({ data: null, error: null })),
      };
    }),
  });
}

function signedEvent(amountTotal = 10_000) {
  return {
    id: 'evt_1',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_1',
        client_reference_id: 'invoice-1',
        payment_status: 'paid',
        payment_intent: 'pi_1',
        currency: 'usd',
        amount_total: amountTotal,
        customer_email: 'client@example.com',
        metadata: {
          invoice_id: 'invoice-1',
          client_id: 'client-1',
          engagement_id: 'engagement-1',
          invoice_number: 'INV-001',
        },
      },
    },
  };
}

describe('POST /api/payments/webhook', () => {
  afterEach(() => {
    constructEventMock.mockReset();
    createClientMock.mockReset();
    updateInvoiceMock.mockReset();
    createNotificationMock.mockReset();
    vi.unstubAllEnvs();
  });

  it('rejects requests without a Stripe signature instead of parsing JSON directly', async () => {
    configureEnvironment();

    const response = await POST(request());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Missing Stripe signature' });
    expect(constructEventMock).not.toHaveBeenCalled();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it('rejects payloads that fail Stripe signature verification', async () => {
    configureEnvironment();
    constructEventMock.mockImplementationOnce(() => {
      throw new Error('invalid signature');
    });

    const response = await POST(request('t=1,v1=invalid'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid signature' });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it('marks a matching signed and paid checkout session as paid', async () => {
    configureEnvironment();
    mockDatabase();
    constructEventMock.mockReturnValueOnce(signedEvent());
    createNotificationMock.mockResolvedValueOnce(undefined);

    const response = await POST(request('t=1,v1=valid'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(updateInvoiceMock).toHaveBeenCalledWith(expect.objectContaining({
      status: 'paid',
      stripe_payment_id: 'pi_1',
      stripe_session_id: 'cs_1',
    }));
  });

  it('refuses a signed session whose amount does not match the invoice', async () => {
    configureEnvironment();
    mockDatabase(250);
    constructEventMock.mockReturnValueOnce(signedEvent(10_000));

    const response = await POST(request('t=1,v1=valid'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Payment does not match invoice' });
    expect(updateInvoiceMock).not.toHaveBeenCalled();
  });

  it('accepts a valid paid session when another checkout replaced the stored session id', async () => {
    configureEnvironment();
    mockDatabase();
    constructEventMock.mockReturnValueOnce({
      ...signedEvent(),
      data: {
        object: {
          ...signedEvent().data.object,
          id: 'cs_previous',
        },
      },
    });
    createNotificationMock.mockResolvedValueOnce(undefined);

    const response = await POST(request('t=1,v1=valid'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(updateInvoiceMock).toHaveBeenCalledWith(expect.objectContaining({
      status: 'paid',
      stripe_session_id: 'cs_previous',
    }));
  });
});
