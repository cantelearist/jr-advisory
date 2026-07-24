'use client';

/* ── Messages — Client & Admin View with Supabase Realtime ── */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import PortalNav from '@/components/portal/PortalNav';
import { useAuth } from '@/components/portal/AuthProvider';
import type { Message, Client } from '@/lib/database.types';
import '@/components/portal/client/portal.css';
import LoadingSkeleton from '@/components/portal/client/LoadingSkeleton';

const Scene3D = dynamic(() => import('@/components/portal/Scene3D'), { ssr: false });

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function MessagesPage() {
  const { isAdmin, clientRecord, supabase, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [engagementId, setEngagementId] = useState('');
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [liveIndicator, setLiveIndicator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch messages
  const fetchMessages = useCallback(async (clientId?: string) => {
    const cid = clientId || selectedClientId;
    if (!cid) return;
    try {
      const res = await fetch(`/api/messages/list?client_id=${cid}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch { /* ignore */ }
  }, [selectedClientId]);

  // Initial load — portal API first, then admin fallback
  useEffect(() => {
    const init = async () => {
      try {
        // Try admin API first (for admin users)
        const adminRes = await fetch('/api/admin');
        if (adminRes.ok) {
          const adminData = await adminRes.json();
          const clientList = adminData.clients || [];
          if (clientList.length > 0) {
            setClients(clientList);
            setSelectedClientId(clientList[0].id);
            setLoading(false);
            return;
          }
        }
      } catch { /* not admin */ }
      // Client: get client ID from portal data API
      try {
        const portalRes = await fetch('/api/portal/data');
        if (portalRes.ok) {
          const portalData = await portalRes.json();
          if (portalData.client?.id) {
            setSelectedClientId(portalData.client.id);
          }
          if (portalData.engagement?.id) {
            setEngagementId(portalData.engagement.id);
          }
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    init();
  }, []);

  // Fetch messages when client changes
  useEffect(() => {
    if (selectedClientId) {
      fetchMessages(selectedClientId);
    }
  }, [selectedClientId, fetchMessages]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!selectedClientId) return;

    const channel = supabase
      .channel(`messages:${selectedClientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `client_id=eq.${selectedClientId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => (
            prev.some(message => message.id === newMsg.id)
              ? prev
              : [newMsg, ...prev]
          ));
          // Flash live indicator
          setLiveIndicator(true);
          setTimeout(() => setLiveIndicator(false), 2000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedClientId, supabase]);

  // Mark messages as read when viewing
  useEffect(() => {
    const ownSenderType = isAdmin ? 'firm' : 'client';
    if (!selectedMsg || selectedMsg.read || selectedMsg.sender_type === ownSenderType) return;

    const markRead = async () => {
      const res = await fetch('/api/messages/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: selectedMsg.id }),
      });
      if (!res.ok) return;
      setMessages(prev =>
        prev.map(m => m.id === selectedMsg.id ? { ...m, read: true } : m)
      );
    };
    markRead().catch(() => {});
  }, [selectedMsg, isAdmin]);

  const sendMessage = async ({
    subject,
    body,
    targetEngagementId,
  }: {
    subject: string;
    body: string;
    targetEngagementId: string;
  }) => {
    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: selectedClientId,
        engagement_id: targetEngagementId,
        subject,
        body,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Unable to send message');
    if (data.message) {
      setMessages(prev => (
        prev.some(message => message.id === data.message.id)
          ? prev
          : [data.message, ...prev]
      ));
    }
    return data.message as Message | undefined;
  };

  // Send reply
  const handleReply = async () => {
    if (!replyBody.trim() || !selectedMsg) return;
    setSending(true);
    setError('');
    try {
      const message = await sendMessage({
        targetEngagementId: selectedMsg.engagement_id,
        subject: `RE: ${selectedMsg.subject.replace(/^RE:\s*/i, '')}`,
        body: replyBody.trim(),
      });
      setReplyBody('');
      if (message) setSelectedMsg(message);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCompose = async () => {
    if (!composeSubject.trim() || !composeBody.trim()) {
      setError('Add a subject and message.');
      return;
    }
    if (!selectedClientId || !engagementId) {
      setError('No active engagement is available for messaging.');
      return;
    }

    setSending(true);
    setError('');
    try {
      const message = await sendMessage({
        targetEngagementId: engagementId,
        subject: composeSubject.trim(),
        body: composeBody.trim(),
      });
      setComposeSubject('');
      setComposeBody('');
      setShowCompose(false);
      if (message) setSelectedMsg(message);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  const unreadCount = messages.filter(m => !m.read && m.sender_type !== (isAdmin ? 'firm' : 'client')).length;
  const selectedClientName = clients.find(c => c.id === selectedClientId)?.name || clientRecord?.name || '';

  // Group messages by thread (subject)
  const threads = messages.reduce((acc, msg) => {
    const threadKey = msg.subject.replace(/^RE: /i, '');
    if (!acc[threadKey]) acc[threadKey] = [];
    acc[threadKey].push(msg);
    return acc;
  }, {} as Record<string, Message[]>);

  const allThreadKeys = Object.keys(threads).sort((a, b) => {
    const latestA = new Date(threads[a][0].created_at).getTime();
    const latestB = new Date(threads[b][0].created_at).getTime();
    return latestB - latestA;
  });

  /* Search filter: match thread subject or any message body */
  const sortedThreadKeys = useMemo(() => {
    if (!searchQuery.trim()) return allThreadKeys;
    const q = searchQuery.toLowerCase();
    return allThreadKeys.filter(key =>
      key.toLowerCase().includes(q) ||
      threads[key].some(m =>
        m.body.toLowerCase().includes(q) ||
        m.sender_name.toLowerCase().includes(q)
      )
    );
  }, [allThreadKeys, threads, searchQuery]);

  if (loading) {
    return <LoadingSkeleton label="LOADING MESSAGES" />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.3 }}><Scene3D /></div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <PortalNav />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 300, color: '#c9a96e', margin: 0, letterSpacing: 2, fontFamily: "'Cormorant Garamond', serif" }}>
                SECURE MESSAGES
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
                {isAdmin ? `${clients.length} client conversations` : selectedClientName}
                {liveIndicator && <span style={{ color: '#4ade80', marginLeft: 8 }}>● Live</span>}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {unreadCount > 0 && (
                <div style={{ background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 20, padding: '6px 16px', color: '#c9a96e', fontSize: 13 }}>
                  {unreadCount} unread
                </div>
              )}
              {!isAdmin && (
                <button
                  type="button"
                  onClick={() => { setShowCompose(current => !current); setError(''); }}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: '1px solid rgba(201,169,110,0.35)',
                    background: 'rgba(201,169,110,0.12)',
                    color: '#c9a96e',
                    cursor: 'pointer',
                    fontSize: 12,
                    letterSpacing: 1,
                  }}
                >
                  {showCompose ? 'CANCEL' : '+ NEW MESSAGE'}
                </button>
              )}
            </div>
          </div>

          {showCompose && !isAdmin && (
            <div style={{
              marginBottom: 24,
              padding: 20,
              borderRadius: 12,
              border: '1px solid rgba(201,169,110,0.2)',
              background: 'rgba(255,255,255,0.025)',
              display: 'grid',
              gap: 12,
            }}>
              <input
                type="text"
                value={composeSubject}
                onChange={event => setComposeSubject(event.target.value)}
                placeholder="Subject"
                maxLength={200}
                style={{
                  padding: '11px 14px',
                  background: '#0a0a0a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#fff',
                  fontFamily: 'inherit',
                }}
              />
              <textarea
                value={composeBody}
                onChange={event => setComposeBody(event.target.value)}
                placeholder="Write your message…"
                maxLength={10_000}
                rows={4}
                style={{
                  padding: '11px 14px',
                  background: '#0a0a0a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#fff',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                  Visible only inside the Private Office
                </span>
                <button
                  type="button"
                  onClick={handleCompose}
                  disabled={sending || !composeSubject.trim() || !composeBody.trim()}
                  style={{
                    padding: '10px 20px',
                    border: 0,
                    borderRadius: 8,
                    background: '#c9a96e',
                    color: '#0a0a0a',
                    fontWeight: 700,
                    cursor: sending ? 'wait' : 'pointer',
                    opacity: sending || !composeSubject.trim() || !composeBody.trim() ? 0.45 : 1,
                  }}
                >
                  {sending ? 'SENDING…' : 'SEND MESSAGE'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" style={{ color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* Admin: client selector */}
          {isAdmin && clients.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {clients.map(c => {
                const clientUnread = messages.filter(m => m.client_id === c.id && !m.read && m.sender_type === 'client').length;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedClientId(c.id); setSelectedMsg(null); }}
                    style={{
                      padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                      background: selectedClientId === c.id ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedClientId === c.id ? 'rgba(201,169,110,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      color: selectedClientId === c.id ? '#c9a96e' : 'rgba(255,255,255,0.5)',
                      position: 'relative',
                    }}
                  >
                    {c.name.split(' ').slice(-1)[0]}
                    {clientUnread > 0 && (
                      <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#c9a96e', color: '#0a0a0a', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {clientUnread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Two-pane: thread list + detail */}
          <div style={{ display: 'grid', gridTemplateColumns: selectedMsg ? '380px 1fr' : '1fr', gap: 24, minHeight: 500 }}>
            {/* Thread list */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
              {/* Search bar */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="portal-search" style={{ maxWidth: '100%' }}>
                  <span className="portal-search__icon">⌕</span>
                  <input
                    type="text"
                    className="portal-search__input"
                    placeholder="Search messages…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="portal-search__clear" onClick={() => setSearchQuery('')}>✕</button>
                  )}
                </div>
              </div>
              {sortedThreadKeys.length === 0 ? (
                <div className="portal-empty" style={{ padding: '40px 20px' }}>
                  <div className="portal-empty__icon">✉</div>
                  <h3 className="portal-empty__title">{searchQuery ? 'No matches' : 'No messages yet'}</h3>
                  <p className="portal-empty__sub">{searchQuery ? 'Try a different search term' : 'Start a conversation'}</p>
                </div>
              ) : (
                sortedThreadKeys.map(threadKey => {
                  const threadMsgs = threads[threadKey];
                  const latest = threadMsgs[0];
                  const hasUnread = threadMsgs.some(m => !m.read && m.sender_type !== (isAdmin ? 'firm' : 'client'));
                  const isSelected = selectedMsg && threadKey === selectedMsg.subject.replace(/^RE: /i, '');

                  return (
                    <div
                      key={threadKey}
                      onClick={() => setSelectedMsg(latest)}
                      style={{
                        padding: '16px 20px', cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: isSelected ? 'rgba(201,169,110,0.08)' : 'transparent',
                        borderLeft: hasUnread ? '3px solid #c9a96e' : '3px solid transparent',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: hasUnread ? 600 : 400, color: hasUnread ? '#fff' : 'rgba(255,255,255,0.7)', flex: 1 }}>
                          {threadKey}
                        </span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                          {timeAgo(latest.created_at)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                        {latest.sender_type === 'firm' ? 'The Firm' : (clients.find(c => c.id === latest.client_id)?.name || 'Client')}
                        {threadMsgs.length > 1 && <span style={{ marginLeft: 6, color: 'rgba(201,169,110,0.5)' }}>({threadMsgs.length})</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {latest.body.substring(0, 80)}…
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message detail */}
            {selectedMsg && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
                {/* Thread header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: 16, fontWeight: 500, color: '#fff', margin: 0 }}>
                      {selectedMsg.subject.replace(/^RE: /i, '')}
                    </h2>
                    <button onClick={() => setSelectedMsg(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                    🔒 Protected inside the Private Office
                  </div>
                </div>

                {/* Messages in thread */}
                <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px', maxHeight: 400 }}>
                  {(threads[selectedMsg.subject.replace(/^RE: /i, '')] || [selectedMsg])
                    .slice().reverse()
                    .map(msg => (
                      <div
                        key={msg.id}
                        style={{
                          marginBottom: 16, padding: 16, borderRadius: 10,
                          background: msg.sender_type === 'firm' ? 'rgba(201,169,110,0.06)' : 'rgba(255,255,255,0.04)',
                          borderLeft: `3px solid ${msg.sender_type === 'firm' ? 'rgba(201,169,110,0.4)' : 'rgba(255,255,255,0.1)'}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: msg.sender_type === 'firm' ? '#c9a96e' : 'rgba(255,255,255,0.8)' }}>
                            {msg.sender_name}
                          </span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                          {msg.body}
                        </div>
                      </div>
                    ))}
                  <div ref={bottomRef} />
                </div>

                {/* Reply box */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <textarea
                      value={replyBody}
                      onChange={e => setReplyBody(e.target.value)}
                      placeholder="Type a reply…"
                      rows={2}
                      style={{
                        flex: 1, padding: '10px 14px', background: '#0a0a0a',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                        color: '#fff', fontSize: 14, outline: 'none', resize: 'none',
                        fontFamily: 'inherit', lineHeight: 1.5,
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply();
                      }}
                    />
                    <button
                      onClick={handleReply}
                      disabled={sending || !replyBody.trim()}
                      style={{
                        padding: '10px 20px', background: '#c9a96e', border: 'none', borderRadius: 8,
                        color: '#0a0a0a', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        opacity: sending || !replyBody.trim() ? 0.4 : 1, alignSelf: 'flex-end',
                      }}
                    >
                      {sending ? '…' : 'Send'}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
                    ⌘+Enter to send
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
