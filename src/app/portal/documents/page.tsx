'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import PortalNav from '@/components/portal/PortalNav';

const Scene3D = dynamic(() => import('@/components/portal/Scene3D'), { ssr: false });

/* ── Mock documents ── */
const CATEGORIES = ['All', 'NDA', 'Lab Results', 'Proposals', 'Clearance', 'Invoices'];

const DOCUMENTS = [
  { id: 1, name: 'Mutual Non-Disclosure Agreement', category: 'NDA', date: 'Mar 14, 2026', size: '245 KB', status: 'signed' },
  { id: 2, name: 'IEP Assessment — Initial Survey', category: 'Lab Results', date: 'Mar 28, 2026', size: '1.8 MB', status: 'final' },
  { id: 3, name: 'Moisture Mapping Report — Zone A-C', category: 'Lab Results', date: 'Apr 5, 2026', size: '3.2 MB', status: 'final' },
  { id: 4, name: 'Air Quality Sampling Results', category: 'Lab Results', date: 'Apr 12, 2026', size: '2.1 MB', status: 'final' },
  { id: 5, name: 'Phase II Closeout Summary', category: 'Clearance', date: 'May 3, 2026', size: '890 KB', status: 'final' },
  { id: 6, name: 'Vendor Proposal — Pacific Remediation', category: 'Proposals', date: 'May 10, 2026', size: '1.4 MB', status: 'review' },
  { id: 7, name: 'Vendor Proposal — Westside Environmental', category: 'Proposals', date: 'May 11, 2026', size: '1.2 MB', status: 'review' },
  { id: 8, name: 'Vendor Proposal — Coastal Restoration', category: 'Proposals', date: 'May 13, 2026', size: '1.6 MB', status: 'review' },
  { id: 9, name: 'IEP Assessment — Final Report', category: 'Lab Results', date: 'May 15, 2026', size: '4.5 MB', status: 'new' },
  { id: 10, name: 'Engagement Retainer Invoice — Q2', category: 'Invoices', date: 'Apr 1, 2026', size: '124 KB', status: 'paid' },
  { id: 11, name: 'Site Visit Invoice — April', category: 'Invoices', date: 'Apr 30, 2026', size: '98 KB', status: 'paid' },
  { id: 12, name: 'Scope Comparison Matrix', category: 'Proposals', date: 'May 16, 2026', size: '340 KB', status: 'new' },
];

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  signed: { bg: 'rgba(201,169,110,0.1)', color: '#c9a96e', label: 'SIGNED' },
  final: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', label: 'FINAL' },
  review: { bg: 'rgba(110,169,201,0.1)', color: '#6ea9c9', label: 'IN REVIEW' },
  new: { bg: 'rgba(169,201,110,0.1)', color: '#a9c96e', label: 'NEW' },
  paid: { bg: 'rgba(110,201,150,0.1)', color: '#6ec9a0', label: 'PAID' },
};

export default function PortalDocuments() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredDoc, setHoveredDoc] = useState<number | null>(null);

  const filtered = activeCategory === 'All'
    ? DOCUMENTS
    : DOCUMENTS.filter(d => d.category === activeCategory);

  return (
    <div className="vault">
      <Scene3D variant="vault" />
      <PortalNav />
      <div className="vault__vignette" />

      <main className="vault__main">
        {/* Header */}
        <section className="vault__hero">
          <span className="vault__label">DOCUMENT VAULT</span>
          <h1 className="vault__title">Your Files</h1>
          <p className="vault__sub">
            {DOCUMENTS.length} documents · Encrypted at rest · Signed URLs
          </p>
        </section>

        {/* Category filter */}
        <div className="vault__filters">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`vault__filter ${activeCategory === cat ? 'vault__filter--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
              {cat !== 'All' && (
                <span className="vault__filter-count">
                  {DOCUMENTS.filter(d => d.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Document list */}
        <div className="vault__list">
          {filtered.map((doc, i) => {
            const status = STATUS_STYLES[doc.status];
            return (
              <div
                key={doc.id}
                className="vault__doc"
                style={{ animationDelay: `${i * 0.05}s` }}
                onMouseEnter={() => setHoveredDoc(doc.id)}
                onMouseLeave={() => setHoveredDoc(null)}
              >
                <div className="vault__doc-icon">
                  <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                    <path d="M0 2C0 0.9 0.9 0 2 0H12L20 8V22C20 23.1 19.1 24 18 24H2C0.9 24 0 23.1 0 22V2Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
                    <path d="M12 0V6C12 7.1 12.9 8 14 8H20" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
                  </svg>
                </div>

                <div className="vault__doc-info">
                  <span className="vault__doc-name">{doc.name}</span>
                  <span className="vault__doc-meta">
                    {doc.category} · {doc.size}
                  </span>
                </div>

                <span
                  className="vault__doc-status"
                  style={{ background: status.bg, color: status.color }}
                >
                  {status.label}
                </span>

                <span className="vault__doc-date">{doc.date}</span>

                <button
                  className="vault__doc-action"
                  style={{
                    opacity: hoveredDoc === doc.id ? 1 : 0,
                  }}
                >
                  ↓
                </button>
              </div>
            );
          })}
        </div>
      </main>

      <style jsx>{`
        .vault {
          position: relative;
          min-height: 100vh;
          background: #000;
        }
        .vault__vignette {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at 70% 30%, transparent 20%, rgba(0,0,0,0.9) 100%);
          z-index: 1;
          pointer-events: none;
        }
        .vault__main {
          position: relative;
          z-index: 10;
          padding: 120px 60px 60px;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ── Hero ── */
        .vault__hero {
          margin-bottom: 48px;
          opacity: 0;
          animation: vaultReveal 1s ease 0.2s forwards;
        }
        .vault__label {
          font-family: 'Archivo', sans-serif;
          font-size: 10px;
          letter-spacing: 0.4em;
          color: rgba(201, 169, 110, 0.5);
        }
        .vault__title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(40px, 6vw, 80px);
          font-weight: 300;
          color: #fff;
          margin: 12px 0 16px;
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .vault__sub {
          font-family: 'Archivo', sans-serif;
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.1em;
        }

        /* ── Filters ── */
        .vault__filters {
          display: flex;
          gap: 8px;
          margin-bottom: 40px;
          opacity: 0;
          animation: vaultReveal 1s ease 0.35s forwards;
          flex-wrap: wrap;
        }
        .vault__filter {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.35);
          font-family: 'Archivo', sans-serif;
          font-size: 11px;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.4s ease;
        }
        .vault__filter:hover {
          border-color: rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.6);
        }
        .vault__filter--active {
          border-color: rgba(201, 169, 110, 0.3);
          color: #c9a96e;
          background: rgba(201, 169, 110, 0.05);
        }
        .vault__filter-count {
          font-size: 9px;
          opacity: 0.5;
        }

        /* ── Document list ── */
        .vault__list {
          display: flex;
          flex-direction: column;
        }
        .vault__doc {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          opacity: 0;
          animation: vaultReveal 0.8s ease forwards;
        }
        .vault__doc:hover {
          background: rgba(255,255,255,0.02);
          padding-left: 32px;
          border-color: rgba(201, 169, 110, 0.08);
        }
        .vault__doc-icon {
          flex-shrink: 0;
          opacity: 0.4;
          transition: opacity 0.3s;
        }
        .vault__doc:hover .vault__doc-icon { opacity: 0.7; }
        .vault__doc-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .vault__doc-name {
          font-family: 'Archivo', sans-serif;
          font-size: 14px;
          color: rgba(255,255,255,0.75);
          letter-spacing: 0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.3s;
        }
        .vault__doc:hover .vault__doc-name { color: #fff; }
        .vault__doc-meta {
          font-family: 'Archivo', sans-serif;
          font-size: 10px;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.08em;
        }
        .vault__doc-status {
          flex-shrink: 0;
          padding: 4px 12px;
          font-family: 'Archivo', sans-serif;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }
        .vault__doc-date {
          flex-shrink: 0;
          font-family: 'Archivo', sans-serif;
          font-size: 11px;
          color: rgba(255,255,255,0.15);
          letter-spacing: 0.05em;
          width: 100px;
          text-align: right;
        }
        .vault__doc-action {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(201, 169, 110, 0.1);
          border: 1px solid rgba(201, 169, 110, 0.2);
          color: #c9a96e;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .vault__doc-action:hover {
          background: rgba(201, 169, 110, 0.2);
        }

        @keyframes vaultReveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .vault__main { padding: 100px 20px 40px; }
          .vault__doc { flex-wrap: wrap; gap: 12px; padding: 16px; }
          .vault__doc-date { width: auto; text-align: left; }
          .vault__doc-action { opacity: 1 !important; }
        }
      `}</style>
    </div>
  );
}
