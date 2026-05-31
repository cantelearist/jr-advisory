'use client';

import type { Client } from '@/lib/database.types';

interface Props {
  clients: Client[];
  onReset: () => void;
}

export default function AdminSettings({ clients, onReset }: Props) {
  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-header__eyebrow">SYSTEM</div>
          <h1 className="admin-header__title">Settings</h1>
        </div>
      </div>

      {/* Database */}
      <div className="admin-settings-card">
        <h3>Test Database</h3>
        <p style={{ fontSize: 14, color: 'var(--admin-text-muted)', marginBottom: 20 }}>
          Reset all data to the initial seed state. This will remove any changes, custom invoices, and content edits.
        </p>
        <button onClick={onReset} className="admin-btn admin-btn--danger">RESET ALL DATA</button>
      </div>

      {/* Auth */}
      <div className="admin-settings-card">
        <h3>Authentication</h3>
        <dl className="admin-settings-grid">
          <dt>Mode:</dt><dd style={{ color: 'var(--admin-green)' }}>Supabase (Live)</dd>
          <dt>Auth:</dt><dd style={{ color: 'var(--admin-green)' }}>Email / Magic Link ✓</dd>
          <dt>Clients:</dt><dd>{clients.length} accounts</dd>
        </dl>
      </div>

      {/* Payments */}
      <div className="admin-settings-card">
        <h3>Payments</h3>
        <dl className="admin-settings-grid">
          <dt>Processor:</dt><dd style={{ color: 'var(--admin-accent)' }}>Stripe</dd>
          <dt>Status:</dt><dd style={{ color: 'rgba(255,255,255,0.5)' }}>Pending API keys</dd>
          <dt>Checkout:</dt><dd style={{ color: 'rgba(255,255,255,0.5)' }}>Ready (needs STRIPE_SECRET_KEY env var)</dd>
        </dl>
      </div>

      {/* Email */}
      <div className="admin-settings-card">
        <h3>Email Notifications</h3>
        <dl className="admin-settings-grid">
          <dt>Provider:</dt><dd style={{ color: 'var(--admin-accent)' }}>Resend</dd>
          <dt>Status:</dt><dd style={{ color: 'rgba(255,255,255,0.5)' }}>Ready (needs RESEND_API_KEY env var)</dd>
          <dt>Triggers:</dt><dd style={{ color: 'rgba(255,255,255,0.5)' }}>New message · Invoice sent · Document upload · Phase change</dd>
          <dt>From:</dt><dd style={{ color: 'rgba(255,255,255,0.5)' }}>notifications@jamesroman.la</dd>
        </dl>
      </div>

      {/* Firm info */}
      <div className="admin-settings-card">
        <h3>Firm Information</h3>
        <dl className="admin-settings-grid">
          <dt>Name:</dt><dd>James Roman Advisory</dd>
          <dt>Phone:</dt><dd>(310) 430-2500</dd>
          <dt>Email:</dt><dd>roman@jamesroman.la</dd>
          <dt>Domain:</dt><dd>jamesroman.la</dd>
        </dl>
      </div>
    </>
  );
}
