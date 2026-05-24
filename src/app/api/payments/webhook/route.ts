/* ── Stripe Webhook — handles checkout.session.completed ── */
/* POST /api/payments/webhook */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Dev mode: parse directly (no signature verification)
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (e: unknown) {
    console.error('Webhook signature verification failed:', e);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoice_id || session.client_reference_id;

    if (!invoiceId) {
      console.error('No invoice_id in session metadata');
      return NextResponse.json({ error: 'No invoice reference' }, { status: 400 });
    }

    // Mark invoice as paid
    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { error: updateErr } = await sb
      .from('invoices')
      .update({
        status: 'paid',
        paid_date: now,
        stripe_payment_id: session.payment_intent as string,
        stripe_session_id: session.id,
      })
      .eq('id', invoiceId);

    if (updateErr) {
      console.error('Failed to update invoice:', updateErr);
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }

    // Audit log
    await sb.from('audit_log').insert({
      action: 'payment_received',
      entity_type: 'invoice',
      entity_id: invoiceId,
      details: {
        invoice_number: session.metadata?.invoice_number,
        amount: (session.amount_total || 0) / 100,
        payment_intent: session.payment_intent,
        customer_email: session.customer_email,
      },
    }).then(() => {});

    // Create timeline event
    await sb.from('timeline_events').insert({
      engagement_id: session.metadata?.engagement_id,
      event_type: 'payment',
      title: `Payment Received — ${session.metadata?.invoice_number}`,
      description: `$${((session.amount_total || 0) / 100).toLocaleString()} paid via online checkout`,
      event_date: now,
    }).then(() => {});

    console.log(`✅ Invoice ${invoiceId} marked as paid`);
  }

  return NextResponse.json({ received: true });
}
