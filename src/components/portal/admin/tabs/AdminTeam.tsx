'use client';

import { useState, useMemo } from 'react';

interface TeamUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface Props {
  users: TeamUser[];
}

const ROLE_ORDER = ['admin', 'manager', 'contractor', 'client'];

export default function AdminTeam({ users }: Props) {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: users.length };
    ROLE_ORDER.forEach(r => { c[r] = users.filter(u => u.role === r).length; });
    return c;
  }, [users]);

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return list.sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
  }, [users, roleFilter, search]);

  return (
    <>
      {/* Role filter cards */}
      <div className="romer-team-grid">
        {[{ key: 'all', label: 'All Users' }, ...ROLE_ORDER.map(r => ({ key: r, label: r.charAt(0).toUpperCase() + r.slice(1) + 's' }))].map(f => (
          <div
            key={f.key}
            className={`romer-role-card ${roleFilter === f.key ? 'romer-role-card--active' : ''}`}
            onClick={() => setRoleFilter(f.key)}
          >
            <div className="romer-role-card__count">{counts[f.key] || 0}</div>
            <div className="romer-role-card__label">{f.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="admin-toolbar">
        <div className="admin-search">
          <span className="admin-search__icon">⌕</span>
          <input
            className="admin-search__input"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="admin-search__clear" onClick={() => setSearch('')}>✕</button>}
        </div>
        <span className="admin-results-count">{filtered.length} USERS</span>
      </div>

      {/* Table */}
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{u.full_name}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{u.email}</td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span className={`romer-status-dot romer-status-dot--${u.role}`} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {u.role}
                    </span>
                  </span>
                </td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--admin-text-dim)' }}>
                  {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--admin-text-dim)', padding: 40 }}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
