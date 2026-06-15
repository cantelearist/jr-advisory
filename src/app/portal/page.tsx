'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

/** Sanitize redirect to prevent open-redirect attacks */
function sanitizeRedirect(url: string | null, fallback: string): string {
  if (!url) return fallback;
  const cleaned = url.trim();
  if (!cleaned.startsWith('/') || cleaned.startsWith('//')) return fallback;
  return cleaned;
}

const Scene3D = dynamic(() => import('@/components/portal/Scene3D'), { ssr: false });

export default function PortalLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000' }} />}>
      <PortalLogin />
    </Suspense>
  );
}

function PortalLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<'intro' | 'form' | 'entering'>('intro');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setPhase('form'), 2200);
    // Check for auth errors in URL
    const err = searchParams.get('error');
    if (err) setError('Authentication failed. Please try again.');
    return () => clearTimeout(timer);
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use rate-limited server-side login endpoint
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Login failed.');
        setLoading(false);
        return;
      }

      setPhase('entering');
      const { role, onboarded } = result.user;
      const redirect = sanitizeRedirect(searchParams.get('redirect'), '');
      const isPrivileged = role === 'admin' || role === 'manager';

      if (result.mfaRequired) {
        const finalDest = redirect || '/portal/admin';
        setTimeout(() => router.push(`/portal/mfa?redirect=${encodeURIComponent(finalDest)}`), 1600);
        return;
      }

      const dest = redirect || (isPrivileged ? '/portal/admin' : (!onboarded ? '/portal/welcome' : '/portal/dashboard'));
      setTimeout(() => router.push(dest), 1600);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Use rate-limited server-side endpoint (P3: prevents bypass of rate limiting)
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Failed to send login link.');
        setLoading(false);
        return;
      }

      setMagicLinkSent(true);
      setLoading(false);
    } catch {
      setError('Failed to send login link.');
      setLoading(false);
    }
  };

  return (
    <div className="portal-login">
      <Scene3D variant="login" />
      <div className="portal-login__vignette" />

      <div className="portal-login__content">
        {/* Firm identity */}
        <div className={`portal-login__header ${phase !== 'intro' ? 'portal-login__header--up' : ''}`}>
          <div className="portal-login__firm-line" />
          <span className="portal-login__firm-name">JAMES ROMAN ADVISORY</span>
          <div className="portal-login__firm-line" />
        </div>

        {/* Title */}
        <h1 className={`portal-login__title ${phase === 'entering' ? 'portal-login__title--exit' : ''}`}>
          <span className="portal-login__title-line portal-login__title-line--1">YOUR</span>
          <span className="portal-login__title-line portal-login__title-line--2">OFFICE</span>
        </h1>

        {/* Subtitle */}
        <p className={`portal-login__subtitle ${phase === 'form' ? 'portal-login__subtitle--visible' : ''}`}>
          Private client portal. Encrypted. Confidential.
        </p>

        {/* Login form */}
        <div
          ref={formRef}
          className={`portal-login__form-wrapper ${
            phase === 'form' ? 'portal-login__form-wrapper--visible' : ''
          } ${phase === 'entering' ? 'portal-login__form-wrapper--exit' : ''}`}
        >
          {magicLinkSent ? (
            <div className="portal-login__magic-sent">
              <div className="portal-login__magic-icon">✉</div>
              <p className="portal-login__magic-text">
                Login link sent to <strong>{email}</strong>
              </p>
              <p className="portal-login__magic-sub">
                Check your inbox and click the link to access your Office.
              </p>
              <button
                type="button"
                className="portal-login__magic-back"
                onClick={() => { setMagicLinkSent(false); setShowMagicLink(false); }}
              >
                ← Back to login
              </button>
            </div>
          ) : showMagicLink ? (
            <div className="portal-login__form">
              <div className="portal-login__field">
                <label className="portal-login__label">Email</label>
                <input
                  type="email"
                  className="portal-login__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>
              {error && <p className="portal-login__error">{error}</p>}
              <button
                type="button"
                className="portal-login__button"
                onClick={handleMagicLink}
                disabled={loading}
              >
                <span className="portal-login__button-text">
                  {loading ? 'Sending...' : 'Send Login Link'}
                </span>
                <span className="portal-login__button-arrow">→</span>
              </button>
              <button
                type="button"
                className="portal-login__toggle"
                onClick={() => { setShowMagicLink(false); setError(''); }}
              >
                Use password instead
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="portal-login__form">
              <div className="portal-login__field">
                <label className="portal-login__label">Email or username</label>
                <input
                  type="text"
                  className="portal-login__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@jamesroman.la or Client"
                  autoComplete="username"
                />
              </div>
              <div className="portal-login__field">
                <label className="portal-login__label">Password</label>
                <input
                  type="password"
                  className="portal-login__input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="portal-login__error">{error}</p>}
              <button
                type="submit"
                className="portal-login__button"
                disabled={loading}
              >
                <span className="portal-login__button-text">
                  {loading ? 'Authenticating...' : 'Enter Your Office'}
                </span>
                <span className="portal-login__button-arrow">→</span>
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-8px' }}>
                <button
                  type="button"
                  className="portal-login__toggle"
                  onClick={() => { setShowMagicLink(true); setError(''); }}
                >
                  Use magic link instead
                </button>
                <button
                  type="button"
                  className="portal-login__toggle"
                  onClick={() => router.push('/portal/forgot-password')}
                >
                  Forgot password?
                </button>
              </div>
            </form>
          )}
          <p className="portal-login__notice">
            Access is by invitation only. Contact the firm for credentials.
          </p>
        </div>
      </div>

      {/* Entry transition */}
      <div className={`portal-login__transition ${phase === 'entering' ? 'portal-login__transition--active' : ''}`} />

      <style jsx>{`
        .portal-login {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          overflow: hidden;
        }
        .portal-login__vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%);
          z-index: 1;
          pointer-events: none;
        }
        .portal-login__content {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 40px;
          max-width: 480px;
          width: 100%;
        }
        .portal-login__header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-bottom: 48px;
          opacity: 0;
          animation: fadeIn 1.5s ease 0.3s forwards;
          transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1), opacity 1s ease;
        }
        .portal-login__header--up { transform: translateY(-20px); }
        .portal-login__firm-line { width: 40px; height: 1px; background: rgba(201, 169, 110, 0.3); }
        .portal-login__firm-name {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.4em;
          color: rgba(201, 169, 110, 0.6);
          white-space: nowrap;
        }
        .portal-login__title {
          margin: 0 0 24px;
          line-height: 0.85;
          transition: all 1.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .portal-login__title--exit {
          transform: scale(1.5);
          opacity: 0;
          filter: blur(20px);
        }
        .portal-login__title-line {
          display: block;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 300;
          color: #fff;
          opacity: 0;
        }
        .portal-login__title-line--1 {
          font-size: clamp(60px, 12vw, 140px);
          letter-spacing: 0.25em;
          animation: titleReveal 1.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
        }
        .portal-login__title-line--2 {
          font-size: clamp(70px, 14vw, 160px);
          letter-spacing: 0.15em;
          animation: titleReveal 1.8s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards;
        }
        .portal-login__subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 300;
          letter-spacing: 0.2em;
          color: rgba(255, 255, 255, 0.25);
          text-transform: uppercase;
          margin: 0 0 48px;
          opacity: 0;
          transform: translateY(10px);
          transition: all 1s ease 0.3s;
        }
        .portal-login__subtitle--visible {
          opacity: 1;
          transform: translateY(0);
        }
        .portal-login__form-wrapper {
          opacity: 0;
          transform: translateY(30px);
          transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .portal-login__form-wrapper--visible {
          opacity: 1;
          transform: translateY(0);
        }
        .portal-login__form-wrapper--exit {
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
          filter: blur(10px);
        }
        .portal-login__form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .portal-login__field { text-align: left; }
        .portal-login__label {
          display: block;
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.25em;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .portal-login__input {
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
        .portal-login__input:focus {
          border-color: rgba(201, 169, 110, 0.4);
          background: rgba(201, 169, 110, 0.03);
          box-shadow: 0 0 30px rgba(201, 169, 110, 0.05);
        }
        .portal-login__input::placeholder { color: rgba(255, 255, 255, 0.15); }
        .portal-login__error {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: #ef4444;
          letter-spacing: 0.05em;
          margin: -8px 0 0;
          text-align: left;
        }
        .portal-login__button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 18px 32px;
          margin-top: 8px;
          background: transparent;
          border: 1px solid rgba(201, 169, 110, 0.3);
          cursor: pointer;
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .portal-login__button:disabled {
          opacity: 0.5;
          cursor: wait;
        }
        .portal-login__button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(201, 169, 110, 0.1), rgba(201, 169, 110, 0.02));
          opacity: 0;
          transition: opacity 0.6s ease;
        }
        .portal-login__button:hover:not(:disabled)::before { opacity: 1; }
        .portal-login__button:hover:not(:disabled) {
          border-color: rgba(201, 169, 110, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(201, 169, 110, 0.1);
        }
        .portal-login__button-text {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #c9a96e;
          position: relative;
          z-index: 1;
        }
        .portal-login__button-arrow {
          font-size: 16px;
          color: #c9a96e;
          transition: transform 0.4s ease;
          position: relative;
          z-index: 1;
        }
        .portal-login__button:hover:not(:disabled) .portal-login__button-arrow {
          transform: translateX(4px);
        }
        .portal-login__toggle {
          background: none;
          border: none;
          color: rgba(201, 169, 110, 0.4);
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          letter-spacing: 0.1em;
          cursor: pointer;
          padding: 8px 0;
          transition: color 0.3s ease;
          margin-top: -8px;
        }
        .portal-login__toggle:hover { color: rgba(201, 169, 110, 0.7); }
        .portal-login__notice {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.15);
          letter-spacing: 0.1em;
          margin-top: 24px;
          line-height: 1.6;
        }
        /* Magic link sent state */
        .portal-login__magic-sent { text-align: center; }
        .portal-login__magic-icon {
          font-size: 40px;
          margin-bottom: 20px;
          opacity: 0.8;
        }
        .portal-login__magic-text {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 20px;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 8px;
        }
        .portal-login__magic-text strong { color: #c9a96e; }
        .portal-login__magic-sub {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
          letter-spacing: 0.05em;
          margin: 0 0 24px;
        }
        .portal-login__magic-back {
          background: none;
          border: none;
          color: rgba(201, 169, 110, 0.5);
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          letter-spacing: 0.1em;
          cursor: pointer;
          padding: 8px 0;
        }
        .portal-login__magic-back:hover { color: #c9a96e; }
        /* Transition */
        .portal-login__transition {
          position: fixed;
          inset: 0;
          background: #000;
          z-index: 1000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 1.5s ease;
        }
        .portal-login__transition--active {
          opacity: 1;
          pointer-events: all;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes titleReveal {
          from { opacity: 0; transform: translateY(40px); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @media (max-width: 768px) {
          .portal-login__content { padding: 20px; }
          .portal-login__title-line--1 { letter-spacing: 0.15em; }
          .portal-login__title-line--2 { letter-spacing: 0.1em; }
        }
      `}</style>
    </div>
  );
}
