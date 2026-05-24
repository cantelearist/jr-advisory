'use client';

import { useState, useEffect } from 'react';
import Modal, { fieldStyle, labelStyle, btnPrimary, btnSecondary } from '../Modal';
import type { Client, Engagement } from '@/lib/database.types';

interface EngagementModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: EngagementFormData) => Promise<void>;
  engagement?: Engagement | null;
  clients: Client[];
}

export interface EngagementFormData {
  client_id: string;
  type: string;
  phase: string;
  phase_label: string;
  next_milestone: string;
  notes: string;
  property: string;
}

const ENGAGEMENT_TYPES = [
  'Mold & Water Intrusion',
  'Asbestos & Legacy Materials',
  'Lead-Based Paint',
  'Fire & Smoke Residue',
  'Indoor Air Quality & VOCs',
  'Pre-Purchase Diligence',
];

const PHASE_LABELS: Record<string, string> = {
  '1': 'Confidential Consultation',
  '2': 'Independent Assessment',
  '3': 'Scope & Vendor Curation',
  '4': 'Oversight & Clearance',
};

export default function EngagementModal({ open, onClose, onSave, engagement, clients }: EngagementModalProps) {
  const [form, setForm] = useState<EngagementFormData>({
    client_id: '', type: ENGAGEMENT_TYPES[0], phase: '1',
    phase_label: PHASE_LABELS['1'], next_milestone: '', notes: '', property: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (engagement) {
      setForm({
        client_id: engagement.client_id,
        type: engagement.type,
        phase: engagement.phase,
        phase_label: engagement.phase_label,
        next_milestone: engagement.next_milestone || '',
        notes: engagement.notes || '',
        property: engagement.property,
      });
    } else {
      const defaultClient = clients[0];
      setForm({
        client_id: defaultClient?.id || '',
        type: ENGAGEMENT_TYPES[0],
        phase: '1',
        phase_label: PHASE_LABELS['1'],
        next_milestone: '',
        notes: '',
        property: defaultClient?.property || '',
      });
    }
  }, [engagement, open, clients]);

  const handlePhaseChange = (phase: string) => {
    setForm(f => ({ ...f, phase, phase_label: PHASE_LABELS[phase] || '' }));
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setForm(f => ({ ...f, client_id: clientId, property: client?.property || f.property }));
  };

  const handleSubmit = async () => {
    if (!form.client_id || !form.type) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={engagement ? 'Edit Engagement' : 'New Engagement'} width={620}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Client */}
        {!engagement && (
          <div>
            <label style={labelStyle}>Client *</label>
            <select style={{ ...fieldStyle, cursor: 'pointer' }} value={form.client_id} onChange={e => handleClientChange(e.target.value)}>
              <option value="" style={{ background: '#1a1b1e' }}>Select client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#1a1b1e' }}>{c.name} — {c.area}</option>
              ))}
            </select>
          </div>
        )}

        {/* Type */}
        <div>
          <label style={labelStyle}>Engagement Type *</label>
          <select style={{ ...fieldStyle, cursor: 'pointer' }} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {ENGAGEMENT_TYPES.map(t => <option key={t} value={t} style={{ background: '#1a1b1e' }}>{t}</option>)}
          </select>
        </div>

        {/* Phase */}
        <div>
          <label style={labelStyle}>Current Phase</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {(['1', '2', '3', '4'] as const).map(p => (
              <button
                key={p}
                onClick={() => handlePhaseChange(p)}
                style={{
                  padding: '12px 8px',
                  background: form.phase === p ? 'rgba(201,169,110,0.12)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${form.phase === p ? 'rgba(201,169,110,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 6,
                  color: form.phase === p ? '#c9a96e' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: 1,
                  textAlign: 'center' as const,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: 16, marginBottom: 4 }}>{['I', 'II', 'III', 'IV'][parseInt(p) - 1]}</div>
                <div style={{ fontSize: 9, opacity: 0.7, lineHeight: 1.3 }}>{PHASE_LABELS[p].split(' ').slice(0, 2).join(' ')}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Property + Next Milestone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Property</label>
            <input style={fieldStyle} value={form.property} onChange={e => setForm(f => ({ ...f, property: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Next Milestone</label>
            <input style={fieldStyle} value={form.next_milestone} onChange={e => setForm(f => ({ ...f, next_milestone: e.target.value }))} placeholder="Vendor shortlist — May 22" />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Notes</label>
          <textarea
            style={{ ...fieldStyle, minHeight: 80, resize: 'vertical' as const }}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Internal notes about this engagement..."
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <button onClick={onClose} style={btnSecondary}>CANCEL</button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={saving || !form.client_id || !form.type}>
            {saving ? 'SAVING...' : engagement ? 'UPDATE' : 'CREATE'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
