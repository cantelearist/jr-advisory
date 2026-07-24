'use client';

import { useState, useMemo, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, Engagement } from '@/lib/database.types';

const STATUS_COLORS: Record<string, string> = {
  active: '#00c875',
  pending: '#fdab3d',
  completed: '#579bfc',
  archived: '#9296a1',
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

  const groups = [
    {
      id: 'active',
      label: 'Active clients',
      color: '#579bfc',
      clients: filtered.filter(client => client.status === 'active'),
    },
    {
      id: 'onboarding',
      label: 'Onboarding',
      color: '#fdab3d',
      clients: filtered.filter(client => client.status === 'pending'),
    },
    {
      id: 'closed',
      label: 'Completed & archived',
      color: '#a25ddc',
      clients: filtered.filter(client => client.status === 'completed' || client.status === 'archived'),
    },
  ].filter(group => group.clients.length > 0);

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
          {filtered.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={6} className="admin-empty">
                  {search ? `No clients matching "${search}"` : 'No clients in this category'}
                </td>
              </tr>
            </tbody>
          ) : groups.map(group => (
            <tbody key={group.id} className="admin-board-group" style={{ '--group-color': group.color } as CSSProperties}>
              <tr className="admin-board-group__header">
                <td colSpan={6}>
                  <span className="admin-board-group__chevron">⌄</span>
                  <strong>{group.label}</strong>
                  <span>{group.clients.length} item{group.clients.length === 1 ? '' : 's'}</span>
                </td>
              </tr>
              {group.clients.map(client => {
              const eng = engagements.find(e => e.client_id === client.id);
              const sc = STATUS_COLORS[client.status] || '#9296a1';
              return (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/portal/admin/clients/${client.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: 14 }}>{client.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>{client.property}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, color: 'var(--admin-text)' }}>{eng ? eng.type : '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>{eng ? `Phase ${eng.phase}` : '—'}</div>
                  </td>
                  <td style={{ color: 'var(--admin-text-muted)' }}>{client.area}</td>
                  <td>
                    <span className="admin-badge" style={{
                      background: sc,
                      color: '#fff',
                      border: `1px solid ${sc}`,
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
          ))}
        </table>
      </div>
    </>
  );
}
