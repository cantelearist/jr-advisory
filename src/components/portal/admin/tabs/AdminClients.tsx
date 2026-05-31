'use client';

import { useRouter } from 'next/navigation';
import type { Client, Engagement } from '@/lib/database.types';

const STATUS_COLORS: Record<string, string> = {
  active: '#4ade80',
  pending: '#c9a96e',
  completed: 'rgba(255,255,255,0.4)',
  archived: 'rgba(255,255,255,0.2)',
};

interface Props {
  clients: Client[];
  engagements: Engagement[];
  inviteStatus: Record<string, string>;
  onInvite: (clientId: string) => void;
  onNewClient: () => void;
}

export default function AdminClients({ clients, engagements, inviteStatus, onInvite, onNewClient }: Props) {
  const router = useRouter();

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

      <div className="admin-card" style={{ overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Engagement</th>
              <th>Area</th>
              <th>Status</th>
              <th>Access</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => {
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
