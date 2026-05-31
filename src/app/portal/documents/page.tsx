'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import PortalNav from '@/components/portal/PortalNav';
import { useAuth } from '@/components/portal/AuthProvider';
import { fetchPortalData } from '@/lib/portal-data';
import LoadingSkeleton from '@/components/portal/client/LoadingSkeleton';
import DocumentSearch from '@/components/portal/client/DocumentSearch';
import DocumentList, { type DocItem } from '@/components/portal/client/DocumentList';
import DocumentViewer from '@/components/portal/client/DocumentViewer';
import type { Document as DBDocument } from '@/lib/database.types';

const Scene3D = dynamic(() => import('@/components/portal/Scene3D'), { ssr: false });

const CATEGORIES = ['All', 'NDA', 'Lab Results', 'Proposals', 'Clearance', 'Invoices', 'Reports'];

const CATEGORY_MAP: Record<string, string> = {
  nda: 'NDA', 'lab-results': 'Lab Results', proposals: 'Proposals',
  clearance: 'Clearance', invoices: 'Invoices', reports: 'Reports',
};

const STATUS_MAP: Record<string, string> = {
  final: 'final', draft: 'review', 'pending-review': 'new',
};

export default function PortalDocuments() {
  const { supabase } = useAuth();
  const [clientDocs, setClientDocs] = useState<DBDocument[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingDoc, setViewingDoc] = useState<DocItem | null>(null);

  useEffect(() => {
    fetchPortalData().then(data => {
      if (data.documents.length > 0) setClientDocs(data.documents);
      setLoaded(true);
    });
  }, []);

  /* Map DB docs to display items */
  const documents: DocItem[] = useMemo(() =>
    clientDocs.map((d, i) => ({
      id: i + 1,
      name: d.name,
      category: CATEGORY_MAP[d.category] || d.category,
      rawCategory: d.category,
      date: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      size: d.file_size || '—',
      status: STATUS_MAP[d.status] || d.status,
    })),
    [clientDocs]
  );

  /* Filter + search */
  const filtered = useMemo(() => {
    let result = documents;
    if (activeCategory !== 'All') {
      result = result.filter(d => d.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [documents, activeCategory, searchQuery]);

  /* Category counts (always from full set, ignoring search) */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach(d => { counts[d.category] = (counts[d.category] || 0) + 1; });
    return counts;
  }, [documents]);

  if (!loaded) return <LoadingSkeleton label="LOADING VAULT" />;

  return (
    <div className="vault">
      <Scene3D variant="vault" />
      <PortalNav />
      <div className="vault__vignette" />

      <main className="vault__main">
        {/* Hero */}
        <section className="vault__hero">
          <span className="vault__label">DOCUMENT VAULT</span>
          <h1 className="vault__title">Your Files</h1>
          <p className="vault__sub">
            {documents.length} documents · Encrypted at rest · Signed URLs
          </p>
        </section>

        {/* Search + Category Filters */}
        <DocumentSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          categories={CATEGORIES}
          categoryCounts={categoryCounts}
          resultCount={filtered.length}
          totalCount={documents.length}
        />

        {/* Document List */}
        <DocumentList
          documents={filtered}
          onViewDocument={setViewingDoc}
        />
      </main>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <DocumentViewer document={viewingDoc} onClose={() => setViewingDoc(null)} />
      )}

      <style jsx>{`
        .vault { position: relative; min-height: 100vh; background: #000; }
        .vault__vignette {
          position: fixed; inset: 0;
          background: radial-gradient(ellipse at 70% 30%, transparent 20%, rgba(0,0,0,0.9) 100%);
          z-index: 1; pointer-events: none;
        }
        .vault__main {
          position: relative; z-index: 10;
          padding: 120px 60px 60px; max-width: 1200px; margin: 0 auto;
        }
        .vault__hero {
          margin-bottom: 48px;
          opacity: 0; animation: vaultReveal 1s ease 0.2s forwards;
        }
        .vault__label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 0.4em;
          color: rgba(201,169,110,0.5);
        }
        .vault__title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(40px, 6vw, 80px); font-weight: 300;
          color: #fff; margin: 12px 0 16px; letter-spacing: -0.01em; line-height: 1;
        }
        .vault__sub {
          font-family: 'Inter', sans-serif;
          font-size: 12px; color: rgba(255,255,255,0.2); letter-spacing: 0.1em;
        }
        @keyframes vaultReveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .vault__main { padding: 100px 16px 40px; }
        }
      `}</style>
    </div>
  );
}
