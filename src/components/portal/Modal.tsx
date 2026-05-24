'use client';

import { useEffect, useCallback, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}

export default function Modal({ open, onClose, title, children, width = 560 }: ModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: width,
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'rgba(16,18,24,0.98)',
          border: '1px solid rgba(201,169,110,0.12)',
          borderRadius: 12,
          padding: 0,
          animation: 'slideUp 0.25s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <h2 className="display" style={{ fontSize: 22, margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              fontSize: 24,
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.3)'}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px 28px' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ── Shared form field styles ── */
export const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: 'rgba(255,255,255,0.85)',
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: 2,
  color: 'rgba(255,255,255,0.35)',
  marginBottom: 8,
  textTransform: 'uppercase' as const,
};

export const btnPrimary: React.CSSProperties = {
  background: 'rgba(201,169,110,0.12)',
  border: '1px solid rgba(201,169,110,0.3)',
  color: '#c9a96e',
  padding: '12px 28px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  letterSpacing: 1.5,
  fontFamily: "'JetBrains Mono', monospace",
  textTransform: 'uppercase' as const,
  transition: 'all 0.2s ease',
};

export const btnDanger: React.CSSProperties = {
  background: 'rgba(239,68,68,0.08)',
  border: '1px solid rgba(239,68,68,0.2)',
  color: '#ef4444',
  padding: '12px 28px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  letterSpacing: 1.5,
  fontFamily: "'JetBrains Mono', monospace",
  textTransform: 'uppercase' as const,
  transition: 'all 0.2s ease',
};

export const btnSecondary: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.5)',
  padding: '12px 28px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  letterSpacing: 1.5,
  fontFamily: "'JetBrains Mono', monospace",
  textTransform: 'uppercase' as const,
  transition: 'all 0.2s ease',
};
