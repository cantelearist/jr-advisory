'use client';

/* ── SignatureList — shows pending/completed signature requests ── */

import { useState, useEffect, useCallback } from 'react';
import SignatureModal, { type SignatureRequestItem } from './SignatureModal';
import './signature.css';

interface SignatureListProps {
  clientId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  nda: 'NDA',
  'lab-results': 'Lab Results',
  proposals: 'Proposals',
  clearance: 'Clearance',
  invoices: 'Invoices',
  reports: 'Reports',
};

export default function SignatureList({ clientId }: SignatureListProps) {
  const [requests, setRequests] = useState<SignatureRequestItem[]>([]);
  const [signing, setSigning] = useState<SignatureRequestItem | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const res = await fetch(`/api/signatures/list?client_id=${clientId}`);
      const data = await res.json();
      if (data.signatures) {
        const mapped: SignatureRequestItem[] = data.signatures.map(
          (s: Record<string, unknown>) => ({
            id: s.id,
            document_id: s.document_id,
            documentName: (s.documents as Record<string, string> | null)?.name || 'Document',
            documentCategory: CATEGORY_LABELS[(s.documents as Record<string, string> | null)?.category || ''] || 'Document',
            signer_name: s.signer_name,
            signer_email: s.signer_email,
            message: s.message,
            status: s.status,
            signed_at: s.signed_at as string | null,
            created_at: s.created_at as string,
          })
        );
        setRequests(mapped);
      }
    } catch {
      /* silent fail */
    } finally {
      setLoaded(true);
    }
  }, [clientId]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  if (!loaded || requests.length === 0) return null;

  const pending = requests.filter(r => r.status === 'pending');
  const completed = requests.filter(r => r.status === 'signed');
  const declined = requests.filter(r => r.status === 'declined');

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div style={{ marginBottom: 40 }}>
      {/* Pending signatures — attention-grabbing */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.35em',
              color: 'rgba(201,169,110,0.6)',
            }}>
              AWAITING YOUR SIGNATURE
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              background: 'rgba(201,169,110,0.1)',
              color: 'rgba(201,169,110,0.7)',
              padding: '2px 8px',
              border: '1px solid rgba(201,169,110,0.15)',
            }}>
              {pending.length}
            </span>
          </div>

          <div className="sig-list">
            {pending.map((r) => (
              <div
                key={r.id}
                className="sig-item"
                onClick={() => setSigning(r)}
              >
                <div className="sig-item__info">
                  <span className="sig-item__name">{r.documentName}</span>
                  <span className="sig-item__meta">
                    {r.documentCategory} · Requested {formatDate(r.created_at)}
                    {r.message && ` · "${r.message.slice(0, 50)}${r.message.length > 50 ? '…' : ''}"`}
                  </span>
                </div>
                <span className="sig-item__badge sig-item__badge--pending">
                  PENDING
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed signatures */}
      {completed.length > 0 && (
        <div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.15)',
            display: 'block',
            marginBottom: 12,
          }}>
            SIGNED
          </span>

          <div className="sig-list">
            {completed.map((r) => (
              <div key={r.id} className="sig-item" style={{ cursor: 'default', opacity: 0.6 }}>
                <div className="sig-item__info">
                  <span className="sig-item__name">{r.documentName}</span>
                  <span className="sig-item__meta">
                    {r.documentCategory} · Signed {r.signed_at ? formatDate(r.signed_at) : ''}
                  </span>
                </div>
                <span className="sig-item__badge sig-item__badge--signed">
                  SIGNED
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Declined signatures */}
      {declined.length > 0 && (
        <div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.35em',
            color: 'rgba(239,68,68,0.3)',
            display: 'block',
            marginBottom: 12,
          }}>
            DECLINED
          </span>

          <div className="sig-list">
            {declined.map((r) => (
              <div key={r.id} className="sig-item" style={{ cursor: 'default', opacity: 0.5 }}>
                <div className="sig-item__info">
                  <span className="sig-item__name">{r.documentName}</span>
                  <span className="sig-item__meta">
                    {r.documentCategory} · Declined {r.signed_at ? formatDate(r.signed_at) : ''}
                  </span>
                </div>
                <span className="sig-item__badge sig-item__badge--declined">
                  DECLINED
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signing modal */}
      {signing && (
        <SignatureModal
          request={signing}
          onClose={() => setSigning(null)}
          onSigned={loadRequests}
        />
      )}
    </div>
  );
}
