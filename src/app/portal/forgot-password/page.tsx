'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Something went wrong.');
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fp-page">
      <div className="fp-content">
        <div className="fp-header">
          <div className="fp-line" />
          <span className="fp-firm">JAMES ROMAN ADVISORY</span>
          <div className="fp-line" />
        </div>

        <h1 className="fp-title">Reset Password</h1>

        {sent ? (
          <div className="fp-sent">
            <div className="fp-icon">✉</div>
            <p className="fp-sent-title">
              Reset link sent to <strong>{email}</strong>
            </p>
            <p className="fp-sent-sub">
              Check your inbox and click the link to set a new password.
              The link expires in 1 hour.
            </p>
            <Link href="/portal" className="fp-back">
              ← Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="fp-form">
            <p className="fp-description">
              Enter the email address associated with your account.
              We&apos;ll send you a link to reset your password.
            </p>
            <div className="fp-field">
              <label className="fp-label">Email</label>
              <input
                type="email"
                className="fp-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
              />
            </div>
            {error && <p className="fp-error">{error}</p>}
            <button type="submit" className="fp-button" disabled={loading}>
              <span className="fp-button-text">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </span>
              <span className="fp-button-arrow">→</span>
            </button>
            <Link href="/portal" className="fp-back">
              ← Back to login
            </Link>
          </form>
        )}
      </div>

      <style jsx>{`
        .fp-page {
          min-height: 100vh;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }
        .fp-content {
          width: 100%;
          max-width: 420px;
          text-align: center;
        }
        .fp-header {
          display: flex;
          align-items: center;
          gap: 16px;
          justify-content: center;
          margin-bottom: 48px;
        }
        .fp-line {
          height: 1px;
          width: 40px;
          background: rgba(201, 169, 110, 0.25);
        }
        .fp-firm {
          font-family: 'Inter', sans-serif;
          font-size: 9px;
          font-weight: 400;
          letter-spacing: 0.35em;
          color: rgba(201, 169, 110, 0.4);
          text-transform: uppercase;
          white-space: nowrap;
        }
        .fp-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 36px;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 0.06em;
          margin: 0 0 32px;
        }
        .fp-description {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
          line-height: 1.6;
          margin: 0 0 32px;
          text-align: left;
        }
        .fp-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .fp-field {
          text-align: left;
        }
        .fp-label {
          display: block;
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.25em;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .fp-input {
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
        .fp-input:focus {
          border-color: rgba(201, 169, 110, 0.4);
          background: rgba(201, 169, 110, 0.03);
          box-shadow: 0 0 30px rgba(201, 169, 110, 0.05);
        }
        .fp-input::placeholder {
          color: rgba(255, 255, 255, 0.15);
        }
        .fp-error {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: #ef4444;
          letter-spacing: 0.05em;
          margin: -8px 0 0;
          text-align: left;
        }
        .fp-button {
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
        .fp-button:disabled {
          opacity: 0.5;
          cursor: wait;
        }
        .fp-button:hover:not(:disabled) {
          border-color: rgba(201, 169, 110, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(201, 169, 110, 0.1);
        }
        .fp-button-text {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #c9a96e;
        }
        .fp-button-arrow {
          font-size: 16px;
          color: #c9a96e;
          transition: transform 0.4s ease;
        }
        .fp-button:hover:not(:disabled) .fp-button-arrow {
          transform: translateX(4px);
        }
        .fp-back {
          display: inline-block;
          color: rgba(201, 169, 110, 0.4);
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-decoration: none;
          transition: color 0.3s ease;
        }
        .fp-back:hover {
          color: rgba(201, 169, 110, 0.7);
        }
        /* Sent state */
        .fp-sent {
          text-align: center;
        }
        .fp-icon {
          font-size: 40px;
          margin-bottom: 20px;
          opacity: 0.8;
        }
        .fp-sent-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 20px;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 8px;
        }
        .fp-sent-title strong {
          color: #c9a96e;
        }
        .fp-sent-sub {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
          letter-spacing: 0.05em;
          margin: 0 0 24px;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
