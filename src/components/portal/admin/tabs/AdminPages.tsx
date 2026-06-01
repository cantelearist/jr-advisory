'use client';

import { useState, useEffect } from 'react';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

interface AdminPagesProps {
  onEditPage: (pageId: string) => void;
}

export default function AdminPages({ onEditPage }: AdminPagesProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [error, setError] = useState('');

  const loadPages = async () => {
    try {
      const res = await fetch('/api/pages');
      const data = await res.json();
      setPages(data.pages || []);
    } catch {
      /* skip */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPages(); }, []);

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    setNewSlug(val.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'));
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setError('');

    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), slug: newSlug.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create page');
        return;
      }
      setPages(prev => [...prev, data.page]);
      setNewTitle('');
      setNewSlug('');
      setCreating(false);
      // Open the editor immediately
      onEditPage(data.page.id);
    } catch {
      setError('Failed to create page');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      await fetch(`/api/pages/${id}`, { method: 'DELETE' });
      setPages(prev => prev.filter(p => p.id !== id));
    } catch {
      /* skip */
    }
  };

  const handleDuplicate = async (page: Page) => {
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${page.title} (Copy)`,
          slug: `${page.slug}-copy-${Date.now().toString(36)}`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Copy content from original
        const origRes = await fetch(`/api/pages/${page.id}`);
        const origData = await origRes.json();
        if (origData.page) {
          await fetch(`/api/pages/${data.page.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              html: origData.page.html,
              css: origData.page.css,
              components: origData.page.components,
              styles: origData.page.styles,
            }),
          });
        }
        await loadPages();
      }
    } catch {
      /* skip */
    }
  };

  const handleToggleStatus = async (page: Page) => {
    const newStatus = page.status === 'published' ? 'draft' : 'published';
    try {
      await fetch(`/api/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setPages(prev => prev.map(p => p.id === page.id ? { ...p, status: newStatus } : p));
    } catch {
      /* skip */
    }
  };

  const published = pages.filter(p => p.status === 'published').length;

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-header__eyebrow">SYSTEM</div>
          <h1 className="admin-header__title">Page Builder</h1>
          <p className="admin-header__subtitle">
            Create and edit pages visually with drag-and-drop. Like Wix, but yours.
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="admin-kpi-strip" style={{ marginBottom: 32 }}>
        <div className="admin-kpi">
          <div className="admin-kpi__value">{pages.length}</div>
          <div className="admin-kpi__label">Total Pages</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi__value" style={{ color: '#4ade80' }}>{published}</div>
          <div className="admin-kpi__label">Published</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi__value" style={{ color: '#f59e0b' }}>{pages.length - published}</div>
          <div className="admin-kpi__label">Drafts</div>
        </div>
      </div>

      {/* Create new page */}
      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="admin-btn admin-btn--primary"
          style={{ marginBottom: 24 }}
        >
          + New Page
        </button>
      ) : (
        <div className="admin-card" style={{ marginBottom: 24, padding: 24 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{
                display: 'block',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)',
                marginBottom: 6,
              }}>Page Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="My New Page"
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#101218',
                  border: '1px solid rgba(201,169,110,0.12)',
                  borderRadius: 6,
                  color: '#ece6d6',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  outline: 'none',
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{
                display: 'block',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)',
                marginBottom: 6,
              }}>URL Slug</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>/p/</span>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="my-new-page"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: '#101218',
                    border: '1px solid rgba(201,169,110,0.12)',
                    borderRadius: 6,
                    color: '#ece6d6',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCreate} className="admin-btn admin-btn--primary">Create</button>
              <button onClick={() => { setCreating(false); setNewTitle(''); setNewSlug(''); setError(''); }} className="admin-btn">Cancel</button>
            </div>
          </div>
          {error && (
            <div style={{ marginTop: 10, color: '#ef4444', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Pages list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
          Loading pages...
        </div>
      ) : pages.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>✎</div>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>No pages yet</p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
            Click &quot;+ New Page&quot; to create your first visual page.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>URL</th>
                <th>Status</th>
                <th>Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map(page => (
                <tr key={page.id}>
                  <td>
                    <button
                      onClick={() => onEditPage(page.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ece6d6',
                        cursor: 'pointer',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        textAlign: 'left',
                        padding: 0,
                      }}
                    >
                      {page.title}
                    </button>
                  </td>
                  <td>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.3)',
                    }}>
                      /p/{page.slug}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleStatus(page)}
                      className={`admin-badge ${page.status === 'published' ? 'admin-badge--green' : 'admin-badge--gold'}`}
                      style={{ cursor: 'pointer', border: 'none', background: 'inherit' }}
                    >
                      {page.status}
                    </button>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                      {new Date(page.updated_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => onEditPage(page.id)}
                        className="admin-btn admin-btn--sm"
                        title="Edit in visual editor"
                      >
                        ✎ Edit
                      </button>
                      <button
                        onClick={() => handleDuplicate(page)}
                        className="admin-btn admin-btn--sm"
                        title="Duplicate page"
                      >
                        ⧉
                      </button>
                      {page.status === 'published' && (
                        <a
                          href={`/p/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-btn admin-btn--sm"
                          title="View live page"
                        >
                          ↗
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(page.id, page.title)}
                        className="admin-btn admin-btn--sm admin-btn--danger"
                        title="Delete page"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
