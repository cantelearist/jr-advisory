'use client';

import { useState, useEffect } from 'react';
import Modal, { fieldStyle, labelStyle, btnPrimary, btnSecondary } from '../Modal';
import type { Client, Engagement, Invoice } from '@/lib/database.types';

interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: InvoiceFormData) => Promise<void>;
  invoice?: Invoice | null;
  clients: Client[];
  engagements: Engagement[];
}

export interface InvoiceFormData {
  client_id: string;
  engagement_id: string;
  invoice_number: string;
  description: string;
  amount: number;
  due_date: string;
  status: Invoice['status'];
  notes: string;
}

export default function InvoiceModal({ open, onClose, onSave, invoice, clients, engagements }: InvoiceModalProps) {
  const [form, setForm] = useState<InvoiceFormData>({
    client_id: '', engagement_id: '', invoice_number: '', description: '',
    amount: 0, due_date: '', status: 'draft', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const clientEngagements = engagements.filter(e => e.client_id === form.client_id);

  useEffect(() => {
    if (invoice) {
      setForm({
        client_id: invoice.client_id,
        engagement_id: invoice.engagement_id,
        invoice_number: invoice.invoice_number,
        description: invoice.description,
        amount: Number(invoice.amount),
        due_date: invoice.due_date,
        status: invoice.status,
        notes: invoice.notes || '',
      });
    } else {
      // Generate next invoice number
      const year = new Date().getFullYear();
      const num = String(Math.floor(Math.random() * 900) + 100);
      setForm({
        client_id: clients[0]?.id || '',
        engagement_id: '',
        invoice_number: `JRA-${year}-${num}`,
        description: '',
        amount: 0,
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'draft',
        notes: '',
      });
    }
  }, [invoice, open, clients]);

  const handleSubmit = async () => {
    if (!form.client_id || !form.description || !form.amount) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={invoice ? 'Edit Invoice' : 'New Invoice'} width={580}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Client + Engagement */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Client *</label>
            <select style={{ ...fieldStyle, cursor: 'pointer' }} value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value, engagement_id: '' }))}>
              <option value="" style={{ background: '#1a1b1e' }}>Select...</option>
              {clients.map(c => <option key={c.id} value={c.id} style={{ background: '#1a1b1e' }}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Engagement</label>
            <select style={{ ...fieldStyle, cursor: 'pointer' }} value={form.engagement_id} onChange={e => setForm(f => ({ ...f, engagement_id: e.target.value }))}>
              <option value="" style={{ background: '#1a1b1e' }}>Select...</option>
              {clientEngagements.map(e => <option key={e.id} value={e.id} style={{ background: '#1a1b1e' }}>{e.type}</option>)}
            </select>
          </div>
        </div>

        {/* Invoice # + Amount */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Invoice Number</label>
            <input style={fieldStyle} value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Amount ($) *</label>
            <input style={fieldStyle} type="number" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} placeholder="4500" />
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description *</label>
          <input style={fieldStyle} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Phase I — Confidential Consultation" />
        </div>

        {/* Due Date + Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Due Date</label>
            <input style={fieldStyle} type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={{ ...fieldStyle, cursor: 'pointer' }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Invoice['status'] }))}>
              <option value="draft" style={{ background: '#1a1b1e' }}>Draft</option>
              <option value="sent" style={{ background: '#1a1b1e' }}>Sent</option>
              <option value="paid" style={{ background: '#1a1b1e' }}>Paid</option>
              <option value="overdue" style={{ background: '#1a1b1e' }}>Overdue</option>
              <option value="cancelled" style={{ background: '#1a1b1e' }}>Cancelled</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Notes</label>
          <input style={fieldStyle} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Net 30, etc." />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <button onClick={onClose} style={btnSecondary}>CANCEL</button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={saving || !form.client_id || !form.description || !form.amount}>
            {saving ? 'SAVING...' : invoice ? 'UPDATE' : 'CREATE'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
