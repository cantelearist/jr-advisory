'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getAuthClient } from '@/lib/supabase-browser';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000' }} />}>
      <ResetPassword />
    </Suspense>
  );
}

function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => getAuthClient());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  /* ── Exchange the code from the reset email for a session ── */
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error: exchangeErr }) => {
          if (exchangeErr) {
            setSessionError(true);
          } else {
            setSessionReady(true);
          }
        })
        .catch(() => setSessionError(true));
    } else {
      /* No code — check if there's already a session (user clicked a hash-based link) */
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSessionReady(true);
        } else {
          setSessionError(true);
        }
      });
    }
  }, [searchParams, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/portal'), 3000);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (sessionError) {
    return (
      <div className="rp-page">
        <div className="rp-content">
          <Header />
          <h1 className="rp-title">Link Expired</h1>
          <p className="rp-description" style={{ textAlign: 'center' }}>
            This password reset link is invalid or has expired.
            Please request a new one.
          </p>
          <Link href="/portal/forgot-password" className="rp-back">
            Request new reset link →
          </Link>
        </div>
        <Styles />
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="rp-page">
        <div className="rp-content">
          <Header />
          <p className="rp-description" style={{ textAlign: 'center' }}>
            Verifying reset link...
          </p>
        </div>
        <Styles />
      </div>
    );
  }

  return (
    <div className="rp-page">
      <div className="rp-content">
        <Header />
        <h1 className="rp-title">New Password</h1>

        {success ? (
          <div className="rp-sent">
            <div className="rp-icon">✓</div>
            <p className="rp-sent-title">Password Updated</p>
            <p className="rp-sent-sub">
              Redirecting you to the login page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rp-form">
            <p className="rp-description">
              Choose a new password for your account.
              Minimum 8 characters.
            </p>
            <div className="rp-field">
              <label className="rp-label">New Password</label>
              <input
                type="password"
                className="rp-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                autoFocus
                minLength={8}
              />
            </div>
            <div className="rp-field">
              <label className="rp-label">Confirm Password</label>
              <input
                type="password"
                className="rp-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            {error && <p className="rp-error">{error}</p>}
            <button type="submit" className="rp-button" disabled={loading}>
              <span className="rp-button-text">
                {loading ? 'Updating...' : 'Set New Password'}
              </span>
              <span className="rp-button-arrow">→</span>
            </button>
            <Link href="/portal" className="rp-back">
              ← Back to login
            </Link>
          </form>
        )}
      </div>
      <Styles />
    </div>
  );
}

function Header() {
  return (
    <div className="rp-header">
      <div className="rp-line" />
      <span className="rp-firm">JAMES ROMAN ADVISORY</span>
      <div className="rp-line" />
    </div>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      .rp-page {
        min-height: 100vh;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
      }
      .rp-content {
        width: 100%;
        max-width: 420px;
        text-align: center;
      }
      .rp-header {
        display: flex;
        align-items: center;
        gap: 16px;
        justify-content: center;
        margin-bottom: 48px;
      }
      .rp-line {
        height: 1px;
        width: 40px;
        background: rgba(201, 169, 110, 0.25);
      }
      .rp-firm {
        font-family: 'Inter', sans-serif;
        font-size: 9px;
        font-weight: 400;
        letter-spacing: 0.35em;
        color: rgba(201, 169, 110, 0.4);
        text-transform: uppercase;
        white-space: nowrap;
      }
      .rp-title {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 36px;
        font-weight: 300;
        color: rgba(255, 255, 255, 0.9);
        letter-spacing: 0.06em;
        margin: 0 0 32px;
      }
      .rp-description {
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.4);
        line-height: 1.6;
        margin: 0 0 32px;
        text-align: left;
      }
      .rp-form {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .rp-field {
        text-align: left;
      }
      .rp-label {
        display: block;
        font-family: 'Inter', sans-serif;
        font-size: 10px;
        font-weight: 400;
        letter-spacing: 0.25em;
        color: rgba(255, 255, 255, 0.3);
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .rp-input {
        width: 100%;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 0;
        padding: 16px 20px;
        font-family: 'Inter', sans-serif;
        font-size: 15px;
        font-weight: 300;
        color: #fff;
        letter-spacing: 0.05em;
        outline: none;
        transition: all 0.5s ease;
        box-sizing: border-box;
      }
      .rp-input:focus {
        border-color: rgba(201, 169, 110, 0.4);
        background: rgba(201, 169, 110, 0.03);
        box-shadow: 0 0 30px rgba(201, 169, 110, 0.05);
      }
      .rp-input::placeholder {
        color: rgba(255, 255, 255, 0.15);
      }
      .rp-error {
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        color: #ef4444;
        letter-spacing: 0.05em;
        margin: -8px 0 0;
        text-align: left;
      }
      .rp-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: 100%;
        padding: 18px 32px;
        background: transparent;
        border: 1px solid rgba(201, 169, 110, 0.3);
        cursor: pointer;
        transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        overflow: hidden;
      }
      .rp-button:disabled {
        opacity: 0.5;
        cursor: wait;
      }
      .rp-button:hover:not(:disabled) {
        border-color: rgba(201, 169, 110, 0.6);
        transform: translateY(-2px);
        box-shadow: 0 10px 40px rgba(201, 169, 110, 0.1);
      }
      .rp-button-text {
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        font-weight: 400;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: #c9a96e;
      }
      .rp-button-arrow {
        font-size: 16px;
        color: #c9a96e;
        transition: transform 0.4s ease;
      }
      .rp-button:hover:not(:disabled) .rp-button-arrow {
        transform: translateX(4px);
      }
      .rp-back {
        display: inline-block;
        color: rgba(201, 169, 110, 0.4);
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        letter-spacing: 0.1em;
        text-decoration: none;
        transition: color 0.3s ease;
      }
      .rp-back:hover {
        color: rgba(201, 169, 110, 0.7);
      }
      .rp-sent {
        text-align: center;
      }
      .rp-icon {
        font-size: 40px;
        margin-bottom: 20px;
        color: #c9a96e;
      }
      .rp-sent-title {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 24px;
        color: rgba(255, 255, 255, 0.8);
        margin: 0 0 8px;
      }
      .rp-sent-sub {
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.3);
        letter-spacing: 0.05em;
        margin: 0;
        line-height: 1.6;
      }
    `}</style>
  );
}
