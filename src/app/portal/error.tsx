'use client';

import { useEffect } from 'react';

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PortalError]', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 2rem',
      textAlign: 'center',
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'rgba(239, 68, 68, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        fontSize: '24px',
      }}>
        ⚠
      </div>
      <h2 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 400,
        fontSize: '1.5rem',
        color: '#ece6d6',
        margin: '0 0 0.75rem',
      }}>
        Portal Error
      </h2>
      <p style={{
        color: '#888',
        maxWidth: '360px',
        lineHeight: 1.6,
        marginBottom: '1.5rem',
        fontSize: '0.9rem',
      }}>
        Something went wrong loading this page. Your data is safe — please try again.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={reset}
          style={{
            background: 'rgba(201,181,138,0.12)',
            border: '1px solid #c9b58a',
            color: '#c9b58a',
            padding: '10px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase' as const,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Retry
        </button>
        <button
          onClick={() => window.location.href = '/portal'}
          style={{
            background: 'transparent',
            border: '1px solid #333',
            color: '#888',
            padding: '10px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase' as const,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Back to Portal
        </button>
      </div>
    </div>
  );
}
