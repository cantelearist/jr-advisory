/* -- POST /api/consultations -- public homepage inquiry capture */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { Resend } from 'resend';
import { CONTACT_EMAIL } from '@/lib/constants';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { escapeHtml } from '@/lib/sanitize';
import { internalError } from '@/lib/api-error';

type ConsultationRequest = {
  name: string;
  email: string;
  market: string;
  matter: string;
  message: string;
};

const MAX = {
  name: 120,
  email: 254,
  market: 160,
  matter: 160,
  message: 4000,
};

const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || 'James Roman Advisory <notifications@jamesroman.la>';
const RECIPIENT_EMAIL = process.env.CONSULTATION_RECIPIENT_EMAIL || CONTACT_EMAIL;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeText(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseConsultationRequest(input: unknown):
  | { ok: true; data: ConsultationRequest; honeypot: boolean }
  | { ok: false; error: string } {
  const body = asRecord(input);
  if (!body) return { ok: false, error: 'Invalid request.' };

  const honeypot = normalizeText(body.company, 200);
  const data = {
    name: normalizeText(body.name, MAX.name),
    email: normalizeText(body.email, MAX.email).toLowerCase(),
    market: normalizeText(body.market, MAX.market),
    matter: normalizeText(body.matter, MAX.matter),
    message: normalizeText(body.message, MAX.message),
  };

  if (!data.name) return { ok: false, error: 'Name is required.' };
  if (!data.email || !isEmail(data.email)) return { ok: false, error: 'A valid email is required.' };
  if (!data.message) return { ok: false, error: 'Brief context is required.' };

  return { ok: true, data, honeypot: honeypot.length > 0 };
}

function emailHtml(data: ConsultationRequest): string {
  const detail = (label: string, value: string) => value
    ? `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>`
    : '';

  return `
    <h2>New private consultation request</h2>
    ${detail('Name', data.name)}
    ${detail('Email', data.email)}
    ${detail('Primary market', data.market)}
    ${detail('Matter type', data.matter)}
    <hr />
    <p><strong>Brief context</strong></p>
    <p>${escapeHtml(data.message).replace(/\n/g, '<br />')}</p>
  `;
}

function emailText(data: ConsultationRequest): string {
  return [
    'New private consultation request',
    '',
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.market ? `Primary market: ${data.market}` : '',
    data.matter ? `Matter type: ${data.matter}` : '',
    '',
    'Brief context:',
    data.message,
  ].filter(Boolean).join('\n');
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(ip, 'consultations', { windowMs: 60 * 60 * 1000, maxAttempts: 5 });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(limit.resetMs / 1000)) },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const parsed = parseConsultationRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (parsed.honeypot) {
    return NextResponse.json({ success: true });
  }

  const key = process.env.RESEND_API_KEY || process.env.resend;
  if (!key) {
    console.error('[consultations] RESEND_API_KEY not configured');
    return NextResponse.json({ error: 'Inquiry delivery is not configured.' }, { status: 503 });
  }

  try {
    const resend = new Resend(key);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: RECIPIENT_EMAIL,
      replyTo: parsed.data.email,
      subject: `Private consultation request - ${parsed.data.name}`,
      html: emailHtml(parsed.data),
      text: emailText(parsed.data),
    });

    if (result.error) {
      console.error('[consultations] Resend error:', result.error);
      return NextResponse.json({ error: 'Inquiry could not be delivered.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, messageId: result.data?.id });
  } catch (error) {
    return internalError(error, 'consultations/send');
  }
}
