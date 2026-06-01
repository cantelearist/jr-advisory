'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PageBuilder = dynamic(
  () => import('@/components/portal/admin/PageBuilder'),
  { ssr: false, loading: () => <EditorLoading /> }
);

function EditorLoading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#070708',
      color: 'rgba(236,230,214,0.3)',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      letterSpacing: '0.12em',
    }}>
      Loading visual editor...
    </div>
  );
}

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageId = searchParams.get('id');

  if (!pageId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#070708',
        color: 'rgba(236,230,214,0.3)',
        flexDirection: 'column',
        gap: 16,
      }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
          No page selected
        </span>
        <button
          onClick={() => router.push('/portal/admin?tab=pages')}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '10px 24px',
            background: 'transparent',
            border: '1px solid rgba(201,169,110,0.2)',
            borderRadius: 4,
            color: '#c9a96e',
            cursor: 'pointer',
          }}
        >
          ← Back to Pages
        </button>
      </div>
    );
  }

  return (
    <PageBuilder
      pageId={pageId}
      onBack={() => router.push('/portal/admin?tab=pages')}
    />
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<EditorLoading />}>
      <EditorContent />
    </Suspense>
  );
}
