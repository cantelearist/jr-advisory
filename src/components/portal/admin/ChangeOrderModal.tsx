'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal, { btnPrimary, btnSecondary, fieldStyle, labelStyle } from '../Modal';
import type {
  ChangeOrder,
  Client,
  Document as DBDocument,
  Engagement,
  Invoice,
} from '@/lib/database.types';

export interface ChangeOrderFormData {
  client_id: string;
  engagement_id: string;
  change_order_number: string;
  source_type: ChangeOrder['source_type'];
  source_invoice_id: string | null;
  source_document_id: string | null;
  title: string;
  description: string;
  amount_delta: number;
  status: 'draft' | 'sent';
}

interface Props {
  open: boolean;
  clients: Client[];
  engagements: Engagement[];
  invoices: Invoice[];
  documents: DBDocument[];
  onClose: () => void;
  onSave: (data: ChangeOrderFormData) => Promise<void>;
}

export default function ChangeOrderModal({
  open,
  clients,
  engagements,
  invoices,
  documents,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<ChangeOrderFormData>({
    client_id: '',
    engagement_id: '',
    change_order_number: '',
    source_type: 'invoice',
    source_invoice_id: null,
    source_document_id: null,
    title: '',
    description: '',
    amount_delta: 0,
    status: 'draft',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const clientEngagements = useMemo(
    () => engagements.filter((engagement) => engagement.client_id === form.client_id),
    [engagements, form.client_id],
  );
  const sourceInvoices = useMemo(
    () => invoices.filter(
      (invoice) =>
        invoice.client_id === form.client_id &&
        invoice.engagement_id === form.engagement_id,
    ),
    [invoices, form.client_id, form.engagement_id],
  );
  const sourceDocuments = useMemo(
    () => documents.filter(
      (document) =>
        document.client_id === form.client_id &&
        document.engagement_id === form.engagement_id &&
        ['contracts', 'proposals', 'nda', 'clearance'].includes(document.category),
    ),
    [documents, form.client_id, form.engagement_id],
  );

  useEffect(() => {
    if (!open) return;
    const clientId = clients[0]?.id || '';
    const engagementId = engagements.find(
      (engagement) => engagement.client_id === clientId,
    )?.id || '';
    const year = new Date().getFullYear();
    const suffix = String(Math.floor(Math.random() * 900) + 100);
    setForm({
      client_id: clientId,
      engagement_id: engagementId,
      change_order_number: `CO-${year}-${suffix}`,
      source_type: 'invoice',
      source_invoice_id: invoices.find(
        (invoice) =>
          invoice.client_id === clientId &&
          invoice.engagement_id === engagementId,
      )?.id || null,
      source_document_id: null,
      title: '',
      description: '',
      amount_delta: 0,
      status: 'draft',
    });
    setError('');
  }, [open, clients, engagements, invoices]);

  const selectClient = (clientId: string) => {
    const engagementId = engagements.find(
      (engagement) => engagement.client_id === clientId,
    )?.id || '';
    setForm((current) => ({
      ...current,
      client_id: clientId,
      engagement_id: engagementId,
      source_invoice_id: invoices.find(
        (invoice) =>
          invoice.client_id === clientId &&
          invoice.engagement_id === engagementId,
      )?.id || null,
      source_document_id: null,
    }));
  };

  const selectEngagement = (engagementId: string) => {
    setForm((current) => ({
      ...current,
      engagement_id: engagementId,
      source_invoice_id: invoices.find(
        (invoice) =>
          invoice.client_id === current.client_id &&
          invoice.engagement_id === engagementId,
      )?.id || null,
      source_document_id: null,
    }));
  };

  const handleSave = async () => {
    const hasSource = form.source_type === 'invoice'
      ? Boolean(form.source_invoice_id)
      : Boolean(form.source_document_id);
    if (
      !form.client_id ||
      !form.engagement_id ||
      !form.change_order_number.trim() ||
      !form.title.trim() ||
      !form.description.trim() ||
      !hasSource ||
      (form.source_type === 'invoice' && form.amount_delta === 0)
    ) {
      setError('Complete the client, engagement, original record, title, description, and financial change.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save change order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Change Order" width={640}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Client</label>
            <select
              style={{ ...fieldStyle, cursor: 'pointer' }}
              value={form.client_id}
              onChange={(event) => selectClient(event.target.value)}
            >
              <option value="" style={{ background: '#fff', color: '#323338' }}>Select...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id} style={{ background: '#fff', color: '#323338' }}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Engagement</label>
            <select
              style={{ ...fieldStyle, cursor: 'pointer' }}
              value={form.engagement_id}
              onChange={(event) => selectEngagement(event.target.value)}
            >
              <option value="" style={{ background: '#fff', color: '#323338' }}>Select...</option>
              {clientEngagements.map((engagement) => (
                <option key={engagement.id} value={engagement.id} style={{ background: '#fff', color: '#323338' }}>
                  {engagement.type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Change Order Number</label>
            <input
              style={fieldStyle}
              value={form.change_order_number}
              onChange={(event) => setForm((current) => ({
                ...current,
                change_order_number: event.target.value,
              }))}
            />
          </div>
          <div>
            <label style={labelStyle}>Original Record</label>
            <select
              style={{ ...fieldStyle, cursor: 'pointer' }}
              value={form.source_type}
              onChange={(event) => setForm((current) => ({
                ...current,
                source_type: event.target.value as ChangeOrder['source_type'],
                source_invoice_id: null,
                source_document_id: null,
              }))}
            >
              <option value="invoice" style={{ background: '#fff', color: '#323338' }}>Invoice</option>
              <option value="contract" style={{ background: '#fff', color: '#323338' }}>Contract Document</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            {form.source_type === 'invoice' ? 'Original Invoice' : 'Original Contract'}
          </label>
          {form.source_type === 'invoice' ? (
            <select
              style={{ ...fieldStyle, cursor: 'pointer' }}
              value={form.source_invoice_id || ''}
              onChange={(event) => setForm((current) => ({
                ...current,
                source_invoice_id: event.target.value || null,
              }))}
            >
              <option value="" style={{ background: '#fff', color: '#323338' }}>Select...</option>
              {sourceInvoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id} style={{ background: '#fff', color: '#323338' }}>
                  {invoice.invoice_number} — {invoice.description}
                </option>
              ))}
            </select>
          ) : (
            <select
              style={{ ...fieldStyle, cursor: 'pointer' }}
              value={form.source_document_id || ''}
              onChange={(event) => setForm((current) => ({
                ...current,
                source_document_id: event.target.value || null,
              }))}
            >
              <option value="" style={{ background: '#fff', color: '#323338' }}>Select...</option>
              {sourceDocuments.map((document) => (
                <option key={document.id} value={document.id} style={{ background: '#fff', color: '#323338' }}>
                  {document.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label style={labelStyle}>Title</label>
          <input
            style={fieldStyle}
            value={form.title}
            onChange={(event) => setForm((current) => ({
              ...current,
              title: event.target.value,
            }))}
            placeholder="Additional environmental sampling"
          />
        </div>

        <div>
          <label style={labelStyle}>Scope Change</label>
          <textarea
            style={{ ...fieldStyle, minHeight: 110, resize: 'vertical' }}
            value={form.description}
            onChange={(event) => setForm((current) => ({
              ...current,
              description: event.target.value,
            }))}
            placeholder="Describe what changed, why it changed, and the effect on the original scope."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Financial Change ($)</label>
            <input
              style={fieldStyle}
              type="number"
              step="0.01"
              value={form.amount_delta || ''}
              onChange={(event) => setForm((current) => ({
                ...current,
                amount_delta: Number(event.target.value) || 0,
              }))}
              placeholder="Use a negative amount for a credit"
            />
          </div>
          <div>
            <label style={labelStyle}>Initial Status</label>
            <select
              style={{ ...fieldStyle, cursor: 'pointer' }}
              value={form.status}
              onChange={(event) => setForm((current) => ({
                ...current,
                status: event.target.value as 'draft' | 'sent',
              }))}
            >
              <option value="draft" style={{ background: '#fff', color: '#323338' }}>Draft</option>
              <option value="sent" style={{ background: '#fff', color: '#323338' }}>Issue to Client</option>
            </select>
          </div>
        </div>

        {error && <div role="alert" style={{ color: '#fca5a5', fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose} style={btnSecondary}>CANCEL</button>
          <button onClick={handleSave} style={btnPrimary} disabled={saving}>
            {saving ? 'SAVING...' : form.status === 'sent' ? 'CREATE & ISSUE' : 'SAVE DRAFT'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
