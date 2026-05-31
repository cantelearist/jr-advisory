'use client';

import type { AuditLogEntry } from '@/lib/database.types';

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  client_created:      { label: 'Client Created',      color: '#4ade80', icon: '◉' },
  client_updated:      { label: 'Client Updated',      color: '#60a5fa', icon: '◉' },
  client_deleted:      { label: 'Client Deleted',      color: '#ef4444', icon: '◉' },
  engagement_created:  { label: 'Engagement Created',  color: '#4ade80', icon: '◈' },
  engagement_updated:  { label: 'Engagement Updated',  color: '#60a5fa', icon: '◈' },
  invoice_created:     { label: 'Invoice Created',     color: '#4ade80', icon: '▦' },
  invoice_updated:     { label: 'Invoice Updated',     color: '#60a5fa', icon: '▦' },
  message_sent:        { label: 'Message Sent',        color: '#c9a96e', icon: '✉' },
  document_uploaded:   { label: 'Document Uploaded',   color: '#a78bfa', icon: '▤' },
  document_downloaded: { label: 'Document Downloaded', color: '#818cf8', icon: '▤' },
  payment_received:    { label: 'Payment Received',    color: '#4ade80', icon: '$' },
  nda_signed:          { label: 'NDA Signed',          color: '#c9a96e', icon: '✎' },
  phase_change:        { label: 'Phase Changed',       color: '#f59e0b', icon: '▸' },
  login:               { label: 'Login',               color: '#60a5fa', icon: '→' },
  seed_reset:          { label: 'Data Reset',          color: '#ef4444', icon: '⟲' },
};

interface Props {
  auditLog: AuditLogEntry[];
}

export default function AdminActivity({ auditLog }: Props) {
  // Top action type breakdown
  const actionCounts = auditLog.reduce((acc, e) => {
    acc[e.action] = (acc[e.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-header__eyebrow">ADMINISTRATION</div>
          <h1 className="admin-header__title">Audit Log</h1>
          <p className="admin-header__subtitle">{auditLog.length} events recorded</p>
        </div>
      </div>

      {/* Action breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
        {Object.entries(actionCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([action, count]) => {
            const info = ACTION_LABELS[action] || { label: action, color: '#888', icon: '•' };
            return (
              <div key={action} className="admin-kpi" style={{ textAlign: 'center', padding: '14px 16px' }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: info.color }}>{count}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.12em', color: 'var(--admin-text-dim)', marginTop: 4 }}>
                  {info.label.toUpperCase()}
                </div>
              </div>
            );
          })}
      </div>

      {/* Log entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {auditLog.length === 0 && <div className="admin-empty">No audit events recorded yet</div>}
        {auditLog.map((entry, i) => {
          const info = ACTION_LABELS[entry.action] || { label: entry.action, color: '#888', icon: '•' };
          const meta = entry.metadata as Record<string, string> | null;
          const ts = new Date(entry.created_at);
          const timeStr = ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
            ' · ' + ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          return (
            <div
              key={entry.id || i}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr auto',
                gap: 12,
                alignItems: 'start',
                padding: '12px 16px',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                borderRadius: 6,
              }}
            >
              <span style={{ color: info.color, fontSize: 14, textAlign: 'center', lineHeight: '20px' }}>
                {info.icon}
              </span>
              <div>
                <span style={{ fontSize: 13, color: info.color, fontWeight: 500 }}>
                  {info.label}
                </span>
                {meta && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 10 }}>
                    {meta.client_name || meta.name || meta.subject || (meta.client_id ? `Client ${String(meta.client_id).slice(0, 8)}…` : '')}
                  </span>
                )}
                {entry.entity_id && (
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.15)', margin: '2px 0 0' }}>
                    {entry.entity_type}:{entry.entity_id.slice(0, 8)}
                  </p>
                )}
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                {timeStr}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
