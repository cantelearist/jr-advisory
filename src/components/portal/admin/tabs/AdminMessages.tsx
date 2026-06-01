'use client';

/* ── Admin Messages — thread view with detail pane, reply, search, KPIs ── */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Client, Engagement, Message } from '@/lib/database.types';
import ComposeMessage from '@/components/portal/admin/ComposeMessage';

interface Props {
  clients: Client[];
  engagements: Engagement[];
}

/* ── helpers ── */

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

function threadKey(subject: string): string {
  return subject.replace(/^RE:\s*/i, '');
}

export default function AdminMessages({ clients, engagements }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  /* ── data loading ── */

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

  /* ── threading ── */

  const threads = useMemo(() => {
    const map: Record<string, Message[]> = {};
    for (const msg of messages) {
      const key = threadKey(msg.subject);
      if (!map[key]) map[key] = [];
      map[key].push(msg);
    }
    return map;
  }, [messages]);

  const sortedThreadKeys = useMemo(() => {
    let keys = Object.keys(threads).sort((a, b) => {
      const la = new Date(threads[a][0].created_at).getTime();
      const lb = new Date(threads[b][0].created_at).getTime();
      return lb - la;
    });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      keys = keys.filter(
        key =>
          key.toLowerCase().includes(q) ||
          threads[key].some(
            m =>
              m.body.toLowerCase().includes(q) ||
              m.sender_name.toLowerCase().includes(q)
          )
      );
    }
    return keys;
  }, [threads, searchQuery]);

  /* ── KPIs ── */

  const totalThreads = Object.keys(threads).length;
  const unreadCount = messages.filter(m => !m.read && m.sender_type === 'client').length;
  const sentToday = messages.filter(m => {
    const d = new Date(m.created_at);
    const now = new Date();
    return m.sender_type === 'firm' && d.toDateString() === now.toDateString();
  }).length;
  const clientMsgCount = messages.filter(m => m.sender_type === 'client').length;

  /* ── mark-read ── */

  const markThreadRead = useCallback(
    async (key: string) => {
      const threadMsgs = threads[key] || [];
      const unreadIds = threadMsgs
        .filter(m => !m.read && m.sender_type === 'client')
        .map(m => m.id);
      if (unreadIds.length === 0) return;

      setMessages(prev =>
        prev.map(m => (unreadIds.includes(m.id) ? { ...m, read: true } : m))
      );
      for (const id of unreadIds) {
        fetch('/api/messages/read', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message_id: id }),
        }).catch(() => {});
      }
    },
    [threads]
  );

  const markAllRead = async () => {
    const unreadClientIds = [
      ...new Set(messages.filter(m => !m.read && m.sender_type === 'client').map(m => m.client_id)),
    ];
    setMessages(prev =>
      prev.map(m =>
        !m.read && m.sender_type === 'client' ? { ...m, read: true } : m
      )
    );
    for (const cid of unreadClientIds) {
      fetch('/api/messages/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: cid }),
      }).catch(() => {});
    }
  };

  /* ── select thread ── */

  const handleSelectThread = (key: string) => {
    setSelectedThread(key);
    setReplyBody('');
    markThreadRead(key);
  };

  /* ── reply ── */

  const handleReply = async () => {
    if (!replyBody.trim() || !selectedThread) return;
    const threadMsgs = threads[selectedThread] || [];
    const latest = threadMsgs[0];
    if (!latest) return;

    setSending(true);
    try {
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: latest.client_id,
          engagement_id: latest.engagement_id,
          sender_type: 'firm',
          sender_name: 'James Roman Advisory',
          subject: `RE: ${selectedThread}`,
          body: replyBody.trim(),
        }),
      });
      setReplyBody('');
      await loadMessages(clientFilter !== 'all' ? clientFilter : undefined);
    } catch { /* ignore */ }
    setSending(false);
  };

  /* ── delete ── */

  const handleDelete = async (msgId: string) => {
    setDeleting(msgId);
    try {
      const res = await fetch('/api/messages/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: msgId }),
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
      }
    } catch { /* ignore */ }
    setDeleting(null);
  };

  /* ── selected thread messages (oldest first for conversation flow) ── */

  const selectedMsgs = selectedThread
    ? (threads[selectedThread] || []).slice().reverse()
    : [];

  const selectedClient = selectedThread
    ? clients.find(c => c.id === (threads[selectedThread]?.[0]?.client_id))
    : null;

  /* ── render ── */

  return (
    <>
      {/* Header */}
      <div className="admin-header">
        <div>
          <div className="admin-header__eyebrow">ADMINISTRATION</div>
          <h1 className="admin-header__title">Messages</h1>
          <p className="admin-header__subtitle">Secure client communications</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="admin-btn admin-btn--ghost">
              ✓ Mark All Read
            </button>
          )}
          <button onClick={() => setShowCompose(true)} className="admin-btn admin-btn--primary">
            + New Message
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="admin-kpi-strip">
        <div className="admin-kpi">
          <div className="admin-kpi__value">{totalThreads}</div>
          <div className="admin-kpi__label">Threads</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi__value" style={{ color: unreadCount > 0 ? '#c9a96e' : undefined }}>
            {unreadCount}
          </div>
          <div className="admin-kpi__label">Unread</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi__value">{sentToday}</div>
          <div className="admin-kpi__label">Sent Today</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi__value">{clientMsgCount}</div>
          <div className="admin-kpi__label">From Clients</div>
        </div>
      </div>

      {/* Client filter pills */}
      <div className="admin-filters">
        <button
          className={`admin-filter-pill ${clientFilter === 'all' ? 'admin-filter-pill--active' : ''}`}
          onClick={() => { setClientFilter('all'); setSelectedThread(null); }}
        >
          All
        </button>
        {clients.map(c => {
          const cUnread = messages.filter(m => m.client_id === c.id && !m.read && m.sender_type === 'client').length;
          return (
            <button
              key={c.id}
              className={`admin-filter-pill ${clientFilter === c.id ? 'admin-filter-pill--active' : ''}`}
              onClick={() => { setClientFilter(c.id); setSelectedThread(null); }}
              style={{ position: 'relative' }}
            >
              {c.name.split(' ').slice(-1)[0]}
              {cUnread > 0 ? (
                <span className="admin-badge admin-badge--gold" style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px' }}>
                  {cUnread}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Two-pane layout */}
      <div className="admin-messages-pane">
        {/* Thread list */}
        <div className="admin-messages-list">
          {/* Search */}
          <div className="admin-messages-search">
            <input
              type="text"
              placeholder="Search messages…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="admin-messages-search__input"
            />
            {searchQuery && (
              <button
                className="admin-messages-search__clear"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          {sortedThreadKeys.length === 0 ? (
            <div className="admin-messages-empty">
              <span style={{ fontSize: 24, opacity: 0.3 }}>✉</span>
              <p>{searchQuery ? 'No matches' : 'No messages yet'}</p>
            </div>
          ) : (
            sortedThreadKeys.map(key => {
              const threadMsgs = threads[key];
              const latest = threadMsgs[0];
              const client = clients.find(c => c.id === latest.client_id);
              const hasUnread = threadMsgs.some(m => !m.read && m.sender_type === 'client');
              const isSelected = selectedThread === key;

              return (
                <div
                  key={key}
                  className={`admin-messages-thread ${isSelected ? 'admin-messages-thread--active' : ''} ${hasUnread ? 'admin-messages-thread--unread' : ''}`}
                  onClick={() => handleSelectThread(key)}
                >
                  <div className="admin-messages-thread__header">
                    <span className="admin-messages-thread__subject">
                      {key}
                    </span>
                    <span className="admin-messages-thread__time">
                      {timeAgo(latest.created_at)}
                    </span>
                  </div>
                  <div className="admin-messages-thread__meta">
                    <span style={{ color: latest.sender_type === 'firm' ? 'var(--admin-accent)' : 'rgba(255,255,255,0.4)' }}>
                      {latest.sender_type === 'firm' ? 'The Firm' : (client?.name || 'Client')}
                    </span>
                    {threadMsgs.length > 1 ? (
                      <span style={{ marginLeft: 6, color: 'rgba(201,169,110,0.4)' }}>
                        ({threadMsgs.length})
                      </span>
                    ) : null}
                  </div>
                  <div className="admin-messages-thread__preview">
                    {latest.body.substring(0, 90)}{latest.body.length > 90 ? '…' : ''}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail pane */}
        <div className="admin-messages-detail">
          {selectedThread && selectedMsgs.length > 0 ? (
            <>
              {/* Thread header */}
              <div className="admin-messages-detail__header">
                <div>
                  <h2 className="admin-messages-detail__title">{selectedThread}</h2>
                  <span className="admin-messages-detail__client">
                    {selectedClient?.name || '—'} · {selectedClient?.property || ''}
                  </span>
                </div>
                <button
                  className="admin-messages-detail__close"
                  onClick={() => setSelectedThread(null)}
                >
                  ✕
                </button>
              </div>

              {/* Conversation */}
              <div className="admin-messages-detail__body">
                {selectedMsgs.map(msg => (
                  <div
                    key={msg.id}
                    className={`admin-messages-bubble ${msg.sender_type === 'firm' ? 'admin-messages-bubble--firm' : 'admin-messages-bubble--client'}`}
                  >
                    <div className="admin-messages-bubble__header">
                      <span className="admin-messages-bubble__sender">{msg.sender_name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="admin-messages-bubble__time">{formatDate(msg.created_at)}</span>
                        <button
                          className="admin-messages-bubble__delete"
                          title="Delete message"
                          onClick={e => { e.stopPropagation(); handleDelete(msg.id); }}
                          disabled={deleting === msg.id}
                        >
                          {deleting === msg.id ? '…' : '×'}
                        </button>
                      </div>
                    </div>
                    <div className="admin-messages-bubble__text">{msg.body}</div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Reply */}
              <div className="admin-messages-detail__reply">
                <textarea
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  placeholder="Type a reply…"
                  rows={3}
                  className="admin-messages-detail__textarea"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply();
                  }}
                />
                <div className="admin-messages-detail__reply-footer">
                  <span className="admin-messages-detail__hint">⌘+Enter to send</span>
                  <button
                    onClick={handleReply}
                    disabled={sending || !replyBody.trim()}
                    className="admin-btn admin-btn--primary"
                    style={{ padding: '8px 20px', opacity: sending || !replyBody.trim() ? 0.4 : 1 }}
                  >
                    {sending ? 'Sending…' : 'Reply'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="admin-messages-empty" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 32, opacity: 0.15, marginBottom: 12 }}>✉</span>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Select a conversation</p>
            </div>
          )}
        </div>
      </div>

      {showCompose && (
        <ComposeMessage
          clients={clients}
          engagements={engagements}
          preselectedClientId={clientFilter !== 'all' ? clientFilter : undefined}
          onClose={() => setShowCompose(false)}
          onSent={() => {
            setShowCompose(false);
            loadMessages(clientFilter !== 'all' ? clientFilter : undefined);
          }}
        />
      )}
    </>
  );
}
