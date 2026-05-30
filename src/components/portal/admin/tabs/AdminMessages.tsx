'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Client, Engagement, Message } from '@/lib/database.types';
import ComposeMessage from '@/components/portal/admin/ComposeMessage';

interface Props {
  clients: Client[];
  engagements: Engagement[];
}

export default function AdminMessages({ clients, engagements }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [showCompose, setShowCompose] = useState(false);

  const loadMessages = useCallback(async (clientId?: string) => {
    try {
      const url = clientId ? `/api/messages/list?client_id=${clientId}` : '/api/messages/list';
      const res = await fetch(url);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadMessages(clientFilter !== 'all' ? clientFilter : undefined);
  }, [loadMessages, clientFilter]);

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-header__eyebrow">ADMINISTRATION</div>
          <h1 className="admin-header__title">Messages</h1>
          <p className="admin-header__subtitle">Client communications</p>
        </div>
        <button onClick={() => setShowCompose(true)} className="admin-btn admin-btn--primary">+ New Message</button>
      </div>

      {/* Client filter pills */}
      <div className="admin-filters">
        <button
          className={`admin-filter-pill ${clientFilter === 'all' ? 'admin-filter-pill--active' : ''}`}
          onClick={() => setClientFilter('all')}
        >
          All
        </button>
        {clients.map(c => (
          <button
            key={c.id}
            className={`admin-filter-pill ${clientFilter === c.id ? 'admin-filter-pill--active' : ''}`}
            onClick={() => setClientFilter(c.id)}
          >
            {c.name.split(' ').slice(-1)[0]}
          </button>
        ))}
      </div>

      {/* Messages table */}
      <div className="admin-card" style={{ overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Subject</th>
              <th>From</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 && (
              <tr><td colSpan={5} className="admin-empty">No messages{clientFilter !== 'all' ? ' for this client' : ''}</td></tr>
            )}
            {messages.map(msg => {
              const client = clients.find(c => c.id === msg.client_id);
              return (
                <tr key={msg.id}>
                  <td>{client?.name || '—'}</td>
                  <td style={{ fontWeight: msg.read ? 400 : 600, color: '#fff' }}>{msg.subject}</td>
                  <td style={{ color: msg.sender_type === 'firm' ? 'var(--admin-accent)' : 'rgba(255,255,255,0.5)' }}>
                    {msg.sender_type === 'firm' ? 'The Firm' : client?.name || 'Client'}
                  </td>
                  <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                    {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td>
                    <span className={`admin-badge ${msg.read ? 'admin-badge--completed' : 'admin-badge--pending'}`}>
                      {msg.read ? 'Read' : 'Unread'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCompose && (
        <ComposeMessage
          clients={clients}
          engagements={engagements}
          preselectedClientId={clientFilter !== 'all' ? clientFilter : undefined}
          onClose={() => setShowCompose(false)}
          onSent={() => { setShowCompose(false); loadMessages(clientFilter !== 'all' ? clientFilter : undefined); }}
        />
      )}
    </>
  );
}
