'use client';

/* ── Payment Success Page — post-Stripe checkout redirect ── */

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import PortalNav from '@/components/portal/PortalNav';

const Scene3D = dynamic(() => import('@/components/portal/Scene3D'), { ssr: false });

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get('session_id') || '';
  const [state, setState] = useState<'checking' | 'confirmed' | 'pending' | 'error'>('checking');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setState('error');
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const verify = async () => {
      attempts += 1;
      try {
        const response = await fetch(`/api/payments/status?session_id=${encodeURIComponent(sessionId)}`, {
          cache: 'no-store',
        });
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setState('error');
          return;
        }

        setInvoiceNumber(data.invoice?.invoice_number || '');
        if (data.confirmed) {
          setState('confirmed');
          return;
        }

        setState('pending');
        if (attempts < 10) {
          timer = setTimeout(verify, 1_500);
        }
      } catch {
        if (!cancelled) setState('error');
      }
    };

    verify();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId]);

  const confirmed = state === 'confirmed';
  const pending = state === 'checking' || state === 'pending';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.3 }}><Scene3D /></div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <PortalNav />

        <div style={{
          maxWidth: 600, margin: '0 auto', padding: '120px 24px', textAlign: 'center',
        }}>
          {/* Success icon */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: confirmed ? 'rgba(74,222,128,0.1)' : 'rgba(201,169,110,0.1)',
            border: `2px solid ${confirmed ? 'rgba(74,222,128,0.3)' : 'rgba(201,169,110,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 32px', fontSize: 36, color: confirmed ? '#4ade80' : '#c9a96e',
          }}>
            {confirmed ? '✓' : pending ? '…' : '!'}
          </div>

          <h1 style={{
            fontSize: 32, fontWeight: 300, color: '#fff', margin: '0 0 12px',
            fontFamily: "'Cormorant Garamond', serif", letterSpacing: 2,
          }}>
            {confirmed ? 'PAYMENT CONFIRMED' : pending ? 'CONFIRMING PAYMENT' : 'CONFIRMATION DELAYED'}
          </h1>

          {invoiceNumber && (
            <p style={{ color: '#c9a96e', fontSize: 15, margin: '0 0 8px' }}>
              Invoice {invoiceNumber}
            </p>
          )}

          <p style={{
            color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.7,
            maxWidth: 420, margin: '0 auto 40px',
          }}>
            {confirmed
              ? 'Your payment has been verified and the invoice is marked paid.'
              : pending
                ? 'Stripe is processing the payment confirmation. This page will update automatically.'
                : 'We could not verify this payment session. Check the invoice status before attempting another payment.'}
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link href="/portal/invoices" style={{
              padding: '12px 28px', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)', fontSize: 14, textDecoration: 'none',
            }}>
              View Invoices
            </Link>
            <Link href="/portal/dashboard" style={{
              padding: '12px 28px', borderRadius: 8,
              background: '#c9a96e', border: 'none',
              color: '#0a0a0a', fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading…</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
