'use client';

/* ── SignatureRequestModal — admin sends a document for client signature ── */

import { useState, useCallback } from 'react';
import type { Client, Document as DBDocument } from '@/lib/database.types';

const CAT_LABELS: Record<string, string> = {
  nda: 'NDA', 'lab-results': 'Lab Results', proposals: 'Proposals',
  clearance: 'Clearance', invoices: 'Invoices', reports: 'Reports',
};

interface Props {
  open: boolean;
  document: DBDocument | null;
  client: Client | null;
  onClose: () => void;
  onSent: () => void;
}

export default function SignatureRequestModal({ open, document, client, onClose, onSent }: Props) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = useCallback(async () => {
    if (!document || !client) return;
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/signatures/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: document.id,
          client_id: document.client_id,
          signer_name: client.name,
          signer_email: client.email,
          message: message.trim() || `Please review and sign "${document.name}"`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onSent();
      onClose();
      setMessage('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send signature request');
    } finally {
      setSending(false);
    }
  }, [document, client, message, onSent, onClose]);

  if (!open || !document || !client) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        {/* Header */}
        <div className="admin-modal__header">
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.35em',
              color: 'var(--admin-accent)',
              opacity: 0.6,
              marginBottom: 8,
            }}>
              REQUEST E-SIGNATURE
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 24,
              fontWeight: 300,
              color: '#fff',
              margin: 0,
            }}>
              Sign Request
            </h2>
          </div>
          <button className="admin-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Document info */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(201,169,110,0.02)',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.2)',
            marginBottom: 8,
          }}>
            DOCUMENT
          </div>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 15,
            color: 'rgba(255,255,255,0.8)',
            marginBottom: 4,
          }}>
            {document.name}
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.1em',
            color: 'var(--admin-text-dim)',
          }}>
            {CAT_LABELS[document.category] || document.category} · {document.status.toUpperCase()}
          </div>
        </div>

        {/* Signer info */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.2)',
            marginBottom: 8,
          }}>
            SIGNER
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.2)',
                minWidth: 50,
              }}>NAME</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                {client.name}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.2)',
                minWidth: 50,
              }}>EMAIL</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                {client.email}
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        <div style={{ padding: '20px 28px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.2)',
            marginBottom: 8,
          }}>
            MESSAGE (OPTIONAL)
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Please review and sign "${document.name}"`}
            rows={3}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.7)',
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              padding: '12px 14px',
              resize: 'vertical',
              outline: 'none',
              lineHeight: 1.5,
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(201,169,110,0.3)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; }}
          />
        </div>

        {error && (
          <div style={{
            padding: '0 28px 12px',
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          padding: '16px 28px 24px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <button
            onClick={onClose}
            className="admin-btn admin-btn--ghost"
            style={{ fontSize: 11, padding: '10px 20px' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="admin-btn admin-btn--primary"
            style={{ fontSize: 11, padding: '10px 24px' }}
          >
            {sending ? 'Sending…' : '✍ Send for Signature'}
          </button>
        </div>
      </div>
    </div>
  );
}
