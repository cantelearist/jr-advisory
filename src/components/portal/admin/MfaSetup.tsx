'use client';

/* ── MFA Setup Component ──
 *
 * Displays MFA enrollment status for admin/manager users.
 * - If not enrolled: shows "Enable MFA" → QR code → verify step
 * - If enrolled: shows status + option to disable
 */

import { useState, useEffect, useRef, useCallback } from 'react';

type MfaState = 'loading' | 'not-enrolled' | 'enrolling' | 'verifying' | 'enrolled' | 'error';

interface FactorInfo {
  id: string;
  friendlyName?: string;
  createdAt: string;
}

interface MfaSetupProps {
  allowDisable?: boolean;
  onEnrolled?: () => void;
}

export default function MfaSetup({ allowDisable = true, onEnrolled }: MfaSetupProps) {
  const [state, setState] = useState<MfaState>('loading');
  const [factor, setFactor] = useState<FactorInfo | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [newFactorId, setNewFactorId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const checkMfaStatus = useCallback(async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('/api/auth/mfa', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error('MFA status unavailable');

      const verifiedTotp = data.factors?.find((f: { status?: string }) => f.status === 'verified');
      if (verifiedTotp) {
        setFactor({
          id: verifiedTotp.id,
          friendlyName: verifiedTotp.friendly_name || undefined,
          createdAt: verifiedTotp.created_at,
        });
        setState('enrolled');
      } else {
        setState('not-enrolled');
      }
    } catch {
      setError('We could not verify MFA status. Try again.');
      setState('error');
    } finally {
      window.clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    void checkMfaStatus();
  }, [checkMfaStatus]);

  async function startEnrollment() {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enroll' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to start enrollment');
        setLoading(false);
        return;
      }

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setNewFactorId(data.factorId);
      setState('enrolling');
      setLoading(false);
    } catch {
      setError('Failed to start enrollment');
      setLoading(false);
    }
  }

  async function verifyEnrollment() {
    if (code.length !== 6) return;
    setError('');
    setLoading(true);

    try {
      // Step 1: Challenge
      const challengeRes = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'challenge', factorId: newFactorId }),
      });

      const challengeData = await challengeRes.json();
      if (!challengeRes.ok) {
        setError(challengeData.error || 'Challenge failed');
        setLoading(false);
        return;
      }

      // Step 2: Verify
      const verifyRes = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          factorId: newFactorId,
          challengeId: challengeData.challengeId,
          code: code.trim(),
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setError(verifyData.error || 'Invalid code');
        setCode('');
        setLoading(false);
        inputRef.current?.focus();
        return;
      }

      // Success — refresh status
      await checkMfaStatus();
      setQrCode('');
      setSecret('');
      setNewFactorId('');
      setCode('');
      setLoading(false);
      onEnrolled?.();
    } catch {
      setError('Verification failed');
      setLoading(false);
    }
  }

  async function disableMfa() {
    if (!factor) return;
    if (!confirm('Are you sure you want to disable MFA? This reduces account security.')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unenroll', factorId: factor.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to disable MFA');
        setLoading(false);
        return;
      }

      setFactor(null);
      setState('not-enrolled');
      setLoading(false);
    } catch {
      setError('Failed to disable MFA');
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Two-Factor Authentication</h3>
      <p style={styles.description}>
        {state === 'enrolled'
          ? 'MFA is active. Your account requires a code from your authenticator app at each login.'
          : 'Add an extra layer of security. Once enabled, you\'ll need your authenticator app to log in.'}
      </p>

      {error && <p style={styles.error}>{error}</p>}

      {state === 'loading' && (
        <p style={styles.muted}>Checking MFA status...</p>
      )}

      {state === 'error' && (
        <button
          onClick={() => { setError(''); setState('loading'); void checkMfaStatus(); }}
          disabled={loading}
          style={styles.button}
        >
          Retry
        </button>
      )}

      {state === 'not-enrolled' && (
        <button
          onClick={startEnrollment}
          disabled={loading}
          style={styles.button}
        >
          {loading ? 'Setting up...' : 'Enable MFA'}
        </button>
      )}

      {state === 'enrolling' && (
        <div style={styles.enrollSection}>
          <p style={styles.step}>1. Scan this QR code with your authenticator app:</p>
          {qrCode && (
            <div style={styles.qrContainer}>
              <img
                src={qrCode}
                alt="MFA QR Code"
                style={styles.qr}
              />
            </div>
          )}
          <p style={styles.step}>Or enter this secret manually:</p>
          <code style={styles.secret}>{secret}</code>

          <p style={{ ...styles.step, marginTop: 24 }}>
            2. Enter the 6-digit code from your app:
          </p>
          <div style={styles.codeRow}>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              style={styles.codeInput}
              autoFocus
            />
            <button
              onClick={verifyEnrollment}
              disabled={loading || code.length !== 6}
              style={styles.button}
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      )}

      {state === 'enrolled' && factor && (
        <div style={styles.enrolledSection}>
          <div style={styles.statusBadge}>
            <span style={styles.statusDot} />
            <span style={styles.statusText}>MFA Active</span>
          </div>
          <p style={styles.muted}>
            Enrolled: {new Date(factor.createdAt).toLocaleDateString()}
          </p>
          {allowDisable && (
            <button
              onClick={disableMfa}
              disabled={loading}
              style={styles.dangerButton}
            >
              {loading ? 'Disabling...' : 'Disable MFA'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: 24,
    marginBottom: 24,
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20,
    fontWeight: 400,
    color: 'rgba(255,255,255,0.9)',
    margin: '0 0 8px',
  },
  description: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 1.6,
    margin: '0 0 20px',
  },
  error: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    color: '#ef4444',
    margin: '0 0 12px',
  },
  muted: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    margin: '0 0 16px',
  },
  button: {
    background: 'transparent',
    border: '1px solid rgba(201, 169, 110, 0.3)',
    color: '#c9a96e',
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    padding: '12px 24px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  dangerButton: {
    background: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    padding: '12px 24px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  enrollSection: {
    marginTop: 8,
  },
  step: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    margin: '0 0 12px',
  },
  qrContainer: {
    display: 'flex',
    justifyContent: 'center',
    margin: '16px 0',
  },
  qr: {
    width: 200,
    height: 200,
    borderRadius: 8,
    background: '#fff',
    padding: 8,
  },
  secret: {
    display: 'block',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    color: '#c9a96e',
    background: 'rgba(201, 169, 110, 0.05)',
    border: '1px solid rgba(201, 169, 110, 0.15)',
    padding: '10px 14px',
    borderRadius: 4,
    wordBreak: 'break-all' as const,
    userSelect: 'all' as const,
  },
  codeRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  codeInput: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 0,
    padding: '12px 16px',
    fontFamily: "'Inter', sans-serif",
    fontSize: 20,
    fontWeight: 300,
    color: '#fff',
    letterSpacing: '0.4em',
    textAlign: 'center' as const,
    width: 160,
    outline: 'none',
  },
  enrolledSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    alignItems: 'flex-start',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#22c55e',
  },
  statusText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: '#22c55e',
    letterSpacing: '0.05em',
  },
};
