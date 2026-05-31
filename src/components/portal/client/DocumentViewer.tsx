'use client';

import { useState, useCallback } from 'react';
import type { DocItem } from './DocumentList';
import './documents.css';

/* Sample document content — fallback when no real file is attached */
const SAMPLE_CONTENT: Record<string, string> = {
  nda: `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of the date
of execution by and between James Roman Advisory ("Firm") and the undersigned
Client ("Receiving Party").

1. CONFIDENTIAL INFORMATION
All information disclosed by either party, whether oral, written, or electronic,
relating to the property, engagement scope, environmental findings, personal
identity, or financial details shall be considered Confidential Information.

2. OBLIGATIONS
The Receiving Party agrees to:
(a) Maintain all Confidential Information in strict confidence
(b) Not disclose Confidential Information to any third party
(c) Use Confidential Information solely for the purpose of the engagement

3. TERM — Five (5) years from date of execution.

[Signature blocks redacted for sample purposes]`,

  'lab-results': `INDEPENDENT ENVIRONMENTAL ASSESSMENT — Laboratory Analysis Report

Client: [REDACTED]    Property: [REDACTED], California

Air Sampling Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Zone A (West Wing)      Stachybotrys:  2,400 spores/m³  ▲ ELEVATED
Zone B (Primary Bath)   Aspergillus:   1,800 spores/m³  ▲ ELEVATED
Zone C (HVAC Return)    Penicillium:     950 spores/m³  ● MODERATE
Exterior Baseline       Mixed flora:     320 spores/m³  ○ NORMAL

INTERPRETATION
Elevated spore counts in Zones A and B are consistent with active microbial
growth from sustained moisture intrusion. Remediation recommended per
IICRC S520 standards.`,

  proposals: `REMEDIATION PROPOSAL — SCOPE COMPARISON

VENDOR A — Pacific Remediation Group
  Approach:    Full containment, simultaneous zones
  Timeline:    18 working days · Crew: 8-10
  Guarantee:   2-year warranty with annual re-test

VENDOR B — Westside Environmental
  Approach:    Phased containment, zone-by-zone
  Timeline:    28 working days · Crew: 4-6
  Guarantee:   1-year warranty

RECOMMENDATION: Vendor A — more comprehensive scope, better
luxury residential experience.`,

  clearance: `POST-REMEDIATION CLEARANCE REPORT

CLEARANCE TESTING RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Zone A   180 spores/m³  ✓ CLEAR
Zone B   210 spores/m³  ✓ CLEAR
Zone C   140 spores/m³  ✓ CLEAR

DETERMINATION
All zones meet clearance criteria. Property cleared for
re-occupancy and reconstruction.`,

  invoices: `JAMES ROMAN ADVISORY — Invoice

Services rendered for environmental advisory engagement.
See invoice detail in the Invoices & Payments section.`,

  reports: `SITE DOCUMENTATION REPORT

Executive summary of initial site assessment and photographic survey.
All findings are confidential per the standing NDA.`,
};

interface DocumentViewerProps {
  document: DocItem;
  onClose: () => void;
}

export default function DocumentViewer({ document: doc, onClose }: DocumentViewerProps) {
  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState('');
  const hasFile = !!doc.filePath;
  const content = SAMPLE_CONTENT[doc.rawCategory] || SAMPLE_CONTENT['reports'] || '';

  /* Determine if the file is previewable in-browser */
  const isPreviewable = doc.mimeType?.startsWith('image/') ||
    doc.mimeType === 'application/pdf';

  /* Download file via signed URL */
  const handleDownload = useCallback(async () => {
    if (!doc.id) return;
    setDownloading(true);
    setPreviewError('');
    try {
      const res = await fetch(`/api/documents/download?id=${doc.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Download failed');

      // Open signed URL — triggers browser download
      const link = document.createElement('a');
      link.href = data.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.download = data.name || doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: unknown) {
      setPreviewError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  }, [doc.id, doc.name]);

  /* Preview file in modal (images, PDFs) */
  const handlePreview = useCallback(async () => {
    if (!doc.id || previewUrl) return;
    setDownloading(true);
    setPreviewError('');
    try {
      const res = await fetch(`/api/documents/download?id=${doc.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed');
      setPreviewUrl(data.url);
    } catch (e: unknown) {
      setPreviewError(e instanceof Error ? e.message : 'Preview failed');
    } finally {
      setDownloading(false);
    }
  }, [doc.id, previewUrl]);

  return (
    <div className="viewer" onClick={onClose}>
      <div className="viewer__panel" onClick={(e) => e.stopPropagation()}>
        <div className="viewer__header">
          <div>
            <span className="viewer__label">{doc.category} · {doc.size}</span>
            <h2 className="viewer__title">{doc.name}</h2>
            <span className="viewer__date">{doc.date}</span>
          </div>
          <button className="viewer__close" onClick={onClose}>✕</button>
        </div>

        <div className="viewer__body">
          {/* In-browser preview for images/PDFs */}
          {previewUrl && doc.mimeType?.startsWith('image/') && (
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              {/* Dynamic signed URL — next/image can't handle this */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={doc.name}
                style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
          )}
          {previewUrl && doc.mimeType === 'application/pdf' && (
            <iframe
              src={previewUrl}
              title={doc.name}
              style={{ width: '100%', height: '60vh', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, background: '#fff' }}
            />
          )}

          {/* Sample content fallback when no real file */}
          {!previewUrl && (
            <pre className="viewer__content">{content}</pre>
          )}

          {previewError && (
            <p style={{ color: '#ef4444', fontSize: 12, marginTop: 12, fontFamily: 'Inter, sans-serif' }}>
              {previewError}
            </p>
          )}
        </div>

        <div className="viewer__footer">
          <span className="viewer__encrypted">⬡ {hasFile ? 'Stored in Secure Vault' : 'Sample Content'}</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {hasFile && isPreviewable && !previewUrl && (
              <button
                className="viewer__action-btn"
                onClick={handlePreview}
                disabled={downloading}
              >
                {downloading ? 'Loading…' : '⏿ Preview'}
              </button>
            )}
            {hasFile && (
              <button
                className="viewer__action-btn viewer__action-btn--primary"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? 'Preparing…' : '↓ Download'}
              </button>
            )}
            {!hasFile && (
              <span className="viewer__notice">Demo document — no file attached</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
