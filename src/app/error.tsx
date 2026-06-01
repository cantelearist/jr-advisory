'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0b0e',
      color: '#ece6d6',
      fontFamily: "'Inter', sans-serif",
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '11px',
        letterSpacing: '4px',
        textTransform: 'uppercase' as const,
        color: '#c9b58a',
        fontFamily: "'JetBrains Mono', monospace",
        marginBottom: '1.5rem',
      }}>
        Something went wrong
      </div>
      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 300,
        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
        margin: '0 0 1rem',
        lineHeight: 1.2,
      }}>
        An unexpected error occurred
      </h1>
      <p style={{
        color: '#888',
        maxWidth: '400px',
        lineHeight: 1.6,
        marginBottom: '2rem',
      }}>
        We apologize for the inconvenience. Please try again or contact our team if the issue persists.
      </p>
      <button
        onClick={reset}
        style={{
          background: 'rgba(201,181,138,0.12)',
          border: '1px solid #c9b58a',
          color: '#c9b58a',
          padding: '12px 28px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px',
          letterSpacing: '2px',
          textTransform: 'uppercase' as const,
          fontFamily: "'JetBrains Mono', monospace",
          transition: 'background 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(201,181,138,0.2)')}
        onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(201,181,138,0.12)')}
      >
        Try Again
      </button>
    </div>
  );
}
