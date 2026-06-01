'use client';

/* ── AdminSignatures — dedicated admin tab for e-signature management ── */

import { useState, useMemo, useCallback } from 'react';
import type { Client, SignatureRequest } from '@/lib/database.types';

const STATUS_FILTERS = ['all', 'pending', 'signed', 'declined', 'expired'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const STATUS_LABELS: Record<string, string> = {
  pending: 'PENDING', signed: 'SIGNED', declined: 'DECLINED', expired: 'EXPIRED',
};

const CAT_LABELS: Record<string, string> = {
  nda: 'NDA', 'lab-results': 'Lab Results', proposals: 'Proposals',
  clearance: 'Clearance', invoices: 'Invoices', reports: 'Reports',
};

/* Extended type with joined data */
interface SignatureWithDetails extends SignatureRequest {
  documents?: { name: string; category: string } | null;
  clients?: { name: string; email: string; property: string } | null;
}

interface Props {
  signatures: SignatureWithDetails[];
  clients: Client[];
  onReload: () => void;
}

export default function AdminSignatures({ signatures, clients, onReload }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [certData, setCertData] = useState<Record<string, unknown> | null>(null);
  const [loadingCert, setLoadingCert] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);

  /* Status counts */
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: signatures.length };
    signatures.forEach(s => { c[s.status] = (c[s.status] || 0) + 1; });
    return c;
  }, [signatures]);

  /* Filter + search */
  const filtered = useMemo(() => {
    let result = signatures;
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => {
        const docName = s.documents?.name?.toLowerCase() || '';
        const signerName = s.signer_name.toLowerCase();
        const clientName = s.clients?.name?.toLowerCase() || '';
        return docName.includes(q) || signerName.includes(q) || clientName.includes(q);
      });
    }
    return result;
  }, [signatures, statusFilter, search]);

  /* Load certificate */
  const loadCertificate = useCallback(async (id: string) => {
    if (expandedId === id) { setExpandedId(null); setCertData(null); return; }
    setExpandedId(id);
    setLoadingCert(true);
    try {
      const res = await fetch(`/api/signatures/certificate?id=${id}`);
      const data = await res.json();
      setCertData(data.certificate || null);
    } catch {
      setCertData(null);
    } finally {
      setLoadingCert(false);
    }
  }, [expandedId]);

  /* Void/cancel a pending request */
  const handleVoid = useCallback(async (id: string) => {
    if (!confirm('Cancel this signature request? The client will no longer be able to sign.')) return;
    setVoidingId(id);
    try {
      const res = await fetch('/api/signatures/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_request_id: id, reason: 'Voided by admin' }),
      });
      if (!res.ok) throw new Error('Failed to void');
      onReload();
    } catch {
      alert('Failed to void signature request');
    } finally {
      setVoidingId(null);
    }
  }, [onReload]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'signed': return 'admin-badge--green';
      case 'pending': return 'admin-badge--gold';
      case 'declined': return 'admin-badge--red';
      case 'expired': return 'admin-badge--dim';
      default: return '';
    }
  };

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-header__eyebrow">ADMINISTRATION</div>
          <h1 className="admin-header__title">E-Signatures</h1>
          <p className="admin-header__subtitle">
            {signatures.length} total · {counts['pending'] || 0} awaiting signature
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 12,
        marginBottom: 28,
      }}>
        {(['pending', 'signed', 'declined', 'expired'] as const).map((status) => (
          <div
            key={status}
            className={`admin-kpi admin-kpi--clickable ${statusFilter === status ? 'admin-kpi--selected' : ''}`}
            style={{ textAlign: 'center', padding: '16px 12px', cursor: 'pointer' }}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
          >
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 28,
              color: status === 'pending' ? 'var(--admin-accent)' :
                     status === 'signed' ? 'var(--admin-green)' :
                     status === 'declined' ? '#ef4444' : 'var(--admin-text-dim)',
            }}>
              {counts[status] || 0}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.15em',
              color: 'var(--admin-text-dim)',
              marginTop: 4,
            }}>
              {STATUS_LABELS[status]}
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="admin-toolbar">
        <div className="admin-search">
          <span className="admin-search__icon">⌕</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by document, client, or signer…"
            className="admin-search__input"
          />
          {search && (
            <button className="admin-search__clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        {statusFilter !== 'all' && (
          <button
            className="admin-btn admin-btn--ghost"
            onClick={() => setStatusFilter('all')}
            style={{ fontSize: 10, padding: '6px 14px' }}
          >
            ✕ Clear: {STATUS_LABELS[statusFilter]}
          </button>
        )}
      </div>

      {/* Signature requests table */}
      <div className="admin-card" style={{ overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Client</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Completed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty">
                  {search ? `No signature requests matching "${search}"` :
                   signatures.length === 0 ? 'No signature requests yet — request one from the Documents tab' :
                   `No ${statusFilter} signature requests`}
                </td>
              </tr>
            ) : filtered.map((sig) => {
              const docName = sig.documents?.name || 'Unknown Document';
              const docCat = CAT_LABELS[sig.documents?.category || ''] || '';
              const clientName = sig.clients?.name || sig.signer_name;
              const isExpanded = expandedId === sig.id;

              return (
                <tr key={sig.id} className={isExpanded ? 'admin-table__row--expanded' : ''}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ color: 'rgba(255,255,255,0.8)' }}>{docName}</span>
                      {docCat && (
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10,
                          letterSpacing: '0.08em',
                          color: 'var(--admin-text-dim)',
                        }}>{docCat}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.5)' }}>{clientName}</td>
                  <td>
                    <span className={`admin-badge ${statusBadgeClass(sig.status)}`}>
                      {sig.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
                    {formatDate(sig.created_at)}
                  </td>
                  <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
                    {sig.signed_at ? formatDate(sig.signed_at) : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {/* View certificate / details */}
                      <button
                        onClick={() => loadCertificate(sig.id)}
                        className="admin-btn admin-btn--ghost"
                        style={{ fontSize: 9, padding: '4px 12px' }}
                      >
                        {isExpanded ? 'CLOSE' : '◎ DETAILS'}
                      </button>
                      {/* Void pending */}
                      {sig.status === 'pending' && (
                        <button
                          onClick={() => handleVoid(sig.id)}
                          disabled={voidingId === sig.id}
                          className="admin-btn admin-btn--danger"
                          style={{ fontSize: 9, padding: '4px 12px' }}
                        >
                          {voidingId === sig.id ? '…' : 'VOID'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded certificate view */}
      {expandedId && (
        <div className="admin-card" style={{
          marginTop: 16,
          padding: 0,
          overflow: 'hidden',
          animation: 'adminFadeIn 0.3s ease',
        }}>
          {loadingCert ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--admin-text-dim)' }}>
              Loading certificate…
            </div>
          ) : certData ? (
            <CertificateView data={certData} />
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: '#ef4444' }}>
              Failed to load certificate data
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ── Certificate View Sub-Component ── */
function CertificateView({ data }: { data: Record<string, unknown> }) {
  const doc = data.document as Record<string, string> | undefined;
  const signer = data.signer as Record<string, string> | undefined;
  const client = data.client as Record<string, string> | undefined;
  const auditTrail = data.audit_trail as Array<Record<string, unknown>> | undefined;
  const signatureData = data.signature_data as string | null;
  const status = data.status as string;

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Certificate header */}
      <div style={{
        padding: '24px 28px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.35em',
            color: 'var(--admin-accent)',
            opacity: 0.6,
          }}>
            {status === 'signed' ? 'SIGNATURE CERTIFICATE' : status === 'declined' ? 'DECLINE RECORD' : 'REQUEST DETAILS'}
          </div>
          <h3 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 22,
            fontWeight: 300,
            color: '#fff',
            margin: '8px 0 0',
          }}>
            {doc?.name || 'Unknown Document'}
          </h3>
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.1em',
          color: 'var(--admin-text-dim)',
          textAlign: 'right',
        }}>
          ID: {(data.id as string)?.slice(0, 8)}…
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* Signer details */}
        <div style={{
          padding: '20px 28px',
          borderRight: '1px solid rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.2)',
            marginBottom: 12,
          }}>
            SIGNER
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <InfoRow label="Name" value={signer?.name || '—'} />
            <InfoRow label="Email" value={signer?.email || '—'} />
            <InfoRow label="Client" value={client?.name || '—'} />
          </div>
        </div>

        {/* Timing details */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.2)',
            marginBottom: 12,
          }}>
            TIMESTAMPS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <InfoRow label="Requested" value={data.requested_at ? formatDateTime(data.requested_at as string) : '—'} />
            <InfoRow
              label={status === 'declined' ? 'Declined' : 'Signed'}
              value={data.signed_at ? formatDateTime(data.signed_at as string) : '—'}
            />
            <InfoRow label="IP Address" value={(data.ip_address as string) || '—'} />
          </div>
        </div>
      </div>

      {/* Signature image (for signed documents) */}
      {(status === 'signed' && signatureData && !signatureData.startsWith('DECLINED')) ? (
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(255,255,255,0.01)',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.2)',
            marginBottom: 12,
          }}>
            CAPTURED SIGNATURE
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: 16,
            display: 'flex',
            justifyContent: 'center',
          }}>
            <img
              src={signatureData}
              alt="Captured signature"
              style={{
                maxWidth: '100%',
                maxHeight: 150,
                filter: 'brightness(1.2)',
              }}
            />
          </div>
        </div>
      ) : null}

      {/* Decline reason */}
      {status === 'declined' && signatureData ? (
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(239,68,68,0.02)',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.2em',
            color: 'rgba(239,68,68,0.5)',
            marginBottom: 8,
          }}>
            REASON
          </div>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
            fontStyle: 'italic',
          }}>
            {signatureData.replace('DECLINED: ', '').replace('DECLINED', 'No reason provided')}
          </div>
        </div>
      ) : null}

      {/* Admin message */}
      {data.message ? (
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
            MESSAGE TO SIGNER
          </div>
          <div style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 15,
            color: 'rgba(255,255,255,0.4)',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}>
            {data.message as string}
          </div>
        </div>
      ) : null}

      {/* Audit trail */}
      {auditTrail && auditTrail.length > 0 ? (
        <div style={{ padding: '20px 28px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.2)',
            marginBottom: 12,
          }}>
            AUDIT TRAIL
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {auditTrail.map((entry, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.03)',
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: 'var(--admin-accent)',
                  opacity: 0.6,
                  flexShrink: 0,
                }}>
                  {entry.action === 'signature_requested' ? '→' :
                   entry.action === 'document_signed' ? '✓' :
                   entry.action === 'signature_declined' ? '✕' : '●'}
                </span>
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                  flex: 1,
                }}>
                  {(entry.action as string).replace(/_/g, ' ')}
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.15)',
                  flexShrink: 0,
                }}>
                  {entry.timestamp ? formatDateTime(entry.timestamp as string) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── Small helper ── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 10,
        letterSpacing: '0.12em',
        color: 'rgba(255,255,255,0.15)',
        minWidth: 60,
        textTransform: 'uppercase',
      }}>{label}</span>
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
      }}>{value}</span>
    </div>
  );
}
