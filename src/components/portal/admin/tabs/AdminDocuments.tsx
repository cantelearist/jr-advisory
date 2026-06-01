'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Client, Engagement, Document as DBDocument } from '@/lib/database.types';
import DocumentUpload from '@/components/portal/admin/DocumentUpload';

const CAT_LABELS: Record<string, string> = {
  nda: 'NDAs', 'lab-results': 'Lab Results', proposals: 'Proposals',
  clearance: 'Clearance', invoices: 'Invoices', reports: 'Reports',
};

const CAT_FILTERS = ['all', 'nda', 'lab-results', 'proposals', 'clearance', 'invoices', 'reports'] as const;

interface Props {
  clients: Client[];
  engagements: Engagement[];
  documents: DBDocument[];
  onReload: () => void;
}

export default function AdminDocuments({ clients, engagements, documents, onReload }: Props) {
  const [showUpload, setShowUpload] = useState(false);
  const [catFilter, setCatFilter] = useState<typeof CAT_FILTERS[number]>('all');
  const [search, setSearch] = useState('');
  const [requestingSigFor, setRequestingSigFor] = useState<string | null>(null);

  const handleRequestSignature = useCallback(async (doc: DBDocument) => {
    const client = clients.find(c => c.id === doc.client_id);
    if (!client) { alert('Client not found'); return; }

    const message = prompt(`Optional message for ${client.name} about "${doc.name}":`);
    if (message === null) return; // cancelled

    setRequestingSigFor(doc.id);
    try {
      const res = await fetch('/api/signatures/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: doc.id,
          client_id: doc.client_id,
          signer_name: client.name,
          signer_email: client.email,
          message: message || `Please review and sign "${doc.name}"`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onReload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to create signature request');
    } finally {
      setRequestingSigFor(null);
    }
  }, [clients, onReload]);

  const filtered = useMemo(() => {
    let result = documents;

    if (catFilter !== 'all') {
      result = result.filter(d => d.category === catFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(d => {
        const client = clients.find(c => c.id === d.client_id);
        return (
          d.name.toLowerCase().includes(q) ||
          (client?.name.toLowerCase().includes(q) ?? false)
        );
      });
    }

    return result;
  }, [documents, catFilter, search, clients]);

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-header__eyebrow">ADMINISTRATION</div>
          <h1 className="admin-header__title">Document Vault</h1>
          <p className="admin-header__subtitle">{documents.length} documents stored</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="admin-btn admin-btn--primary">+ Upload Document</button>
      </div>

      {/* Category stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
        {Object.entries(CAT_LABELS).map(([cat, label]) => {
          const count = documents.filter(d => d.category === cat).length;
          return (
            <div
              key={cat}
              className={`admin-kpi admin-kpi--clickable ${catFilter === cat ? 'admin-kpi--selected' : ''}`}
              style={{ textAlign: 'center', padding: '16px 12px', cursor: 'pointer' }}
              onClick={() => setCatFilter(catFilter === cat ? 'all' : cat as typeof CAT_FILTERS[number])}
            >
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: 'var(--admin-accent)' }}>{count}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: 'var(--admin-text-dim)', marginTop: 4 }}>{label}</div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="admin-toolbar">
        <div className="admin-search">
          <span className="admin-search__icon">⌕</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="admin-search__input"
          />
          {search && (
            <button className="admin-search__clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        {catFilter !== 'all' && (
          <button
            className="admin-btn admin-btn--ghost"
            onClick={() => setCatFilter('all')}
            style={{ fontSize: 10, padding: '6px 14px' }}
          >
            ✕ Clear filter: {CAT_LABELS[catFilter]}
          </button>
        )}
      </div>

      {/* Document table */}
      <div className="admin-card" style={{ overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Client</th>
              <th>Category</th>
              <th>Status</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="admin-empty">
                {search ? `No documents matching "${search}"` : documents.length === 0 ? 'No documents yet — upload your first file above' : 'No documents in this category'}
              </td></tr>
            ) : filtered.map(doc => {
              const client = clients.find(c => c.id === doc.client_id);
              const catLabel = CAT_LABELS[doc.category] || doc.category;
              const hasFile = !!doc.file_path;
              return (
                <tr key={doc.id}>
                  <td>
                    {hasFile && <span style={{ color: 'var(--admin-green)', marginRight: 8, fontSize: 10 }}>●</span>}
                    {doc.name}
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.4)' }}>{client?.name || '—'}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.08em', color: 'var(--admin-text-dim)' }}>
                    {catLabel}
                  </td>
                  <td>
                    <span className="admin-badge" style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: doc.status === 'final' ? 'rgba(255,255,255,0.4)' : 'var(--admin-accent)',
                    }}>{doc.status.toUpperCase()}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {/* Request Signature */}
                      {(doc.category === 'nda' || doc.category === 'proposals' || doc.category === 'clearance') && doc.status !== 'final' && (
                        <button
                          onClick={() => handleRequestSignature(doc)}
                          disabled={requestingSigFor === doc.id}
                          className="admin-btn admin-btn--ghost"
                          style={{
                            fontSize: 9, padding: '4px 12px',
                            color: 'var(--admin-accent)',
                            borderColor: 'rgba(201,169,110,0.15)',
                          }}
                        >
                          {requestingSigFor === doc.id ? '…' : '✍ SIGN'}
                        </button>
                      )}
                      {hasFile && (
                        <button
                          onClick={async () => {
                            const res = await fetch(`/api/documents/download?id=${doc.id}`);
                            const data = await res.json();
                            if (data.url) window.open(data.url, '_blank');
                          }}
                          className="admin-btn admin-btn--ghost"
                          style={{ fontSize: 9, padding: '4px 12px' }}
                        >
                          DOWNLOAD
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete "${doc.name}"?`)) return;
                          await fetch(`/api/documents/delete?id=${doc.id}`, { method: 'DELETE' });
                          onReload();
                        }}
                        className="admin-btn admin-btn--danger"
                        style={{ fontSize: 9, padding: '4px 12px' }}
                      >
                        DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showUpload && (
        <DocumentUpload
          clients={clients}
          engagements={engagements}
          onUploadComplete={onReload}
          onClose={() => setShowUpload(false)}
        />
      )}
    </>
  );
}
