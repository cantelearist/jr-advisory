import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/consultations/route';

const sendMock = vi.hoisted(() => vi.fn());

vi.mock('resend', () => ({
  Resend: vi.fn(function Resend() {
    return {
      emails: {
        send: sendMock,
      },
    };
  }),
}));

function request(body: unknown, ip = crypto.randomUUID()) {
  return new Request('https://www.jamesroman.la/api/consultations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/consultations', () => {
  afterEach(() => {
    sendMock.mockReset();
    vi.unstubAllEnvs();
  });

  it('rejects invalid email addresses before sending', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key');

    const response = await POST(request({
      name: 'Roman',
      email: 'not-an-email',
      message: 'Need help with a private remediation matter.',
    }) as never);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'A valid email is required.' });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('fails clearly when delivery is not configured', async () => {
    const response = await POST(request({
      name: 'Roman',
      email: 'roman@example.com',
      message: 'Need help with a private remediation matter.',
    }) as never);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Inquiry delivery is not configured.' });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('absorbs honeypot submissions without sending', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key');

    const response = await POST(request({
      name: 'Bot',
      email: 'bot@example.com',
      message: 'Definitely a human.',
      company: 'Spam Corp',
    }) as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('sends valid consultation requests through Resend', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    sendMock.mockResolvedValueOnce({ data: { id: 'email_123' }, error: null });

    const response = await POST(request({
      name: 'Roman',
      email: 'roman@example.com',
      market: 'Malibu',
      matter: 'Water intrusion',
      message: 'Need help reviewing contractor recommendations.',
    }) as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, messageId: 'email_123' });
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
      replyTo: 'roman@example.com',
      subject: 'Private consultation request - Roman',
      to: 'roman@jamesroman.la',
    }));
  });

  it('supports the legacy resend env var currently configured in Vercel', async () => {
    vi.stubEnv('resend', 'legacy-key');
    sendMock.mockResolvedValueOnce({ data: { id: 'email_legacy' }, error: null });

    const response = await POST(request({
      name: 'Roman',
      email: 'roman@example.com',
      message: 'Need help reviewing contractor recommendations.',
    }) as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, messageId: 'email_legacy' });
    expect(sendMock).toHaveBeenCalledOnce();
  });
});
