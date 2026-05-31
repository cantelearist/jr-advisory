'use client';

import { useState, useMemo } from 'react';
import type { AuditLogEntry } from '@/lib/database.types';

const PAGE_SIZE = 20;

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
  const [page, setPage] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  // Distinct action types present in the log
  const actionTypes = useMemo(() => {
    const types = new Set(auditLog.map(e => e.action));
    return Array.from(types).sort();
  }, [auditLog]);

  // Filtered entries
  const filtered = useMemo(() => {
    let result = auditLog;

    if (actionFilter !== 'all') {
      result = result.filter(e => e.action === actionFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(e => new Date(e.created_at) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(e => new Date(e.created_at) <= to);
    }

    return result;
  }, [auditLog, actionFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Action breakdown (from filtered)
  const actionCounts = filtered.reduce((acc, e) => {
    acc[e.action] = (acc[e.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Reset page when filters change
  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(0);
  };

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-header__eyebrow">ADMINISTRATION</div>
          <h1 className="admin-header__title">Audit Log</h1>
          <p className="admin-header__subtitle">
            {filtered.length === auditLog.length
              ? `${auditLog.length} events recorded`
              : `${filtered.length} of ${auditLog.length} events`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-toolbar" style={{ flexWrap: 'wrap' }}>
        <div className="admin-date-range">
          <label className="admin-date-range__label">FROM</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => handleFilterChange(setDateFrom, e.target.value)}
            className="admin-date-range__input"
          />
          <label className="admin-date-range__label">TO</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => handleFilterChange(setDateTo, e.target.value)}
            className="admin-date-range__input"
          />
          {(dateFrom || dateTo) && (
            <button
              className="admin-btn admin-btn--ghost"
              style={{ fontSize: 9, padding: '4px 10px' }}
              onClick={() => { setDateFrom(''); setDateTo(''); setPage(0); }}
            >
              CLEAR
            </button>
          )}
        </div>
        <select
          value={actionFilter}
          onChange={e => handleFilterChange(setActionFilter, e.target.value)}
          className="admin-select"
          style={{ minWidth: 180 }}
        >
          <option value="all">All Actions</option>
          {actionTypes.map(a => {
            const info = ACTION_LABELS[a];
            return (
              <option key={a} value={a}>
                {info ? info.label : a} ({actionCounts[a] || 0})
              </option>
            );
          })}
        </select>
      </div>

      {/* Action breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
        {Object.entries(actionCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([action, count]) => {
            const info = ACTION_LABELS[action] || { label: action, color: '#888', icon: '•' };
            return (
              <div
                key={action}
                className={`admin-kpi admin-kpi--clickable ${actionFilter === action ? 'admin-kpi--selected' : ''}`}
                style={{ textAlign: 'center', padding: '14px 16px', cursor: 'pointer' }}
                onClick={() => handleFilterChange(setActionFilter, actionFilter === action ? 'all' : action)}
              >
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
        {pageEntries.length === 0 && (
          <div className="admin-empty">
            {filtered.length === 0 && auditLog.length > 0
              ? 'No events match your filters'
              : 'No audit events recorded yet'}
          </div>
        )}
        {pageEntries.map((entry, i) => {
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
                background: (page * PAGE_SIZE + i) % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="admin-pagination__btn"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            ← Prev
          </button>
          <div className="admin-pagination__pages">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`admin-pagination__page ${page === i ? 'admin-pagination__page--active' : ''}`}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            )).slice(
              Math.max(0, page - 2),
              Math.min(totalPages, page + 3)
            )}
            {page + 3 < totalPages && <span className="admin-pagination__ellipsis">…</span>}
          </div>
          <button
            className="admin-pagination__btn"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Next →
          </button>
          <span className="admin-pagination__info">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
        </div>
      )}
    </>
  );
}
