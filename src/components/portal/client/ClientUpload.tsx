'use client';

/* ── Client Upload — clients can upload documents to their vault ── */

import { useState, useRef, useCallback } from 'react';
import type { DocCategory } from '@/lib/database.types';
import './documents.css';

interface ClientUploadProps {
  engagementId: string;
  clientId: string;
  onUploadComplete: () => void;
  onClose: () => void;
}

const CATEGORIES: { value: DocCategory; label: string }[] = [
  { value: 'reports', label: 'Reports' },
  { value: 'lab-results', label: 'Lab Results' },
  { value: 'proposals', label: 'Proposals' },
  { value: 'invoices', label: 'Invoices' },
];

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp';

export default function ClientUpload({ engagementId, clientId, onUploadComplete, onClose }: ClientUploadProps) {
  const [category, setCategory] = useState<DocCategory>('reports');
  const [docName, setDocName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleFileSelect = useCallback((f: File) => {
    if (f.size > 52428800) {
      setError('File size exceeds 50 MB limit');
      return;
    }
    setFile(f);
    setError('');
    if (!docName) {
      setDocName(f.name.replace(/\.[^/.]+$/, ''));
    }
  }, [docName]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleUpload = async () => {
    if (!file || !category || !docName) {
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

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setSuccess(`✓ "${docName}" uploaded to vault`);
      setFile(null);
      setDocName('');
      if (fileRef.current) fileRef.current.value = '';

      // Delay close so user sees success
      setTimeout(() => {
        onUploadComplete();
        onClose();
      }, 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="viewer" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="viewer__panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="viewer__header">
          <div>
            <span className="viewer__label">DOCUMENT VAULT</span>
            <h2 className="viewer__title">Upload Document</h2>
          </div>
          <button className="viewer__close" onClick={onClose}>✕</button>
        </div>

        <div className="viewer__body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Category select */}
          <div className="upload-field">
            <label className="upload-field__label">Category</label>
            <select
              className="upload-field__input"
              value={category}
              onChange={(e) => setCategory(e.target.value as DocCategory)}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Document name */}
          <div className="upload-field">
            <label className="upload-field__label">Document Name</label>
            <input
              type="text"
              className="upload-field__input"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Lab Results — Phase II"
            />
          </div>

          {/* Drag-and-drop zone */}
          <div
            className={`upload-dropzone ${dragActive ? 'upload-dropzone--active' : ''} ${file ? 'upload-dropzone--has-file' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileRef}
              type="file"
              style={{ display: 'none' }}
              accept={ACCEPTED_TYPES}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
            {file ? (
              <div className="upload-dropzone__file">
                <span className="upload-dropzone__file-icon">📄</span>
                <div>
                  <div className="upload-dropzone__file-name">{file.name}</div>
                  <div className="upload-dropzone__file-size">{formatSize(file.size)}</div>
                </div>
                <button
                  className="upload-dropzone__remove"
                  onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="upload-dropzone__empty">
                <span className="upload-dropzone__icon">↑</span>
                <span className="upload-dropzone__text">
                  {dragActive ? 'Drop file here' : 'Click or drag file to upload'}
                </span>
                <span className="upload-dropzone__hint">PDF, Word, Excel, images — max 50 MB</span>
              </div>
            )}
          </div>

          {error && <p className="upload-msg upload-msg--error">{error}</p>}
          {success && <p className="upload-msg upload-msg--success">{success}</p>}
        </div>

        <div className="viewer__footer" style={{ justifyContent: 'flex-end', gap: 12 }}>
          <button className="viewer__action-btn" onClick={onClose}>Cancel</button>
          <button
            className="viewer__action-btn viewer__action-btn--primary"
            onClick={handleUpload}
            disabled={uploading || !file || !docName}
          >
            {uploading ? 'Uploading…' : 'Upload to Vault'}
          </button>
        </div>
      </div>
    </div>
  );
}
