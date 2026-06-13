/* ── Email notification system via Resend ── */

import { Resend } from 'resend';
import { escapeHtml } from './sanitize';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY || process.env.resend;
  if (!key) return null;
  return new Resend(key);
}

const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || 'James Roman Advisory <notifications@jamesroman.la>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jamesroman.la';

/* ── Email Templates ── */

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #0a0a0a; font-family: 'Georgia', serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 32px; }
    .header { text-align: center; padding-bottom: 32px; border-bottom: 1px solid #1a1a1a; margin-bottom: 32px; }
    .logo { color: #c9a96e; font-size: 14px; letter-spacing: 4px; text-transform: uppercase; font-family: monospace; }
    .content { color: #d4d4d4; font-size: 15px; line-height: 1.7; }
    .content h2 { color: #ffffff; font-size: 22px; margin: 0 0 16px; font-weight: 400; }
    .content p { margin: 0 0 16px; }
    .highlight { background: rgba(201,169,110,0.08); border-left: 3px solid #c9a96e; padding: 16px 20px; margin: 24px 0; border-radius: 0 6px 6px 0; }
    .highlight p { margin: 0; color: #e5e5e5; }
    .highlight .label { color: #c9a96e; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-family: monospace; margin-bottom: 8px; }
    .btn { display: inline-block; background: rgba(201,169,110,0.15); border: 1px solid #c9a96e; color: #c9a96e; padding: 12px 28px; border-radius: 4px; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-family: monospace; margin-top: 24px; }
    .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #1a1a1a; text-align: center; color: #555; font-size: 12px; }
    .footer a { color: #c9a96e; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">James Roman Advisory</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><a href="${SITE_URL}">jamesroman.la</a> · (310) 430-2500</p>
      <p style="margin-top: 8px; font-size: 11px;">Confidential — intended solely for the named recipient</p>
    </div>
  </div>
</body>
</html>`;
}

/* ── Notification Types ── */

export interface NotificationPayload {
  type: 'new_message' | 'invoice_sent' | 'document_uploaded' | 'phase_change' | 'welcome';
  recipientEmail: string;
  recipientName: string;
  data: Record<string, string>;
}

const templates: Record<string, (data: Record<string, string>) => { subject: string; html: string }> = {
  new_message: (data) => ({
    subject: `New message: ${escapeHtml(data.subject) || 'Update from James Roman Advisory'}`,
    html: baseTemplate(`
      <h2>New Message</h2>
      <p>Hello ${escapeHtml(data.recipientName)},</p>
      <p>You have a new secure message from ${escapeHtml(data.senderName) || 'your advisory team'}.</p>
      <div class="highlight">
        <div class="label">Subject</div>
        <p>${escapeHtml(data.subject)}</p>
      </div>
      ${data.preview ? `<p style="color: #888; font-style: italic;">"${escapeHtml(data.preview)}…"</p>` : ''}
      <a href="${SITE_URL}/portal/messages" class="btn">View Message</a>
    `),
  }),

  invoice_sent: (data) => ({
    subject: `Invoice ${escapeHtml(data.invoiceNumber)} — ${escapeHtml(data.amount)}`,
    html: baseTemplate(`
      <h2>Invoice Ready</h2>
      <p>Hello ${escapeHtml(data.recipientName)},</p>
      <p>A new invoice has been prepared for your review.</p>
      <div class="highlight">
        <div class="label">Invoice ${escapeHtml(data.invoiceNumber)}</div>
        <p style="font-size: 24px; color: #ffffff; margin-bottom: 8px;">${escapeHtml(data.amount)}</p>
        <p style="color: #888;">${escapeHtml(data.description)}</p>
        ${data.dueDate ? `<p style="color: #c9a96e; margin-top: 8px;">Due: ${escapeHtml(data.dueDate)}</p>` : ''}
      </div>
      <a href="${SITE_URL}/portal/invoices" class="btn">View Invoice</a>
    `),
  }),

  document_uploaded: (data) => ({
    subject: `New document: ${escapeHtml(data.documentName)}`,
    html: baseTemplate(`
      <h2>Document Available</h2>
      <p>Hello ${escapeHtml(data.recipientName)},</p>
      <p>A new document has been uploaded to your secure vault.</p>
      <div class="highlight">
        <div class="label">${escapeHtml(data.category) || 'Document'}</div>
        <p>${escapeHtml(data.documentName)}</p>
      </div>
      <a href="${SITE_URL}/portal/documents" class="btn">View Documents</a>
    `),
  }),

  phase_change: (data) => ({
    subject: `Engagement update — Phase ${escapeHtml(data.newPhase)}`,
    html: baseTemplate(`
      <h2>Engagement Update</h2>
      <p>Hello ${escapeHtml(data.recipientName)},</p>
      <p>Your engagement has progressed to a new phase.</p>
      <div class="highlight">
        <div class="label">Phase Update</div>
        <p style="color: #888;">From: Phase ${escapeHtml(data.oldPhase)}</p>
        <p style="color: #ffffff; font-size: 18px;">Now: Phase ${escapeHtml(data.newPhase)}</p>
        ${data.phaseLabel ? `<p style="color: #c9a96e; margin-top: 8px;">${escapeHtml(data.phaseLabel)}</p>` : ''}
      </div>
      <a href="${SITE_URL}/portal/timeline" class="btn">View Timeline</a>
    `),
  }),

  welcome: (data) => ({
    subject: 'Welcome to Your Client Portal — James Roman Advisory',
    html: baseTemplate(`
      <h2>Welcome</h2>
      <p>Hello ${escapeHtml(data.recipientName)},</p>
      <p>Your secure client portal is now active. From here you can access documents, view your engagement timeline, and communicate directly with your advisory team.</p>
      <div class="highlight">
        <div class="label">Your Portal</div>
        <p>Login: ${escapeHtml(data.email)}</p>
        <p style="color: #888; margin-top: 4px;">Use the magic link sent to your email to sign in.</p>
      </div>
      <a href="${SITE_URL}/portal" class="btn">Access Portal</a>
    `),
  }),
};

/* ── Send Notification ── */

export async function sendNotification(payload: NotificationPayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const resend = getResend();
  if (!resend) {
    console.log('[notifications] RESEND_API_KEY not configured — skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  const template = templates[payload.type];
  if (!template) {
    return { success: false, error: `Unknown notification type: ${payload.type}` };
  }

  const { subject, html } = template({
    ...payload.data,
    recipientName: payload.recipientName,
  });

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: payload.recipientEmail,
      subject,
      html,
    });

    if (result.error) {
      console.error('[notifications] Resend error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`[notifications] Email sent: ${payload.type} → ${payload.recipientEmail} (${result.data?.id})`);
    return { success: true, messageId: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[notifications] Send failed:', message);
    return { success: false, error: message };
  }
}

/* ── In-App Notification ── */

export async function createInAppNotification(opts: {
  target: string; /* 'firm' or client_id */
  type: 'message' | 'document' | 'invoice' | 'signature' | 'phase' | 'system';
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return { success: false, error: 'Supabase not configured' };

    const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { error } = await sb.from('notifications').insert({
      target: opts.target,
      type: opts.type,
      title: opts.title,
      body: opts.body || null,
      link: opts.link || null,
      read: false,
      metadata: opts.metadata || null,
    });

    if (error) {
      /* If table doesn't exist yet, fail silently */
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return { success: false, error: 'notifications table not created yet' };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown' };
  }
}

/* ── Batch Send ── */

export async function sendNotifications(payloads: NotificationPayload[]): Promise<{
  sent: number;
  failed: number;
  results: { email: string; success: boolean; error?: string }[];
}> {
  const results = await Promise.all(
    payloads.map(async p => {
      const r = await sendNotification(p);
      return { email: p.recipientEmail, success: r.success, error: r.error };
    })
  );
  return {
    sent: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  };
}
