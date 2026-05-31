'use client';

import { useState } from 'react';
import './documents.css';

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  signed: { bg: 'rgba(201,169,110,0.1)', color: '#c9a96e', label: 'SIGNED' },
  final:  { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', label: 'FINAL' },
  review: { bg: 'rgba(110,169,201,0.1)', color: '#6ea9c9', label: 'IN REVIEW' },
  new:    { bg: 'rgba(169,201,110,0.1)', color: '#a9c96e', label: 'NEW' },
  paid:   { bg: 'rgba(110,201,150,0.1)', color: '#6ec9a0', label: 'PAID' },
};

export interface DocItem {
  id: number;
  name: string;
  category: string;
  date: string;
  size: string;
  status: string;
  rawCategory: string;
}

interface DocumentListProps {
  documents: DocItem[];
  onViewDocument: (doc: DocItem) => void;
}

export default function DocumentList({ documents, onViewDocument }: DocumentListProps) {
  const [hoveredDoc, setHoveredDoc] = useState<number | null>(null);

  if (documents.length === 0) {
    return (
      <div className="portal-empty">
        <div className="portal-empty__icon">⬡</div>
        <h3 className="portal-empty__title">No documents found</h3>
        <p className="portal-empty__sub">Try adjusting your search or filter</p>
      </div>
    );
  }

  return (
    <div className="vault__list">
      {documents.map((doc, i) => {
        const status = STATUS_STYLES[doc.status];
        return (
          <div
            key={doc.id}
            className="vault__doc"
            style={{ animationDelay: `${i * 0.05}s` }}
            onMouseEnter={() => setHoveredDoc(doc.id)}
            onMouseLeave={() => setHoveredDoc(null)}
            onClick={() => onViewDocument(doc)}
          >
            <div className="vault__doc-icon">
              <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                <path
                  d="M0 2C0 0.9 0.9 0 2 0H12L20 8V22C20 23.1 19.1 24 18 24H2C0.9 24 0 23.1 0 22V2Z"
                  fill="rgba(255,255,255,0.04)"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.5"
                />
                <path
                  d="M12 0V6C12 7.1 12.9 8 14 8H20"
                  fill="rgba(255,255,255,0.02)"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.5"
                />
              </svg>
            </div>
            <div className="vault__doc-info">
              <span className="vault__doc-name" title={doc.name}>{doc.name}</span>
              <span className="vault__doc-meta">{doc.category} · {doc.size}</span>
            </div>
            <span
              className="vault__doc-status"
              style={{ background: status?.bg, color: status?.color }}
            >
              {status?.label}
            </span>
            <span className="vault__doc-date">{doc.date}</span>
            <button
              className="vault__doc-action"
              style={{ opacity: hoveredDoc === doc.id ? 1 : 0 }}
              onClick={(e) => { e.stopPropagation(); onViewDocument(doc); }}
            >
              ⬡
            </button>
          </div>
        );
      })}
    </div>
  );
}
