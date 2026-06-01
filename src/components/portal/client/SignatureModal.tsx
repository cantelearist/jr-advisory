'use client';

/* ── SignatureModal — client views pending signatures and signs documents ── */

import { useState, useRef, useCallback } from 'react';
import SignaturePad, { type SignaturePadRef } from './SignaturePad';
import './signature.css';

export interface SignatureRequestItem {
  id: string;
  document_id: string;
  documentName: string;
  documentCategory: string;
  signer_name: string;
  signer_email: string | null;
  message: string | null;
  status: string;
  signed_at: string | null;
  created_at: string;
}

interface SignatureModalProps {
  request: SignatureRequestItem;
  onClose: () => void;
  onSigned: () => void;
}

export default function SignatureModal({ request, onClose, onSigned }: SignatureModalProps) {
  const padRef = useRef<SignaturePadRef>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);
  const [declined, setDeclined] = useState(false);

  const handleSign = useCallback(async () => {
    if (!padRef.current || padRef.current.isEmpty() || !agreed) return;
    setSigning(true);
    setError('');

    try {
      const signatureData = padRef.current.toDataURL();
      const res = await fetch('/api/signatures/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature_request_id: request.id,
          signature_data: signatureData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signing failed');

      setSigned(true);
      setTimeout(() => {
        onSigned();
        onClose();
      }, 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Signing failed');
    } finally {
      setSigning(false);
    }
  }, [agreed, request.id, onSigned, onClose]);

  const handleDecline = useCallback(async () => {
    setDeclining(true);
    setError('');

    try {
      const res = await fetch('/api/signatures/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature_request_id: request.id,
          reason: declineReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Decline failed');

      setDeclined(true);
      setTimeout(() => {
        onSigned();
        onClose();
      }, 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Decline failed');
    } finally {
      setDeclining(false);
    }
  }, [request.id, declineReason, onSigned, onClose]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="sig-overlay" onClick={onClose}>
      <div className="sig-modal" onClick={(e) => e.stopPropagation()}>
        {declined ? (
          /* Decline success */
          <div className="sig-success">
            <div className="sig-success__icon" style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>✕</div>
            <h2 className="sig-success__title">Signature Declined</h2>
            <p className="sig-success__sub">
              Your response has been recorded. The requesting party will be notified.
            </p>
          </div>
        ) : signed ? (
          /* Success state */
          <div className="sig-success">
            <div className="sig-success__icon">✓</div>
            <h2 className="sig-success__title">Document Signed</h2>
            <p className="sig-success__sub">
              Your signature has been recorded and an audit trail has been created.
            </p>
          </div>
        ) : showDecline ? (
          /* Decline flow */
          <>
            <div className="sig-header">
              <div>
                <span className="sig-header__label">DECLINE SIGNATURE</span>
                <h2 className="sig-header__title">{request.documentName}</h2>
                <span className="sig-header__meta">
                  {request.documentCategory} · Requested {formatDate(request.created_at)}
                </span>
              </div>
              <button className="sig-header__close" onClick={() => setShowDecline(false)}>←</button>
            </div>

            <div style={{ padding: '24px 32px' }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.35em',
                color: 'rgba(239,68,68,0.5)',
                marginBottom: 12,
              }}>
                REASON FOR DECLINING (OPTIONAL)
              </div>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Please provide a reason for declining this signature request…"
                rows={4}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(239,68,68,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  padding: '12px 14px',
                  resize: 'vertical',
                  outline: 'none',
                  lineHeight: 1.5,
                }}
              />
            </div>

            {error && <p className="sig-error">{error}</p>}

            <div className="sig-actions">
              <button className="sig-actions__cancel" onClick={() => setShowDecline(false)}>
                Back
              </button>
              <button
                className="sig-actions__sign"
                onClick={handleDecline}
                disabled={declining}
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  borderColor: 'rgba(239,68,68,0.3)',
                  color: '#ef4444',
                }}
              >
                {declining ? 'Declining…' : 'Confirm Decline'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="sig-header">
              <div>
                <span className="sig-header__label">E-SIGNATURE REQUEST</span>
                <h2 className="sig-header__title">{request.documentName}</h2>
                <span className="sig-header__meta">
                  {request.documentCategory} · Requested {formatDate(request.created_at)}
                </span>
              </div>
              <button className="sig-header__close" onClick={onClose}>✕</button>
            </div>

            {/* Message from admin */}
            {request.message && (
              <div className="sig-message">
                <span className="sig-message__from">From James Roman Advisory:</span>
                <p className="sig-message__text">{request.message}</p>
              </div>
            )}

            {/* Signer info */}
            <div className="sig-signer">
              <div className="sig-signer__row">
                <span className="sig-signer__label">Signer</span>
                <span className="sig-signer__value">{request.signer_name}</span>
              </div>
              {request.signer_email && (
                <div className="sig-signer__row">
                  <span className="sig-signer__label">Email</span>
                  <span className="sig-signer__value">{request.signer_email}</span>
                </div>
              )}
              <div className="sig-signer__row">
                <span className="sig-signer__label">Date</span>
                <span className="sig-signer__value">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Signature pad */}
            <div className="sig-pad-wrapper">
              <div className="sig-pad-header">
                <span className="sig-pad-header__label">YOUR SIGNATURE</span>
                {hasSignature && (
                  <button
                    className="sig-pad-header__clear"
                    onClick={() => {
                      padRef.current?.clear();
                      setHasSignature(false);
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <SignaturePad
                ref={padRef}
                onSignatureChange={setHasSignature}
              />
            </div>

            {/* Agreement checkbox */}
            <label className="sig-agree">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="sig-agree__check"
              />
              <span className="sig-agree__text">
                I agree that this electronic signature is the legal equivalent of my handwritten signature
                and that I have read and agree to the terms of this document.
              </span>
            </label>

            {error && <p className="sig-error">{error}</p>}

            {/* Actions */}
            <div className="sig-actions" style={{ justifyContent: 'space-between' }}>
              <button
                className="sig-actions__cancel"
                onClick={() => setShowDecline(true)}
                style={{
                  color: 'rgba(239,68,68,0.5)',
                  borderColor: 'rgba(239,68,68,0.1)',
                  fontSize: 11,
                }}
              >
                Decline
              </button>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="sig-actions__cancel" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="sig-actions__sign"
                  onClick={handleSign}
                  disabled={!hasSignature || !agreed || signing}
                >
                  {signing ? 'Signing…' : 'Sign Document'}
                </button>
              </div>
            </div>

            {/* Legal footer */}
            <div className="sig-legal">
              <p>
                By signing, you consent to conduct this transaction electronically pursuant to
                the E-SIGN Act (15 U.S.C. § 7001 et seq.) and UETA. A timestamped audit trail
                including your IP address will be recorded.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
