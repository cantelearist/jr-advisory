'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, Engagement } from '@/lib/database.types';

const STATUS_COLORS: Record<string, string> = {
  active: '#4ade80',
  pending: '#c9a96e',
  completed: 'rgba(255,255,255,0.4)',
  archived: 'rgba(255,255,255,0.2)',
};

const STATUS_FILTERS = ['all', 'active', 'pending', 'completed', 'archived'] as const;

interface Props {
  clients: Client[];
  engagements: Engagement[];
  inviteStatus: Record<string, string>;
  onInvite: (clientId: string) => void;
  onNewClient: () => void;
  onEditClient?: (client: Client) => void;
}

export default function AdminClients({ clients, engagements, inviteStatus, onInvite, onNewClient, onEditClient }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]>('all');

  const filtered = useMemo(() => {
    let result = clients;

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Search filter (name, email, property, area)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.property.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q)
      );
    }

    return result;
  }, [clients, search, statusFilter]);

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-header__eyebrow">ADMINISTRATION</div>
          <h1 className="admin-header__title">Clients</h1>
          <p className="admin-header__subtitle">{clients.length} total · {clients.filter(c => c.status === 'active').length} active</p>
        </div>
        <button onClick={onNewClient} className="admin-btn admin-btn--primary">+ New Client</button>
      </div>

      {/* Search + Filter Bar */}
      <div className="admin-toolbar">
        <div className="admin-search">
          <span className="admin-search__icon">⌕</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="admin-search__input"
          />
          {search && (
            <button className="admin-search__clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <div className="admin-filters">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              className={`admin-filter-pill ${statusFilter === s ? 'admin-filter-pill--active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && (
                <span className="admin-filter-pill__count">
                  {clients.filter(c => c.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {(search || statusFilter !== 'all') && (
        <div className="admin-results-count">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          {search && <> for &ldquo;{search}&rdquo;</>}
        </div>
      )}

      <div className="admin-card" style={{ overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Engagement</th>
              <th>Area</th>
              <th>Status</th>
              <th>Access</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty">
                  {search ? `No clients matching "${search}"` : 'No clients in this category'}
                </td>
              </tr>
            ) : filtered.map(client => {
              const eng = engagements.find(e => e.client_id === client.id);
              const sc = STATUS_COLORS[client.status] || 'rgba(255,255,255,0.4)';
              return (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/portal/admin/clients/${client.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>{client.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{client.property}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{eng ? eng.type : '—'}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{eng ? `Phase ${eng.phase}` : '—'}</div>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.4)' }}>{client.area}</td>
                  <td>
                    <span className="admin-badge" style={{
                      background: `${sc}15`,
                      color: sc,
                      border: `1px solid ${sc}30`,
                    }}>
                      {client.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {!client.profile_id ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onInvite(client.id); }}
                        className="admin-btn admin-btn--ghost"
                        style={{ fontSize: 9, letterSpacing: '0.1em', padding: '5px 10px' }}
                      >
                        {inviteStatus[client.id] || 'CREATE LOGIN'}
                      </button>
                    ) : (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--admin-green)', letterSpacing: '0.08em' }}>
                        HAS LOGIN
                      </span>
                    )}
                  </td>
                  <td>
                    {onEditClient && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditClient(client); }}
                        className="admin-btn admin-btn--ghost"
                        style={{ fontSize: 11, padding: '4px 8px', minWidth: 0 }}
                        title="Edit client"
                      >
                        ✎
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
