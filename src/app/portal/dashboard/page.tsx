'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PortalNav from '@/components/portal/PortalNav';
import { useAuth } from '@/components/portal/AuthProvider';
import { fetchPortalData, type PortalData } from '@/lib/portal-data';
import LoadingSkeleton from '@/components/portal/client/LoadingSkeleton';
import PhaseTracker from '@/components/portal/client/PhaseTracker';
import ActionAlert from '@/components/portal/client/ActionAlert';
import TodoList from '@/components/portal/client/TodoList';
import StatsGrid from '@/components/portal/client/StatsGrid';
import type { Client, Engagement, Todo } from '@/lib/database.types';

const Scene3D = dynamic(() => import('@/components/portal/Scene3D'), { ssr: false });

export default function PortalDashboard() {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [time, setTime] = useState('');
  const [portalData, setPortalData] = useState<PortalData | null>(null);

  useEffect(() => {
    fetchPortalData().then(data => {
      setPortalData(data);
      setLoaded(true);
    });

    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Los_Angeles' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (!portalData) return <LoadingSkeleton label="LOADING PORTAL" />;

  const activeClient: Client | null = portalData.client || null;
  const engagement: Engagement | null = portalData.engagement || null;
  const docs = portalData.documents || [];
  const msgs = portalData.messages || [];
  const clientTodos: Todo[] = portalData.todos || [];
  const urgentClientTodos = clientTodos.filter(t => t.priority === 'urgent' || t.priority === 'high');
  const overdueClientInvoices = (portalData.invoices || []).filter(i => i.status === 'overdue');
  const daysSince = engagement
    ? Math.floor((Date.now() - new Date(engagement.start_date).getTime()) / 86400000)
    : 0;
  const displayName = portalData.client?.name || profile?.full_name || user?.user_metadata?.full_name || 'there';

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
        {engagement && <PhaseTracker engagement={engagement} />}

        {/* Urgent tasks alert */}
        <ActionAlert urgentTodos={urgentClientTodos} overdueInvoices={overdueClientInvoices} />

        {/* Client to-do list */}
        <TodoList todos={clientTodos} />

        {/* Stats + Activity grid */}
        <StatsGrid documents={docs} messages={msgs} daysSince={daysSince} />

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
        .dash__property {
          border: 1px solid rgba(201,169,110,0.08);
          background: rgba(201,169,110,0.02); transition: all 0.5s ease;
        }
        .dash__property:hover { border-color: rgba(201,169,110,0.15); }
        .dash__property-inner { padding: 40px; text-align: center; }
        .dash__property-label {
          font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.35em;
          color: rgba(201,169,110,0.5); display: block; margin-bottom: 16px;
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
        @media (max-width: 900px) {
          .dash__main { padding: 100px 24px 40px; }
        }
      `}</style>
    </div>
  );
}
