'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PortalNav from '@/components/portal/PortalNav';
import { useAuth } from '@/components/portal/AuthProvider';
import { getMyPortalData, type PortalData } from '@/lib/portal-data';
import type { Client, Engagement } from '@/lib/database.types';

const Scene3D = dynamic(() => import('@/components/portal/Scene3D'), { ssr: false });

const PHASE_LABELS = [
  { num: 'I', label: 'Confidential Consultation' },
  { num: 'II', label: 'Independent Assessment' },
  { num: 'III', label: 'Scope & Vendor Curation' },
  { num: 'IV', label: 'Oversight & Clearance' },
];

export default function PortalDashboard() {
  const { supabase, user, profile, isAdmin, loading: authLoading } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [time, setTime] = useState('');
  const [portalData, setPortalData] = useState<PortalData | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchData = async () => {
      const data = await getMyPortalData(supabase);
      setPortalData(data);
      setLoaded(true);
    };
    fetchData();

    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Los_Angeles' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [supabase, user, authLoading]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const activeClient: Client | null = portalData?.client || null;
  const engagement: Engagement | null = portalData?.engagement || null;
  const docs = portalData?.documents || [];
  const msgs = portalData?.messages || [];
  const unreadMsgs = msgs.filter(m => !m.read).length;

  const daysSince = engagement
    ? Math.floor((Date.now() - new Date(engagement.start_date).getTime()) / 86400000)
    : 0;

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'there';

  const phases = PHASE_LABELS.map((p, i) => ({
    ...p,
    status: engagement
      ? i + 1 < parseInt(engagement.phase) ? 'complete'
        : i + 1 === parseInt(engagement.phase) ? 'active'
        : 'upcoming'
      : 'upcoming',
  }));

  const recentActivity = [
    ...docs.slice(0, 3).map(d => ({
      date: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      action: `Document: ${d.status === 'final' ? 'uploaded' : d.status === 'draft' ? 'draft saved' : 'pending review'}`,
      type: 'document',
      detail: d.name,
    })),
    ...msgs.slice(0, 2).map(m => ({
      date: new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      action: `Message from ${m.sender_name}`,
      type: 'message',
      detail: m.subject,
    })),
  ].slice(0, 5);

  const stats = [
    { label: 'Documents', value: String(docs.length), sub: 'in vault' },
    { label: 'Messages', value: String(msgs.length), sub: `unread: ${unreadMsgs}` },
    { label: 'Days Active', value: String(Math.max(daysSince, 1)), sub: 'since engagement' },
  ];

  if (authLoading || !portalData) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(201,169,110,0.5)', fontFamily: 'Inter, sans-serif', fontSize: 12, letterSpacing: '0.3em' }}>
          LOADING...
        </span>
      </div>
    );
  }

  return (
    <div className="dash">
      <Scene3D variant="dashboard" />
      <PortalNav />
      <div className="dash__vignette" />

      <main className={`dash__main ${loaded ? 'dash__main--loaded' : ''}`}>
        {/* Hero greeting */}
        <section className="dash__hero">
          <span className="dash__time">{time} PT</span>
          <h1 className="dash__greeting">
            <span className="dash__greeting-line">{getGreeting()},</span>
            <span className="dash__greeting-name">{displayName.split(' ')[0]}.</span>
          </h1>
          {engagement && (
            <p className="dash__engagement-label">
              Current engagement — <span className="dash__gold">{engagement.type}</span>
            </p>
          )}
          {isAdmin && !engagement && (
            <p className="dash__engagement-label">
              Administrator view — <span className="dash__gold">all engagements</span>
            </p>
          )}
        </section>

        {/* Phase tracker */}
        {engagement && (
          <section className="dash__phases" style={{ animationDelay: '0.4s' }}>
            <div className="dash__section-header">
              <span className="dash__section-label">ENGAGEMENT PHASE</span>
              <span className="dash__section-sub">Started {engagement.start_date}</span>
            </div>
            <div className="dash__phase-track">
              {phases.map((phase, i) => (
                <div key={i} className={`dash__phase dash__phase--${phase.status}`}>
                  <div className="dash__phase-num">{phase.num}</div>
                  <div className="dash__phase-label">{phase.label}</div>
                  {phase.status === 'active' && <div className="dash__phase-pulse" />}
                  {i < phases.length - 1 && (
                    <div className={`dash__phase-connector ${
                      phase.status === 'complete' ? 'dash__phase-connector--done' : ''
                    }`} />
                  )}
                </div>
              ))}
            </div>
            {engagement.next_milestone && (
              <div className="dash__milestone">
                <span className="dash__milestone-icon">◈</span>
                <span>Next: {engagement.next_milestone}</span>
              </div>
            )}
          </section>
        )}

        {/* Stats + Activity grid */}
        <div className="dash__grid">
          <section className="dash__stats" style={{ animationDelay: '0.6s' }}>
            {stats.map((stat, i) => (
              <a key={i} className="dash__stat" href={i === 0 ? '/portal/documents' : i === 1 ? '/portal/messages' : '#'} style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                <div className="dash__stat-value">{stat.value}</div>
                <div className="dash__stat-label">{stat.label}</div>
                <div className="dash__stat-sub">{stat.sub}</div>
              </a>
            ))}
          </section>

          <section className="dash__activity" style={{ animationDelay: '0.8s' }}>
            <div className="dash__section-header">
              <span className="dash__section-label">RECENT ACTIVITY</span>
            </div>
            <div className="dash__activity-list">
              {recentActivity.length > 0 ? recentActivity.map((item, i) => (
                <a key={i} className="dash__activity-item" href={item.type === 'document' ? '/portal/documents' : '/portal/messages'} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="dash__activity-dot" data-type={item.type} />
                  <div className="dash__activity-content">
                    <span className="dash__activity-action">{item.action}</span>
                    <span className="dash__activity-detail">{item.detail}</span>
                  </div>
                  <span className="dash__activity-date">{item.date}</span>
                </a>
              )) : (
                <p style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, sans-serif', fontSize: 12, padding: '20px 0' }}>
                  No recent activity.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Property reference */}
        {activeClient && engagement && (
          <section className="dash__property" style={{ animationDelay: '1s' }}>
            <div className="dash__property-inner">
              <span className="dash__property-label">ENGAGEMENT PROPERTY</span>
              <h2 className="dash__property-address">{engagement.property}</h2>
              <span className="dash__property-area">{activeClient.area}, California</span>
            </div>
          </section>
        )}
      </main>

      <style jsx>{`
        .dash { position: relative; min-height: 100vh; background: #000; }
        .dash__vignette {
          position: fixed; inset: 0;
          background: radial-gradient(ellipse at 30% 20%, transparent 20%, rgba(0,0,0,0.85) 100%);
          z-index: 1; pointer-events: none;
        }
        .dash__main {
          position: relative; z-index: 10;
          padding: 120px 60px 60px; max-width: 1400px; margin: 0 auto;
        }
        .dash__main > section, .dash__main > div {
          opacity: 0; transform: translateY(30px);
          animation: dashReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .dash__gold { color: #c9a96e; }
        .dash__hero { margin-bottom: 80px; animation-delay: 0.2s !important; }
        .dash__time {
          font-family: 'Inter', sans-serif; font-size: 11px;
          letter-spacing: 0.3em; color: rgba(255,255,255,0.2); text-transform: uppercase;
        }
        .dash__greeting { margin: 16px 0 24px; line-height: 1; }
        .dash__greeting-line {
          display: block; font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(32px, 4vw, 56px); font-weight: 300;
          color: rgba(255,255,255,0.5); letter-spacing: 0.02em;
        }
        .dash__greeting-name {
          display: block; font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(48px, 7vw, 96px); font-weight: 300;
          color: #fff; letter-spacing: -0.01em; margin-top: 4px;
        }
        .dash__engagement-label {
          font-family: 'Inter', sans-serif; font-size: 13px;
          color: rgba(255,255,255,0.3); letter-spacing: 0.08em;
        }
        .dash__phases {
          margin-bottom: 60px; padding: 40px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04);
          backdrop-filter: blur(10px);
        }
        .dash__section-header {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;
        }
        .dash__section-label {
          font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 400;
          letter-spacing: 0.35em; color: rgba(255,255,255,0.3);
        }
        .dash__section-sub {
          font-family: 'Inter', sans-serif; font-size: 11px;
          color: rgba(255,255,255,0.15); letter-spacing: 0.05em;
        }
        .dash__phase-track { display: grid; grid-template-columns: repeat(4, 1fr); position: relative; }
        .dash__phase { position: relative; text-align: center; padding: 20px 0; }
        .dash__phase-num {
          font-family: 'Cormorant Garamond', Georgia, serif; font-size: 32px; font-weight: 300;
          color: rgba(255,255,255,0.15); margin-bottom: 12px; transition: color 0.5s ease;
        }
        .dash__phase--complete .dash__phase-num { color: rgba(201, 169, 110, 0.6); }
        .dash__phase--active .dash__phase-num { color: #c9a96e; font-weight: 400; }
        .dash__phase-label {
          font-family: 'Inter', sans-serif; font-size: 11px; letter-spacing: 0.1em;
          color: rgba(255,255,255,0.2); text-transform: uppercase;
        }
        .dash__phase--active .dash__phase-label { color: rgba(255,255,255,0.7); }
        .dash__phase-pulse {
          position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(201, 169, 110, 0.1);
          animation: pulse 2.5s ease-in-out infinite;
        }
        .dash__phase-connector {
          position: absolute; top: 36px; right: -10%; width: 20%; height: 1px;
          background: rgba(255,255,255,0.06);
        }
        .dash__phase-connector--done { background: rgba(201, 169, 110, 0.25); }
        .dash__milestone {
          display: flex; align-items: center; gap: 10px; margin-top: 28px;
          padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.04);
          font-family: 'Inter', sans-serif; font-size: 12px;
          color: rgba(255,255,255,0.35); letter-spacing: 0.05em;
        }
        .dash__milestone-icon { color: #c9a96e; }
        .dash__grid { display: grid; grid-template-columns: 280px 1fr; gap: 32px; margin-bottom: 60px; }
        .dash__stats { display: flex; flex-direction: column; }
        .dash__stat {
          padding: 28px 32px; background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04); border-bottom: none;
          transition: all 0.4s ease;
        }
        .dash__stat:last-child { border-bottom: 1px solid rgba(255,255,255,0.04); }
        .dash__stat:hover { background: rgba(201, 169, 110, 0.03); border-color: rgba(201, 169, 110, 0.1); }
        .dash__stat-value {
          font-family: 'Cormorant Garamond', Georgia, serif; font-size: 42px;
          font-weight: 300; color: #fff; line-height: 1; margin-bottom: 8px;
        }
        .dash__stat-label {
          font-family: 'Inter', sans-serif; font-size: 11px; letter-spacing: 0.2em;
          text-transform: uppercase; color: rgba(255,255,255,0.4);
        }
        .dash__stat-sub {
          font-family: 'Inter', sans-serif; font-size: 10px;
          color: rgba(255,255,255,0.15); margin-top: 4px; letter-spacing: 0.05em;
        }
        .dash__activity {
          padding: 32px; background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
        }
        .dash__activity-list { display: flex; flex-direction: column; }
        .dash__activity-item {
          display: flex; align-items: flex-start; gap: 16px; padding: 18px 0;
          border-bottom: 1px solid rgba(255,255,255,0.03); transition: all 0.3s ease;
        }
        .dash__activity-item:hover { padding-left: 8px; }
        .dash__activity-item:last-child { border-bottom: none; }
        .dash__activity-dot {
          width: 6px; height: 6px; border-radius: 50%; margin-top: 6px;
          flex-shrink: 0; background: rgba(255,255,255,0.15);
        }
        .dash__activity-dot[data-type="document"] { background: #c9a96e; }
        .dash__activity-dot[data-type="message"] { background: #6ea9c9; }
        .dash__activity-content { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .dash__activity-action {
          font-family: 'Inter', sans-serif; font-size: 13px;
          color: rgba(255,255,255,0.7); letter-spacing: 0.02em;
        }
        .dash__activity-detail {
          font-family: 'Inter', sans-serif; font-size: 11px;
          color: rgba(255,255,255,0.25); letter-spacing: 0.02em;
        }
        .dash__activity-date {
          font-family: 'Inter', sans-serif; font-size: 10px;
          color: rgba(255,255,255,0.15); letter-spacing: 0.1em;
          white-space: nowrap; margin-top: 2px;
        }
        .dash__property {
          border: 1px solid rgba(201, 169, 110, 0.08);
          background: rgba(201, 169, 110, 0.02); transition: all 0.5s ease;
        }
        .dash__property:hover { border-color: rgba(201, 169, 110, 0.15); }
        .dash__property-inner { padding: 40px; text-align: center; }
        .dash__property-label {
          font-family: 'Inter', sans-serif; font-size: 10px; letter-spacing: 0.35em;
          color: rgba(201, 169, 110, 0.5); display: block; margin-bottom: 16px;
        }
        .dash__property-address {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(24px, 3.5vw, 42px); font-weight: 300;
          color: #fff; margin: 0 0 8px; letter-spacing: 0.02em;
        }
        .dash__property-area {
          font-family: 'Inter', sans-serif; font-size: 12px;
          color: rgba(255,255,255,0.2); letter-spacing: 0.15em;
        }
        @keyframes dashReveal {
          from { opacity: 0; transform: translateY(30px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.5; }
          50% { transform: translateX(-50%) scale(2); opacity: 0; }
        }
        @media (max-width: 900px) {
          .dash__main { padding: 100px 24px 40px; }
          .dash__grid { grid-template-columns: 1fr; }
          .dash__stats { flex-direction: row; }
          .dash__stat { flex: 1; border-bottom: 1px solid rgba(255,255,255,0.04); }
          .dash__phase-track { grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .dash__phase-connector { display: none; }
        }
        @media (max-width: 480px) { .dash__stats { flex-direction: column; } }
      `}</style>
    </div>
  );
}
