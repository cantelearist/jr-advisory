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
        background: 'rgba(50,51,56,0.42)',
        backdropFilter: 'blur(3px)',
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
          background: '#fff',
          border: '1px solid #d0d4e4',
          borderRadius: 8,
          padding: 0,
          boxShadow: '0 12px 40px rgba(50,51,56,0.22)',
          animation: 'slideUp 0.25s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 28px',
          borderBottom: '1px solid #d0d4e4',
        }}>
          <h2 style={{ fontFamily: "'Manrope', 'Inter', sans-serif", fontSize: 20, fontWeight: 650, color: '#323338', margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#676879',
              fontSize: 24,
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#323338'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#676879'}
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
  background: '#fff',
  border: '1px solid #c3c6d4',
  borderRadius: 4,
  color: '#323338',
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontFamily: "'Inter', sans-serif",
  fontWeight: 600,
  letterSpacing: 0,
  color: '#676879',
  marginBottom: 8,
  textTransform: 'uppercase' as const,
};

export const btnPrimary: React.CSSProperties = {
  background: '#0073ea',
  border: '1px solid #0073ea',
  color: '#fff',
  padding: '10px 20px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
  letterSpacing: 0,
  fontFamily: "'Inter', sans-serif",
  fontWeight: 600,
  transition: 'all 0.2s ease',
};

export const btnDanger: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2445c',
  color: '#c8324b',
  padding: '10px 20px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
  letterSpacing: 0,
  fontFamily: "'Inter', sans-serif",
  fontWeight: 600,
  transition: 'all 0.2s ease',
};

export const btnSecondary: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #c3c6d4',
  color: '#323338',
  padding: '10px 20px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
  letterSpacing: 0,
  fontFamily: "'Inter', sans-serif",
  fontWeight: 550,
  transition: 'all 0.2s ease',
};
