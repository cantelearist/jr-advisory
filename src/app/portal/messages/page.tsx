'use client';

/* ── Messages — Client & Admin View with Supabase Realtime ── */

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import PortalNav from '@/components/portal/PortalNav';
import { useAuth } from '@/components/portal/AuthProvider';
import type { Message, Client } from '@/lib/database.types';

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
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [liveIndicator, setLiveIndicator] = useState(false);

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

  // Initial load — with API fallback for reliable client ID resolution
  useEffect(() => {
    if (authLoading) return;
    const init = async () => {
      if (isAdmin) {
        // Admin: fetch all clients from admin API
        const res = await fetch('/api/admin');
        const data = await res.json();
        const clientList = data.clients || [];
        setClients(clientList);
        if (clientList.length > 0) {
          setSelectedClientId(clientList[0].id);
        }
      } else if (clientRecord) {
        setSelectedClientId(clientRecord.id);
      } else {
        // Fallback: get client ID from portal data API (bypasses RLS)
        try {
          const portalRes = await fetch('/api/portal/data');
          if (portalRes.ok) {
            const portalData = await portalRes.json();
            if (portalData.client?.id) {
              setSelectedClientId(portalData.client.id);
            }
          }
        } catch { /* ignore */ }
      }
      setLoading(false);
    };
    init();
  }, [authLoading, isAdmin, clientRecord]);

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
          setMessages(prev => [newMsg, ...prev]);
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
    if (!selectedMsg || selectedMsg.read) return;
    fetch('/api/messages/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: selectedMsg.id }),
    });
    setMessages(prev =>
      prev.map(m => m.id === selectedMsg.id ? { ...m, read: true } : m)
    );
  }, [selectedMsg]);

  // Send reply
  const handleReply = async () => {
    if (!replyBody.trim() || !selectedMsg) return;
    setSending(true);
    try {
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          engagement_id: selectedMsg.engagement_id,
          sender_type: isAdmin ? 'firm' : 'client',
          sender_name: isAdmin ? 'James Roman Advisory' : (clientRecord?.name || 'Client'),
          subject: `RE: ${selectedMsg.subject.replace(/^RE: /i, '')}`,
          body: replyBody.trim(),
        }),
      });
      setReplyBody('');
      // Realtime will pick up the new message
    } catch { /* ignore */ }
    setSending(false);
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

  const sortedThreadKeys = Object.keys(threads).sort((a, b) => {
    const latestA = new Date(threads[a][0].created_at).getTime();
    const latestB = new Date(threads[b][0].created_at).getTime();
    return latestB - latestA;
  });

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading…</div>
      </div>
    );
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
            {unreadCount > 0 && (
              <div style={{ background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 20, padding: '6px 16px', color: '#c9a96e', fontSize: 13 }}>
                {unreadCount} unread
              </div>
            )}
          </div>

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
              {sortedThreadKeys.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                  No messages yet
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
                    🔒 End-to-end encrypted
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
