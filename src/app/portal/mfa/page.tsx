'use client';

/* ── MFA Verification Page ──
 *
 * Shown after login when the user has TOTP enrolled.
 * The user must enter a 6-digit code to proceed.
 * No fail-open: cannot bypass this page.
 */

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthClient } from '@/lib/supabase-browser';

/** Sanitize redirect to prevent open-redirect attacks */
function sanitizeRedirect(url: string | null, fallback: string): string {
  if (!url) return fallback;
  const cleaned = url.trim();
  if (!cleaned.startsWith('/') || cleaned.startsWith('//')) return fallback;
  return cleaned;
}

export default function MfaPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000' }} />}>
      <MfaVerify />
    </Suspense>
  );
}

function MfaVerify() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => getAuthClient());
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get the user's enrolled TOTP factor
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const totp = data?.totp?.[0];
      if (totp) {
        setFactorId(totp.id);
      } else {
        // No MFA enrolled — redirect to dashboard
        const redirect = sanitizeRedirect(searchParams.get('redirect'), '/portal/dashboard');
        router.replace(redirect);
      }
    });
  }, [supabase, router, searchParams]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [factorId]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || code.length !== 6) return;
    setError('');
    setLoading(true);

    try {
      // Step 1: Create challenge
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) {
        setError(challengeError.message);
        setLoading(false);
        return;
      }

      // Step 2: Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: code.trim(),
      });

      if (verifyError) {
        setError('Invalid code. Please try again.');
        setCode('');
        setLoading(false);
        inputRef.current?.focus();
        return;
      }

      // MFA verified — redirect
      const redirect = sanitizeRedirect(searchParams.get('redirect'), '/portal/admin');
      router.replace(redirect);
    } catch {
      setError('Verification failed. Please try again.');
      setLoading(false);
    }
  };

  if (!factorId) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
          Checking authentication...
        </p>
      </div>
    );
  }

  return (
    <div className="mfa-page">
      <div className="mfa-content">
        <div className="mfa-header">
          <div className="mfa-line" />
          <span className="mfa-firm">JAMES ROMAN ADVISORY</span>
          <div className="mfa-line" />
        </div>

        <h1 className="mfa-title">Two-Factor Authentication</h1>
        <p className="mfa-description">
          Enter the 6-digit code from your authenticator app to continue.
        </p>

        <form onSubmit={handleVerify} className="mfa-form">
          <div className="mfa-field">
            <label className="mfa-label">Verification Code</label>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className="mfa-input"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          {error && <p className="mfa-error">{error}</p>}

          <button
            type="submit"
            className="mfa-button"
            disabled={loading || code.length !== 6}
          >
            <span className="mfa-button-text">
              {loading ? 'Verifying...' : 'Verify'}
            </span>
            <span className="mfa-button-arrow">→</span>
          </button>
        </form>
      </div>

      <style jsx>{`
        .mfa-page {
          min-height: 100vh;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }
        .mfa-content { width: 100%; max-width: 420px; text-align: center; }
        .mfa-header { display: flex; align-items: center; gap: 16px; justify-content: center; margin-bottom: 48px; }
        .mfa-line { height: 1px; width: 40px; background: rgba(201, 169, 110, 0.25); }
        .mfa-firm { font-family: 'Inter', sans-serif; font-size: 9px; font-weight: 400; letter-spacing: 0.35em; color: rgba(201, 169, 110, 0.4); text-transform: uppercase; white-space: nowrap; }
        .mfa-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 32px; font-weight: 300; color: rgba(255, 255, 255, 0.9); letter-spacing: 0.06em; margin: 0 0 16px; }
        .mfa-description { font-family: 'Inter', sans-serif; font-size: 13px; color: rgba(255, 255, 255, 0.4); line-height: 1.6; margin: 0 0 32px; }
        .mfa-form { display: flex; flex-direction: column; gap: 24px; }
        .mfa-field { text-align: left; }
        .mfa-label { display: block; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 400; letter-spacing: 0.25em; color: rgba(255, 255, 255, 0.3); text-transform: uppercase; margin-bottom: 8px; }
        .mfa-input { width: 100%; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 0; padding: 20px; font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 300; color: #fff; letter-spacing: 0.5em; text-align: center; outline: none; transition: all 0.5s ease; box-sizing: border-box; }
        .mfa-input:focus { border-color: rgba(201, 169, 110, 0.4); background: rgba(201, 169, 110, 0.03); box-shadow: 0 0 30px rgba(201, 169, 110, 0.05); }
        .mfa-input::placeholder { color: rgba(255, 255, 255, 0.1); letter-spacing: 0.5em; }
        .mfa-error { font-family: 'Inter', sans-serif; font-size: 12px; color: #ef4444; letter-spacing: 0.05em; margin: -8px 0 0; }
        .mfa-button { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; padding: 18px 32px; background: transparent; border: 1px solid rgba(201, 169, 110, 0.3); cursor: pointer; transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .mfa-button:disabled { opacity: 0.5; cursor: not-allowed; }
        .mfa-button:hover:not(:disabled) { border-color: rgba(201, 169, 110, 0.6); transform: translateY(-2px); box-shadow: 0 10px 40px rgba(201, 169, 110, 0.1); }
        .mfa-button-text { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 400; letter-spacing: 0.3em; text-transform: uppercase; color: #c9a96e; }
        .mfa-button-arrow { font-size: 16px; color: #c9a96e; transition: transform 0.4s ease; }
        .mfa-button:hover:not(:disabled) .mfa-button-arrow { transform: translateX(4px); }
      `}</style>
    </div>
  );
}
