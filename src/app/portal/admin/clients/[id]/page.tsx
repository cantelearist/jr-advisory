'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PortalNav from '@/components/portal/PortalNav';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/portal/AuthProvider';
import { updateClient, updateEngagement, sendMessage } from '@/lib/data';
import type {
  Client, Engagement, Invoice, Document as DBDocument,
  Message, TimelineEvent, NdaRecord,
} from '@/lib/database.types';

const Scene3D = dynamic(() => import('@/components/portal/Scene3D'), { ssr: false });

type DetailTab = 'overview' | 'documents' | 'messages' | 'invoices' | 'timeline';

const PHASE_LABELS: Record<string, string> = {
  '1': 'I — Consultation',
  '2': 'II — Assessment',
  '3': 'III — Scope & Vendor',
  '4': 'IV — Oversight',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#4ade80',
  pending: '#c9a96e',
  completed: 'rgba(255,255,255,0.4)',
  archived: 'rgba(255,255,255,0.2)',
};

const INV_STATUS_COLORS: Record<string, string> = {
  paid: '#4ade80',
  sent: '#c9a96e',
  draft: 'rgba(255,255,255,0.3)',
  overdue: '#ef4444',
  cancelled: 'rgba(255,255,255,0.2)',
};

const DOC_CAT_LABELS: Record<string, string> = {
  nda: 'NDA',
  'lab-results': 'Lab Results',
  proposals: 'Proposals',
  clearance: 'Clearance',
  invoices: 'Invoices',
  reports: 'Reports',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

const formatDate = (d: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

interface ClientDetail {
  client: Client;
  profile: { id: string; full_name: string; email: string; created_at: string } | null;
  engagements: Engagement[];
  invoices: Invoice[];
  messages: Message[];
  documents: DBDocument[];
  timeline: TimelineEvent[];
  ndas: NdaRecord[];
}

export default function ClientDetailPage() {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const [data, setData] = useState<ClientDetail | null>(null);
  const [tab, setTab] = useState<DetailTab>('overview');
  const [loaded, setLoaded] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [composing, setComposing] = useState(false);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSending, setMsgSending] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/portal/dashboard');
  }, [authLoading, isAdmin, router]);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`);
      if (!res.ok) throw new Error('Not found');
      const json = await res.json();
      setData(json);
      setNotes(json.client.notes || '');
      setLoaded(true);
    } catch {
      router.replace('/portal/admin');
    }
  }, [clientId, router]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveNotes = async () => {
    if (!data) return;
    await updateClient(data.client.id, { notes });
    setEditingNotes(false);
    loadData();
  };

  const handleSendMessage = async () => {
    if (!data || !msgSubject.trim() || !msgBody.trim()) return;
    setMsgSending(true);
    const eng = data.engagements[0];
    await sendMessage({
      client_id: data.client.id,
      engagement_id: eng?.id || '',
      sender_type: 'firm',
      sender_name: user?.user_metadata?.full_name || 'Admin',
      subject: msgSubject,
      body: msgBody,
    });
    setMsgSubject('');
    setMsgBody('');
    setComposing(false);
    setMsgSending(false);
    loadData();
  };

  if (!loaded || !data) {
    return (
      <div className="portal-page">
        <Scene3D variant="dashboard" />
        <PortalNav />
        <main className="portal-main" style={{ paddingTop: 100 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading…</p>
          </div>
        </main>
      </div>
    );
  }

  const { client, profile, engagements, invoices, messages, documents, timeline, ndas } = data;
  const engagement = engagements[0] || null;
  const totalBilled = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
  const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + Number(i.amount), 0);
  const unreadMessages = messages.filter(m => !m.read && m.sender_type === 'client').length;
  const nda = ndas[0] || null;

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
  };

  const tabs: { id: DetailTab; label: string; icon: string; badge?: number }[] = [
    { id: 'overview', label: 'OVERVIEW', icon: '◎' },
    { id: 'documents', label: 'DOCUMENTS', icon: '▤', badge: documents.length },
    { id: 'messages', label: 'MESSAGES', icon: '✉', badge: unreadMessages || undefined },
    { id: 'invoices', label: 'INVOICES', icon: '▦', badge: invoices.length },
    { id: 'timeline', label: 'TIMELINE', icon: '◈' },
  ];

  return (
    <div className="portal-page">
      <Scene3D variant="dashboard" />
      <PortalNav />

      <main className="portal-main" style={{ paddingTop: 100 }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 32px',
          opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease',
        }}>

          {/* Back link */}
          <button
            onClick={() => router.push('/portal/admin')}
            style={{
              background: 'none', border: 'none', color: 'rgba(201,169,110,0.5)',
              cursor: 'pointer', fontSize: 12, letterSpacing: 1.5, marginBottom: 24,
              padding: 0, fontFamily: "'JetBrains Mono', monospace",
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c9a96e')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(201,169,110,0.5)')}
          >
            ← BACK TO DASHBOARD
          </button>

          {/* Client Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <h1 className="display" style={{ fontSize: 36, margin: 0 }}>{client.name}</h1>
                <span className="mono" style={{
                  fontSize: 10, letterSpacing: 1.5,
                  color: STATUS_COLORS[client.status],
                  padding: '5px 14px', borderRadius: 6,
                  background: `${STATUS_COLORS[client.status]}15`,
                  border: `1px solid ${STATUS_COLORS[client.status]}30`,
                }}>
                  {client.status.toUpperCase()}
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '4px 0 0' }}>
                {client.property} · {client.area}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: '4px 0 0' }}>
                {client.email}{client.phone ? ` · ${client.phone}` : ''}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setTab('messages'); setComposing(true); }}
                style={{
                  background: 'rgba(201,169,110,0.12)',
                  border: '1px solid rgba(201,169,110,0.3)',
                  color: '#c9a96e', padding: '10px 20px', borderRadius: 6,
                  cursor: 'pointer', fontSize: 11, letterSpacing: 1.5,
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase', transition: 'all 0.2s',
                }}
              >
                ✉ Send Message
              </button>
              <button
                onClick={() => router.push('/portal/admin')}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.5)', padding: '10px 20px', borderRadius: 6,
                  cursor: 'pointer', fontSize: 11, letterSpacing: 1.5,
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase', transition: 'all 0.2s',
                }}
              >
                ⚙ Edit
              </button>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 40 }}>
            {[
              { label: 'PHASE', value: engagement ? PHASE_LABELS[engagement.phase] : '—', color: '#c9a96e' },
              { label: 'TOTAL BILLED', value: formatCurrency(totalBilled), color: 'rgba(255,255,255,0.85)' },
              { label: 'COLLECTED', value: formatCurrency(totalPaid), color: '#4ade80' },
              { label: 'OUTSTANDING', value: formatCurrency(outstanding), color: outstanding > 0 ? '#c9a96e' : '#4ade80' },
              { label: 'NDA STATUS', value: nda ? (nda.status === 'active' ? 'ACTIVE' : nda.status.toUpperCase()) : 'NONE', color: nda?.status === 'active' ? '#4ade80' : 'rgba(255,255,255,0.35)' },
            ].map((s, i) => (
              <div key={i} style={{ ...card, padding: '20px 16px' }}>
                <p className="mono" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: 2, marginBottom: 8 }}>{s.label}</p>
                <p className="display" style={{ fontSize: 18, color: s.color, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 6, marginBottom: 32,
            borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12,
          }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="mono"
                style={{
                  background: tab === t.id ? 'rgba(201,169,110,0.12)' : 'transparent',
                  border: `1px solid ${tab === t.id ? 'rgba(201,169,110,0.25)' : 'transparent'}`,
                  borderRadius: 6,
                  padding: '10px 18px',
                  color: tab === t.id ? '#c9a96e' : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  fontSize: 10,
                  letterSpacing: 1.8,
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                {t.label}
                {t.badge ? (
                  <span style={{
                    background: t.id === 'messages' ? '#c9a96e' : 'rgba(255,255,255,0.15)',
                    color: t.id === 'messages' ? '#000' : 'rgba(255,255,255,0.6)',
                    fontSize: 9, padding: '2px 7px', borderRadius: 10, fontWeight: 600,
                  }}>
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* === OVERVIEW TAB === */}
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Left: Engagement details */}
              <div>
                <h3 className="mono" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 2, marginBottom: 16 }}>
                  ENGAGEMENT
                </h3>
                {engagement ? (
                  <div style={{ ...card, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', margin: 0, fontWeight: 500 }}>{engagement.type}</p>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>{engagement.property}</p>
                      </div>
                      <span className="mono" style={{
                        fontSize: 10, color: '#c9a96e', letterSpacing: 1.5,
                        padding: '4px 12px', borderRadius: 4,
                        background: 'rgba(201,169,110,0.08)',
                        border: '1px solid rgba(201,169,110,0.15)',
                      }}>
                        PHASE {engagement.phase}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                      <div>
                        <p className="mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, marginBottom: 4 }}>PHASE LABEL</p>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{engagement.phase_label}</p>
                      </div>
                      <div>
                        <p className="mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, marginBottom: 4 }}>STARTED</p>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{formatDate(engagement.start_date)}</p>
                      </div>
                      <div>
                        <p className="mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, marginBottom: 4 }}>NEXT MILESTONE</p>
                        <p style={{ fontSize: 13, color: '#c9a96e', margin: 0 }}>{engagement.next_milestone || '—'}</p>
                      </div>
                      <div>
                        <p className="mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, marginBottom: 4 }}>DOCUMENTS</p>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{documents.length} files</p>
                      </div>
                    </div>

                    {engagement.notes && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, marginBottom: 4 }}>NOTES</p>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>{engagement.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ ...card, padding: 24, textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontStyle: 'italic' }}>No engagement yet</p>
                  </div>
                )}

                {/* Portal Access */}
                <h3 className="mono" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 2, marginTop: 32, marginBottom: 16 }}>
                  PORTAL ACCESS
                </h3>
                <div style={{ ...card, padding: 20 }}>
                  {profile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, color: '#4ade80',
                      }}>
                        ✓
                      </div>
                      <div>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{profile.email}</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
                          Active since {formatDate(profile.created_at)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, color: 'rgba(255,255,255,0.25)',
                      }}>
                        ○
                      </div>
                      <div>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 }}>No portal login</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: '2px 0 0' }}>
                          Invite from the clients tab to create access
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Notes + Recent Activity */}
              <div>
                <h3 className="mono" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 2, marginBottom: 16 }}>
                  INTERNAL NOTES
                </h3>
                <div style={{ ...card, padding: 20, marginBottom: 32 }}>
                  {editingNotes ? (
                    <div>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        style={{
                          width: '100%', minHeight: 120, background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(201,169,110,0.2)', borderRadius: 6,
                          color: 'rgba(255,255,255,0.8)', padding: 12, fontSize: 13,
                          fontFamily: 'Inter, sans-serif', resize: 'vertical',
                          outline: 'none', boxSizing: 'border-box',
                        }}
                        placeholder="Private notes about this client…"
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button onClick={saveNotes} style={{
                          background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)',
                          color: '#c9a96e', padding: '8px 18px', borderRadius: 4, cursor: 'pointer',
                          fontSize: 11, letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace",
                        }}>SAVE</button>
                        <button onClick={() => { setEditingNotes(false); setNotes(client.notes || ''); }} style={{
                          background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.4)', padding: '8px 18px', borderRadius: 4, cursor: 'pointer',
                          fontSize: 11, letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace",
                        }}>CANCEL</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingNotes(true)}
                      style={{ cursor: 'pointer', minHeight: 60 }}
                    >
                      <p style={{
                        fontSize: 13, color: notes ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
                        margin: 0, lineHeight: 1.7, fontStyle: notes ? 'normal' : 'italic',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {notes || 'Click to add notes…'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Recent Activity Feed */}
                <h3 className="mono" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 2, marginBottom: 16 }}>
                  RECENT ACTIVITY
                </h3>
                <div style={{ ...card, padding: 20 }}>
                  {timeline.length === 0 && messages.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>
                      No activity yet
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {/* Merge timeline + messages, sort by date, show last 8 */}
                      {[
                        ...timeline.map(t => ({ type: 'timeline' as const, date: t.event_date, item: t })),
                        ...messages.map(m => ({ type: 'message' as const, date: m.created_at, item: m })),
                      ]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 8)
                        .map((entry, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex', gap: 12, alignItems: 'flex-start',
                              padding: '12px 0',
                              borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                            }}
                          >
                            <span style={{
                              fontSize: 14, marginTop: 2, width: 20, textAlign: 'center',
                              opacity: 0.5,
                            }}>
                              {entry.type === 'timeline' ? (
                                (entry.item as TimelineEvent).event_type === 'milestone' ? '◈' :
                                (entry.item as TimelineEvent).event_type === 'document' ? '▤' :
                                (entry.item as TimelineEvent).event_type === 'meeting' ? '◎' : '•'
                              ) : '✉'}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                                {entry.type === 'timeline'
                                  ? (entry.item as TimelineEvent).title
                                  : `${(entry.item as Message).sender_type === 'firm' ? 'Sent' : 'Received'}: ${(entry.item as Message).subject}`
                                }
                              </p>
                              <p className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', margin: '2px 0 0' }}>
                                {formatDate(entry.date)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* === DOCUMENTS TAB === */}
          {tab === 'documents' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {documents.length === 0 ? (
                  <div style={{ ...card, padding: 40, textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontStyle: 'italic' }}>No documents yet</p>
                  </div>
                ) : (
                  documents.map(doc => (
                    <div key={doc.id} style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontSize: 20, opacity: 0.4 }}>▤</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{doc.name}</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
                          {DOC_CAT_LABELS[doc.category] || doc.category} · {doc.file_size || '—'} · {formatDate(doc.created_at)}
                        </p>
                      </div>
                      <span className="mono" style={{
                        fontSize: 9, letterSpacing: 1.5,
                        color: doc.status === 'final' ? '#4ade80' : doc.status === 'pending-review' ? '#c9a96e' : 'rgba(255,255,255,0.35)',
                        padding: '4px 10px', borderRadius: 4,
                        background: doc.status === 'final' ? 'rgba(74,222,128,0.08)' : doc.status === 'pending-review' ? 'rgba(201,169,110,0.08)' : 'rgba(255,255,255,0.04)',
                      }}>
                        {doc.status.toUpperCase()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* === MESSAGES TAB === */}
          {tab === 'messages' && (
            <div>
              {/* Compose */}
              {composing && (
                <div style={{ ...card, padding: 24, marginBottom: 24 }}>
                  <h4 className="mono" style={{ color: '#c9a96e', fontSize: 10, letterSpacing: 2, marginBottom: 16 }}>
                    NEW MESSAGE
                  </h4>
                  <input
                    type="text"
                    value={msgSubject}
                    onChange={e => setMsgSubject(e.target.value)}
                    placeholder="Subject"
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6, color: 'rgba(255,255,255,0.8)', padding: '12px 14px', fontSize: 14,
                      outline: 'none', marginBottom: 12, boxSizing: 'border-box',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                  <textarea
                    value={msgBody}
                    onChange={e => setMsgBody(e.target.value)}
                    placeholder="Type your message…"
                    style={{
                      width: '100%', minHeight: 120, background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
                      color: 'rgba(255,255,255,0.8)', padding: '12px 14px', fontSize: 14,
                      outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={handleSendMessage} disabled={msgSending} style={{
                      background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)',
                      color: '#c9a96e', padding: '10px 24px', borderRadius: 4, cursor: 'pointer',
                      fontSize: 11, letterSpacing: 1.5, fontFamily: "'JetBrains Mono', monospace",
                      opacity: msgSending ? 0.5 : 1,
                    }}>
                      {msgSending ? 'SENDING…' : 'SEND'}
                    </button>
                    <button onClick={() => setComposing(false)} style={{
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.4)', padding: '10px 24px', borderRadius: 4,
                      cursor: 'pointer', fontSize: 11, letterSpacing: 1.5,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      CANCEL
                    </button>
                  </div>
                </div>
              )}

              {!composing && (
                <button
                  onClick={() => setComposing(true)}
                  style={{
                    background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.3)',
                    color: '#c9a96e', padding: '10px 24px', borderRadius: 6, cursor: 'pointer',
                    fontSize: 11, letterSpacing: 1.5, fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: 24,
                  }}
                >
                  + NEW MESSAGE
                </button>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {messages.length === 0 ? (
                  <div style={{ ...card, padding: 40, textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontStyle: 'italic' }}>No messages yet</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} style={{
                      ...card,
                      padding: '16px 20px',
                      borderLeft: `3px solid ${msg.sender_type === 'firm' ? 'rgba(201,169,110,0.3)' : 'rgba(74,222,128,0.3)'}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0, fontWeight: 500 }}>
                          {msg.subject}
                        </p>
                        <span className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: msg.sender_type === 'firm' ? '#c9a96e' : '#4ade80', margin: '0 0 6px', fontStyle: 'italic' }}>
                        {msg.sender_name}
                      </p>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
                        {msg.body.length > 200 ? msg.body.slice(0, 200) + '…' : msg.body}
                      </p>
                      {!msg.read && msg.sender_type === 'client' && (
                        <span className="mono" style={{
                          display: 'inline-block', marginTop: 8,
                          fontSize: 8, letterSpacing: 1.5, color: '#c9a96e',
                          background: 'rgba(201,169,110,0.1)', padding: '3px 8px', borderRadius: 3,
                        }}>
                          UNREAD
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* === INVOICES TAB === */}
          {tab === 'invoices' && (
            <div>
              {/* Summary bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'TOTAL BILLED', value: formatCurrency(totalBilled), color: 'rgba(255,255,255,0.85)' },
                  { label: 'COLLECTED', value: formatCurrency(totalPaid), color: '#4ade80' },
                  { label: 'OUTSTANDING', value: formatCurrency(outstanding), color: outstanding > 0 ? '#c9a96e' : '#4ade80' },
                ].map((s, i) => (
                  <div key={i} style={{ ...card, padding: '16px 14px' }}>
                    <p className="mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, marginBottom: 6 }}>{s.label}</p>
                    <p className="display" style={{ fontSize: 20, color: s.color, margin: 0 }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {invoices.length === 0 ? (
                  <div style={{ ...card, padding: 40, textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontStyle: 'italic' }}>No invoices yet</p>
                  </div>
                ) : (
                  invoices.map(inv => (
                    <div key={inv.id} style={{ ...card, padding: '16px 20px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', alignItems: 'center', gap: 16 }}>
                      <div>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{inv.description}</p>
                        <p className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>{inv.invoice_number}</p>
                      </div>
                      <p className="display" style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', margin: 0 }}>{formatCurrency(inv.amount)}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                        {inv.status === 'paid' ? `Paid ${formatDate(inv.paid_date)}` : `Due ${formatDate(inv.due_date)}`}
                      </p>
                      <span className="mono" style={{
                        fontSize: 9, letterSpacing: 1.5,
                        color: INV_STATUS_COLORS[inv.status],
                        padding: '5px 12px', borderRadius: 4,
                        background: `${INV_STATUS_COLORS[inv.status]}15`,
                      }}>
                        {inv.status.toUpperCase()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* === TIMELINE TAB === */}
          {tab === 'timeline' && (
            <div>
              {timeline.length === 0 ? (
                <div style={{ ...card, padding: 40, textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontStyle: 'italic' }}>No timeline events yet</p>
                </div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: 32 }}>
                  {/* Vertical line */}
                  <div style={{
                    position: 'absolute', left: 7, top: 8, bottom: 8,
                    width: 1, background: 'rgba(201,169,110,0.15)',
                  }} />

                  {timeline
                    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
                    .map((event, i) => (
                    <div key={event.id} style={{ position: 'relative', marginBottom: 24 }}>
                      {/* Dot */}
                      <div style={{
                        position: 'absolute', left: -32, top: 4,
                        width: 14, height: 14, borderRadius: '50%',
                        background: event.event_type === 'milestone' ? '#c9a96e' :
                                    event.event_type === 'document' ? 'rgba(255,255,255,0.3)' :
                                    event.event_type === 'meeting' ? '#4ade80' : 'rgba(255,255,255,0.15)',
                        border: '2px solid #0a0a0a',
                      }} />

                      <div style={{ ...card, padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0, fontWeight: 500 }}>
                            {event.title}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span className="mono" style={{
                              fontSize: 9, color: '#c9a96e', letterSpacing: 1.5, opacity: 0.6,
                            }}>
                              PHASE {event.phase}
                            </span>
                            <span className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                              {formatDate(event.event_date)}
                            </span>
                          </div>
                        </div>
                        {event.description && (
                          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6 }}>
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom padding */}
          <div style={{ height: 80 }} />
        </div>
      </main>
    </div>
  );
}
