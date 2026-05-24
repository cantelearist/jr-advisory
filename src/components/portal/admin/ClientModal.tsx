'use client';

import { useState, useEffect } from 'react';
import Modal, { fieldStyle, labelStyle, btnPrimary, btnSecondary, btnDanger } from '../Modal';
import type { Client } from '@/lib/database.types';

interface ClientModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ClientFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  client?: Client | null;
}

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  property: string;
  area: string;
  status: Client['status'];
}

const AREAS = ['Malibu', 'Beverly Hills', 'Bel Air', 'Brentwood', 'Pacific Palisades', 'Santa Monica'];

export default function ClientModal({ open, onClose, onSave, onDelete, client }: ClientModalProps) {
  const [form, setForm] = useState<ClientFormData>({
    name: '', email: '', phone: '', property: '', area: 'Malibu', status: 'pending',
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        property: client.property,
        area: client.area,
        status: client.status,
      });
    } else {
      setForm({ name: '', email: '', phone: '', property: '', area: 'Malibu', status: 'pending' });
    }
    setConfirmDelete(false);
  }, [client, open]);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.property) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    try {
      await onDelete?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={client ? 'Edit Client' : 'New Client'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Name */}
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input style={fieldStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Alexandra Whitfield" />
        </div>

        {/* Email + Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Email *</label>
            <input style={fieldStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="client@proton.me" type="email" />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input style={fieldStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (310) 555-0142" />
          </div>
        </div>

        {/* Property */}
        <div>
          <label style={labelStyle}>Property Address *</label>
          <input style={fieldStyle} value={form.property} onChange={e => setForm(f => ({ ...f, property: e.target.value }))} placeholder="1247 Pacific Coast Highway, Malibu" />
        </div>

        {/* Area + Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Area</label>
            <select style={{ ...fieldStyle, cursor: 'pointer' }} value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}>
              {AREAS.map(a => <option key={a} value={a} style={{ background: '#1a1b1e' }}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={{ ...fieldStyle, cursor: 'pointer' }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Client['status'] }))}>
              <option value="pending" style={{ background: '#1a1b1e' }}>Pending</option>
              <option value="active" style={{ background: '#1a1b1e' }}>Active</option>
              <option value="completed" style={{ background: '#1a1b1e' }}>Completed</option>
              <option value="archived" style={{ background: '#1a1b1e' }}>Archived</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <div>
            {client && onDelete && (
              <button onClick={handleDelete} style={btnDanger} disabled={saving}>
                {confirmDelete ? 'CONFIRM DELETE' : 'DELETE'}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={btnSecondary}>CANCEL</button>
            <button onClick={handleSubmit} style={btnPrimary} disabled={saving || !form.name || !form.email || !form.property}>
              {saving ? 'SAVING...' : client ? 'UPDATE' : 'CREATE'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
