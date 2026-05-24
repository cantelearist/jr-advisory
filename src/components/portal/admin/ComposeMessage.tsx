'use client';

/* ── Compose Message Modal — admin sends message to client ── */

import { useState } from 'react';
import type { Client, Engagement } from '@/lib/database.types';

interface Props {
  clients: Client[];
  engagements: Engagement[];
  preselectedClientId?: string;
  onClose: () => void;
  onSent: () => void;
}

export default function ComposeMessage({ clients, engagements, preselectedClientId, onClose, onSent }: Props) {
  const [clientId, setClientId] = useState(preselectedClientId || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const clientEngagements = engagements.filter(e => e.client_id === clientId);
  const engagementId = clientEngagements[0]?.id || '';

  const handleSend = async () => {
    if (!clientId || !subject.trim() || !body.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (!engagementId) {
      setError('No engagement found for this client');
      return;
    }

    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          engagement_id: engagementId,
          sender_type: 'firm',
          sender_name: 'James Roman Advisory',
          subject: subject.trim(),
          body: body.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      onSent();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setSending(false);
    }
  };

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  };

  const modal: React.CSSProperties = {
    background: '#1a1a1a', borderRadius: 12, padding: 32, width: '100%', maxWidth: 560,
    border: '1px solid rgba(201,169,110,0.2)', maxHeight: '90vh', overflow: 'auto',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#c9a96e', margin: 0 }}>New Message</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Client selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>To</label>
          <select
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">Select client…</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Subject</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Message subject..."
            style={inputStyle}
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Message</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Type your message..."
            rows={8}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        {error && (
          <div style={{ color: '#ff4444', fontSize: 13, marginBottom: 16 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            style={{ padding: '10px 24px', background: '#c9a96e', border: 'none', borderRadius: 8, color: '#0a0a0a', cursor: sending ? 'wait' : 'pointer', fontSize: 14, fontWeight: 600, opacity: sending ? 0.6 : 1 }}
          >
            {sending ? 'Sending…' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
}
