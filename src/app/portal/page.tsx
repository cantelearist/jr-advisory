'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/portal/AuthProvider';
import { resolvePortalDestination } from '@/lib/portal-routing';

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
  const { user, clientRecord, isAdmin, loading: authLoading, supabase } = useAuth();
  const oauthLoginEnabled = process.env.NEXT_PUBLIC_OAUTH_LOGIN_ENABLED === 'true';
  const [phase, setPhase] = useState<'intro' | 'form' | 'entering'>('intro');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [showMagicLink, setShowMagicLink] = useState(true);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setPhase('form'), 2200);
    const err = searchParams.get('error');
    const mode = searchParams.get('mode');

    if (mode === 'password') setShowMagicLink(false);
    if (err === 'link_expired') {
      setShowMagicLink(true);
      setLinkExpired(true);
      setMagicLinkSent(false);
    } else if (err) {
      setLinkExpired(false);
      setMagicLinkSent(false);
      setError('We could not verify that sign-in. Please try again.');
    }

    return () => clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    if (authLoading || !user) return;

    const destination = resolvePortalDestination({
      redirect: searchParams.get('redirect'),
      isAdmin,
      hasClientRecord: Boolean(clientRecord),
      onboarded: user.user_metadata?.onboarded !== false,
    });

    setPhase('entering');
    const timer = setTimeout(() => router.replace(destination), 700);

    return () => clearTimeout(timer);
  }, [authLoading, user, clientRecord, isAdmin, router, searchParams]);

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
      const isPrivileged = role === 'admin' || role === 'manager';
      const destination = resolvePortalDestination({
        redirect: searchParams.get('redirect'),
        isAdmin: isPrivileged,
        hasClientRecord: true,
        onboarded,
      });

      if (result.mfaRequired) {
        setTimeout(
          () => router.push(`/portal/mfa?redirect=${encodeURIComponent(destination)}`),
          1600,
        );
        return;
      }

      setTimeout(() => router.push(destination), 1600);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError('An email so we can reach you.');
      return;
    }
    setError('');
    setLinkExpired(false);
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
        setError(result.error || "That didn't go through, and it's on our end. Try again in a moment — we'll be here.");
        setLoading(false);
        return;
      }

      setMagicLinkSent(true);
      setLoading(false);
    } catch {
      setError("That didn't go through, and it's on our end. Try again in a moment — we'll be here.");
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    setError('');
    setOauthLoading(provider);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        setError(`We could not connect to ${provider === 'google' ? 'Google' : 'Apple'}. Please try again.`);
        setOauthLoading(null);
      }
    } catch {
      setError(`We could not connect to ${provider === 'google' ? 'Google' : 'Apple'}. Please try again.`);
      setOauthLoading(null);
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
          <span className="portal-login__title-line portal-login__title-line--1">THE PRIVATE</span>
          <span className="portal-login__title-line portal-login__title-line--2">OFFICE</span>
        </h1>

        {/* Subtitle */}
        <p className={`portal-login__subtitle ${phase === 'form' ? 'portal-login__subtitle--visible' : ''}`}>
          Restricted access. Issued to active engagements only.
        </p>

        {/* Login form */}
        <div
          ref={formRef}
          className={`portal-login__form-wrapper ${
            phase === 'form' ? 'portal-login__form-wrapper--visible' : ''
          } ${phase === 'entering' ? 'portal-login__form-wrapper--exit' : ''}`}
        >
          {linkExpired ? (
            <div className="portal-login__magic-sent">
              <p className="portal-login__magic-text">This link has expired.</p>
              <button
                type="button"
                className="portal-login__button"
                onClick={() => { setLinkExpired(false); setMagicLinkSent(false); setShowMagicLink(true); setError(''); }}
              >
                <span className="portal-login__button-text">Send a new link</span>
                <span className="portal-login__button-arrow">→</span>
              </button>
            </div>
          ) : magicLinkSent ? (
            <div className="portal-login__magic-sent">
              <p className="portal-login__magic-text">
                Check your inbox. If that address is tied to an active engagement, a secure link is on its way. It expires in 15 minutes.
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
                <label className="portal-login__label">Engagement email</label>
                <input
                  type="email"
                  className="portal-login__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
                <p className="portal-login__helper">
                  We&apos;ll send a one-time secure link. No passwords. No trackers.
                </p>
              </div>
              {error && <p className="portal-login__error">{error}</p>}
              <button
                type="button"
                className="portal-login__button"
                onClick={handleMagicLink}
                disabled={loading}
              >
                <span className="portal-login__button-text">
                  {loading ? 'Sending…' : 'Send secure link'}
                </span>
                <span className="portal-login__button-arrow">→</span>
              </button>
              <p className="portal-login__secondary">
                Access is issued when an engagement begins.{' '}
                <Link href="/#consultation">Request a consultation</Link>
              </p>
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
          {oauthLoginEnabled && !linkExpired && !magicLinkSent && (
            <div className="portal-login__oauth">
              <div className="portal-login__divider" aria-hidden="true">
                <span />
                <span className="portal-login__divider-text">or</span>
                <span />
              </div>
              <div className="portal-login__oauth-options">
                <button
                  type="button"
                  className="portal-login__oauth-button"
                  aria-label="Continue with Google"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={loading || oauthLoading !== null}
                >
                  <svg className="portal-login__oauth-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z" />
                    <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.38l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.77-5.62-4.14H3.04v2.61A10 10 0 0 0 12 22Z" />
                    <path fill="#FBBC05" d="M6.38 13.91A6.02 6.02 0 0 1 6.07 12c0-.66.11-1.31.31-1.91V7.48H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.52l3.34-2.61Z" />
                    <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.82 1.49l2.88-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.48l3.34 2.61C7.18 7.72 9.39 5.95 12 5.95Z" />
                  </svg>
                  <span>{oauthLoading === 'google' ? 'Connecting…' : 'Google'}</span>
                </button>
                <button
                  type="button"
                  className="portal-login__oauth-button"
                  aria-label="Continue with Apple"
                  onClick={() => handleOAuthLogin('apple')}
                  disabled={loading || oauthLoading !== null}
                >
                  <svg className="portal-login__oauth-icon portal-login__oauth-icon--apple" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M16.7 12.86c.02-2.06 1.68-3.05 1.76-3.1a3.78 3.78 0 0 0-2.97-1.61c-1.25-.13-2.47.75-3.1.75-.64 0-1.6-.74-2.65-.72a3.9 3.9 0 0 0-3.28 2c-1.44 2.5-.36 6.18 1.01 8.2.69.98 1.49 2.08 2.54 2.04 1.03-.04 1.42-.65 2.66-.65 1.23 0 1.6.65 2.68.62 1.1-.02 1.8-.98 2.46-1.97a8.2 8.2 0 0 0 1.13-2.3 3.55 3.55 0 0 1-2.24-3.26ZM14.67 6.82a3.6 3.6 0 0 0 .82-2.58 3.68 3.68 0 0 0-2.39 1.23 3.46 3.46 0 0 0-.85 2.48 3.04 3.04 0 0 0 2.42-1.13Z" />
                  </svg>
                  <span>{oauthLoading === 'apple' ? 'Connecting…' : 'Apple'}</span>
                </button>
              </div>
            </div>
          )}
          <p className="portal-login__notice">
            NDA-protected · No portal trackers
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
          font-size: clamp(42px, 8vw, 92px);
          letter-spacing: 0.16em;
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
        .portal-login__input:focus-visible,
        .portal-login__button:focus-visible,
        .portal-login__oauth-button:focus-visible,
        .portal-login__toggle:focus-visible,
        .portal-login__magic-back:focus-visible,
        .portal-login__secondary a:focus-visible {
          outline: 1px solid rgba(201, 169, 110, 0.72);
          outline-offset: 4px;
        }
        .portal-login__input::placeholder { color: rgba(255, 255, 255, 0.15); }
        .portal-login__helper {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.32);
          letter-spacing: 0.04em;
          margin: 10px 0 0;
        }
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
        .portal-login__secondary {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.26);
          letter-spacing: 0.05em;
          line-height: 1.7;
          margin: -4px 0 0;
        }
        .portal-login__secondary a {
          color: rgba(201, 169, 110, 0.62);
          text-decoration: none;
        }
        .portal-login__secondary a:hover { color: rgba(201, 169, 110, 0.86); }
        .portal-login__oauth {
          margin-top: 24px;
        }
        .portal-login__divider {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }
        .portal-login__divider > span:not(.portal-login__divider-text) {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
        }
        .portal-login__divider-text {
          font-family: 'Inter', sans-serif;
          font-size: 9px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.24);
        }
        .portal-login__oauth-options {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .portal-login__oauth-button {
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 18px;
          border: 1px solid rgba(255, 255, 255, 0.11);
          background: rgba(255, 255, 255, 0.035);
          color: rgba(255, 255, 255, 0.82);
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.12em;
          cursor: pointer;
          transition: border-color 0.3s ease, background 0.3s ease, color 0.3s ease;
        }
        .portal-login__oauth-button:hover:not(:disabled) {
          border-color: rgba(201, 169, 110, 0.38);
          background: rgba(201, 169, 110, 0.05);
          color: #fff;
        }
        .portal-login__oauth-button:disabled {
          opacity: 0.5;
          cursor: wait;
        }
        .portal-login__oauth-icon {
          width: 17px;
          height: 17px;
          flex: 0 0 auto;
        }
        .portal-login__oauth-icon--apple {
          color: currentColor;
        }
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
          .portal-login__title-line--1 { letter-spacing: 0.1em; }
          .portal-login__title-line--2 { letter-spacing: 0.1em; }
          .portal-login__button { min-height: 44px; }
          .portal-login__oauth-button { min-height: 46px; }
        }
      `}</style>
    </div>
  );
}
