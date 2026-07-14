/* ── Stripe Webhook — handles checkout.session.completed ── */
/* POST /api/payments/webhook */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key);
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 503 });
  }

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e: unknown) {
    console.error('Webhook signature verification failed:', e);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoice_id || session.client_reference_id;

    if (!invoiceId) {
      console.error('No invoice_id in session metadata');
      return NextResponse.json({ error: 'No invoice reference' }, { status: 400 });
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true, ignored: 'payment_not_paid' });
    }

    const { data: invoice, error: invoiceError } = await sb
      .from('invoices')
      .select('id, client_id, engagement_id, invoice_number, amount, status, stripe_session_id, stripe_payment_id')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Webhook invoice lookup failed:', invoiceError);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
    const expectedAmount = Math.round(Number(invoice.amount) * 100);
    const sessionMatchesInvoice =
      session.metadata?.invoice_id === invoice.id &&
      session.client_reference_id === invoice.id &&
      session.metadata?.client_id === invoice.client_id &&
      session.metadata?.engagement_id === invoice.engagement_id &&
      invoice.stripe_session_id === session.id &&
      session.currency?.toLowerCase() === 'usd' &&
      session.amount_total === expectedAmount &&
      Boolean(paymentIntentId);

    if (!sessionMatchesInvoice) {
      console.error('Webhook session did not match invoice', {
        eventId: event.id,
        invoiceId,
        sessionId: session.id,
      });
      return NextResponse.json({ error: 'Payment does not match invoice' }, { status: 400 });
    }

    // Stripe can retry the same signed event. Do not duplicate side effects.
    if (invoice.status === 'paid') {
      if (
        invoice.stripe_session_id === session.id &&
        (!invoice.stripe_payment_id || invoice.stripe_payment_id === paymentIntentId)
      ) {
        return NextResponse.json({ received: true, duplicate: true });
      }
      return NextResponse.json({ error: 'Invoice payment conflict' }, { status: 409 });
    }

    if (invoice.status !== 'sent' && invoice.status !== 'overdue') {
      return NextResponse.json({ error: 'Invoice is not payable' }, { status: 409 });
    }

    // Mark invoice as paid only if its state and checkout session are unchanged.
    const now = new Date().toISOString().split('T')[0];
    const { data: paidInvoice, error: updateErr } = await sb
      .from('invoices')
      .update({
        status: 'paid',
        paid_date: now,
        stripe_payment_id: paymentIntentId,
        stripe_session_id: session.id,
      })
      .eq('id', invoiceId)
      .eq('status', invoice.status)
      .eq('stripe_session_id', session.id)
      .select('id')
      .single();

    if (updateErr || !paidInvoice) {
      console.error('Failed to update invoice:', updateErr);
      return NextResponse.json({ error: 'Invoice state changed' }, { status: 409 });
    }

    // Audit log
    await sb.from('audit_log').insert({
      action: 'payment_received',
      entity_type: 'invoice',
      entity_id: invoiceId,
      metadata: {
        stripe_event_id: event.id,
        invoice_number: invoice.invoice_number,
        amount: (session.amount_total || 0) / 100,
        payment_intent: paymentIntentId,
        customer_email: session.customer_email,
      },
    }).then(() => {});

    // Create timeline event (only if we can resolve the engagement)
    const engagementId = invoice.engagement_id;
    if (engagementId) {
      const { data: eng } = await sb
        .from('engagements')
        .select('phase')
        .eq('id', engagementId)
        .single();

      if (eng) {
        await sb.from('timeline_events').insert({
          engagement_id: engagementId,
          phase: eng.phase,
          event_type: 'payment',
          title: `Payment Received — ${invoice.invoice_number}`,
          description: `$${((session.amount_total || 0) / 100).toLocaleString()} paid via online checkout`,
          event_date: now,
        }).then(() => {});
      }
    }

    // In-app notification for admin
    const { createInAppNotification } = await import('@/lib/notifications');
    await createInAppNotification({
      target: 'firm',
      type: 'invoice',
      title: `Payment received — ${invoice.invoice_number}`,
      body: `$${((session.amount_total || 0) / 100).toLocaleString()} from ${session.customer_email || 'client'}`,
      link: '/portal/invoices',
      metadata: { invoice_id: invoiceId, amount: (session.amount_total || 0) / 100 },
    });

    console.log(`Invoice ${invoiceId} marked as paid from Stripe event ${event.id}`);
  }

  return NextResponse.json({ received: true });
}
