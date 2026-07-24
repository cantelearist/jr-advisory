'use client';

/* ── Document Upload Modal — Admin uploads files to client vaults ── */

import { useState, useRef } from 'react';
import type { Client, Engagement, DocCategory } from '@/lib/database.types';

interface DocumentUploadProps {
  clients: Client[];
  engagements: Engagement[];
  onUploadComplete: () => void;
  onClose: () => void;
}

const CATEGORIES: { value: DocCategory; label: string }[] = [
  { value: 'nda', label: 'NDA' },
  { value: 'lab-results', label: 'Lab Results' },
  { value: 'proposals', label: 'Proposals' },
  { value: 'clearance', label: 'Clearance Letters' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'reports', label: 'Reports' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'change-orders', label: 'Change Orders' },
];

export default function DocumentUpload({ clients, engagements, onUploadComplete, onClose }: DocumentUploadProps) {
  const [clientId, setClientId] = useState('');
  const [engagementId, setEngagementId] = useState('');
  const [category, setCategory] = useState<DocCategory>('nda');
  const [docName, setDocName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const clientEngagements = engagements.filter(e => e.client_id === clientId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (!docName) {
        setDocName(f.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !clientId || !engagementId || !category || !docName) {
      setError('All fields are required');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('client_id', clientId);
      formData.append('engagement_id', engagementId);
      formData.append('category', category);
      formData.append('name', docName);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess(
        data.notification?.emailSent
          ? `✓ Uploaded "${docName}" and emailed the client`
          : `✓ Uploaded "${docName}" · email notification was not delivered`,
      );
      setFile(null);
      setDocName('');
      if (fileRef.current) fileRef.current.value = '';
      onUploadComplete();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="doc-upload-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="doc-upload">
        <div className="doc-upload__header">
          <h3 className="doc-upload__title">Upload Document</h3>
          <button className="doc-upload__close" onClick={onClose}>✕</button>
        </div>

        <div className="doc-upload__form">
          {/* Client select */}
          <div className="doc-upload__field">
            <label className="doc-upload__label">Client</label>
            <select
              className="doc-upload__select"
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setEngagementId(''); }}
            >
              <option value="">Select client…</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Engagement select */}
          <div className="doc-upload__field">
            <label className="doc-upload__label">Engagement</label>
            <select
              className="doc-upload__select"
              value={engagementId}
              onChange={(e) => setEngagementId(e.target.value)}
              disabled={!clientId}
            >
              <option value="">Select engagement…</option>
              {clientEngagements.map(e => (
                <option key={e.id} value={e.id}>{e.type} — {e.property}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="doc-upload__field">
            <label className="doc-upload__label">Category</label>
            <select
              className="doc-upload__select"
              value={category}
              onChange={(e) => setCategory(e.target.value as DocCategory)}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Document name */}
          <div className="doc-upload__field">
            <label className="doc-upload__label">Document Name</label>
            <input
              type="text"
              className="doc-upload__input"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Phase 2 Lab Results — Malibu"
            />
          </div>

          {/* File picker */}
          <div className="doc-upload__field">
            <label className="doc-upload__label">File</label>
            <div
              className={`doc-upload__dropzone ${file ? 'doc-upload__dropzone--has-file' : ''}`}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="doc-upload__file-info">
                  <span className="doc-upload__file-icon">📄</span>
                  <div>
                    <div className="doc-upload__file-name">{file.name}</div>
                    <div className="doc-upload__file-size">{formatSize(file.size)}</div>
                  </div>
                </div>
              ) : (
                <div className="doc-upload__drop-text">
                  <span className="doc-upload__drop-icon">↑</span>
                  <span>Click to select file</span>
                  <span className="doc-upload__drop-hint">PDF, Word, Excel, images — max 50MB</span>
                </div>
              )}
            </div>
          </div>

          {error && <p className="doc-upload__error">{error}</p>}
          {success && <p className="doc-upload__success">{success}</p>}

          <button
            className="doc-upload__submit"
            onClick={handleUpload}
            disabled={uploading || !file || !clientId || !engagementId}
          >
            {uploading ? 'Uploading…' : 'Upload to Vault'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .doc-upload-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .doc-upload {
          background: #111; border: 1px solid rgba(255,255,255,0.08);
          width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
        }
        .doc-upload__header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 24px 28px 0;
        }
        .doc-upload__title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 22px; font-weight: 300; color: #fff; margin: 0;
        }
        .doc-upload__close {
          background: none; border: none; color: rgba(255,255,255,0.3);
          font-size: 18px; cursor: pointer; padding: 4px;
        }
        .doc-upload__close:hover { color: #fff; }
        .doc-upload__form {
          padding: 24px 28px 28px;
          display: flex; flex-direction: column; gap: 20px;
        }
        .doc-upload__field { display: flex; flex-direction: column; gap: 6px; }
        .doc-upload__label {
          font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 400;
          letter-spacing: 0.25em; color: rgba(255,255,255,0.3); text-transform: uppercase;
        }
        .doc-upload__select, .doc-upload__input {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          padding: 12px 16px; color: #fff; font-family: 'Inter', sans-serif;
          font-size: 14px; outline: none; transition: border-color 0.3s;
          -webkit-appearance: none; border-radius: 0;
        }
        .doc-upload__select:focus, .doc-upload__input:focus {
          border-color: rgba(201,169,110,0.4);
        }
        .doc-upload__select option { background: #111; color: #fff; }
        .doc-upload__dropzone {
          border: 1px dashed rgba(255,255,255,0.12); padding: 28px;
          text-align: center; cursor: pointer; transition: all 0.3s;
        }
        .doc-upload__dropzone:hover { border-color: rgba(201,169,110,0.3); background: rgba(201,169,110,0.02); }
        .doc-upload__dropzone--has-file { border-style: solid; border-color: rgba(201,169,110,0.2); }
        .doc-upload__drop-text {
          display: flex; flex-direction: column; gap: 8px; align-items: center;
          font-family: 'Inter', sans-serif; font-size: 13px; color: rgba(255,255,255,0.3);
        }
        .doc-upload__drop-icon { font-size: 24px; color: rgba(201,169,110,0.5); }
        .doc-upload__drop-hint { font-size: 10px; color: rgba(255,255,255,0.15); letter-spacing: 0.05em; }
        .doc-upload__file-info {
          display: flex; align-items: center; gap: 12px; text-align: left;
        }
        .doc-upload__file-icon { font-size: 28px; }
        .doc-upload__file-name {
          font-family: 'Inter', sans-serif; font-size: 13px; color: rgba(255,255,255,0.7);
        }
        .doc-upload__file-size {
          font-family: 'Inter', sans-serif; font-size: 11px; color: rgba(255,255,255,0.25); margin-top: 2px;
        }
        .doc-upload__error {
          font-family: 'Inter', sans-serif; font-size: 12px; color: #ef4444;
          margin: 0; letter-spacing: 0.03em;
        }
        .doc-upload__success {
          font-family: 'Inter', sans-serif; font-size: 12px; color: #4ade80;
          margin: 0; letter-spacing: 0.03em;
        }
        .doc-upload__submit {
          width: 100%; padding: 16px; background: transparent;
          border: 1px solid rgba(201,169,110,0.3); color: #c9a96e;
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 400;
          letter-spacing: 0.3em; text-transform: uppercase; cursor: pointer;
          transition: all 0.4s;
        }
        .doc-upload__submit:hover:not(:disabled) {
          border-color: rgba(201,169,110,0.6); background: rgba(201,169,110,0.05);
        }
        .doc-upload__submit:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
