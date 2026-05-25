'use client';

import dynamic from 'next/dynamic';
import PortalNav from '@/components/portal/PortalNav';

const Scene3D = dynamic(() => import('@/components/portal/Scene3D'), { ssr: false });

const TIMELINE = [
  {
    phase: 'I',
    title: 'Confidential Consultation',
    status: 'complete' as const,
    date: 'March 14 – March 21, 2026',
    events: [
      { date: 'Mar 14', text: 'Initial private consultation — NDA executed', icon: '◈' },
      { date: 'Mar 16', text: 'Property walkthrough under confidential terms', icon: '◎' },
      { date: 'Mar 21', text: 'Engagement letter signed — retainer received', icon: '▣' },
    ],
    summary: 'Confidential consultation completed. Matter identified as mold and water intrusion in primary residence. Engagement accepted.',
  },
  {
    phase: 'II',
    title: 'Independent Assessment',
    status: 'complete' as const,
    date: 'March 22 – May 3, 2026',
    events: [
      { date: 'Mar 28', text: 'IEP initial survey and sampling design coordinated', icon: '◈' },
      { date: 'Apr 5', text: 'Moisture mapping completed — Zones A through C', icon: '◎' },
      { date: 'Apr 12', text: 'Air quality sampling and lab analysis received', icon: '◈' },
      { date: 'Apr 28', text: 'Final independent site visit — all areas inspected', icon: '◎' },
      { date: 'May 3', text: 'Phase II closeout — assessment documentation finalized', icon: '▣' },
    ],
    summary: 'Independent assessment confirmed elevated moisture and microbial activity in three zones. Documentation secured for scope development.',
  },
  {
    phase: 'III',
    title: 'Scope & Vendor Curation',
    status: 'active' as const,
    date: 'May 8 – Present',
    events: [
      { date: 'May 8', text: 'Remediation scope drafted from assessment findings', icon: '◈' },
      { date: 'May 10–13', text: 'Three qualified vendor proposals received and reviewed', icon: '◎' },
      { date: 'May 16', text: 'Scope comparison matrix prepared for client review', icon: '◈' },
      { date: 'May 22', text: 'Vendor shortlist presentation — scheduled', icon: '▤', upcoming: true },
    ],
    summary: 'Scope defined. Vendor proposals under comparison. Shortlist presentation scheduled for May 22.',
  },
  {
    phase: 'IV',
    title: 'Oversight & Clearance',
    status: 'upcoming' as const,
    date: 'Pending Phase III completion',
    events: [
      { date: 'TBD', text: 'Vendor selection and contract execution', icon: '◈' },
      { date: 'TBD', text: 'On-site remediation oversight commences', icon: '◎' },
      { date: 'TBD', text: 'Post-remediation verification and clearance testing', icon: '◈' },
      { date: 'TBD', text: 'Final sign-off and engagement closeout', icon: '▣' },
    ],
    summary: 'On-site oversight through remediation completion. Independent clearance verification before sign-off.',
  },
];

export default function PortalTimeline() {
  return (
    <div className="tl">
      <Scene3D variant="minimal" />
      <PortalNav />
      <div className="tl__vignette" />

      <main className="tl__main">
        <section className="tl__hero">
          <span className="tl__label">ENGAGEMENT TIMELINE</span>
          <h1 className="tl__title">Your Journey</h1>
          <p className="tl__sub">Mold & Water Intrusion — 1247 Pacific Coast Highway</p>
        </section>

        <div className="tl__track">
          {TIMELINE.map((phase, pi) => (
            <div key={pi} className={`tl__phase tl__phase--${phase.status}`}>
              {/* Phase header */}
              <div className="tl__phase-header">
                <div className="tl__phase-marker">
                  <span className="tl__phase-num">{phase.phase}</span>
                  {phase.status === 'active' && <div className="tl__phase-glow" />}
                </div>
                <div className="tl__phase-info">
                  <h2 className="tl__phase-title">{phase.title}</h2>
                  <span className="tl__phase-date">{phase.date}</span>
                </div>
                <span className={`tl__phase-badge tl__phase-badge--${phase.status}`}>
                  {phase.status === 'complete' ? '✓ COMPLETE' : phase.status === 'active' ? '● ACTIVE' : '○ UPCOMING'}
                </span>
              </div>

              {/* Events */}
              <div className="tl__events">
                {phase.events.map((event, ei) => (
                  <div
                    key={ei}
                    className={`tl__event ${'upcoming' in event && event.upcoming ? 'tl__event--upcoming' : ''}`}
                  >
                    <div className="tl__event-line" />
                    <div className="tl__event-dot" />
                    <span className="tl__event-date">{event.date}</span>
                    <span className="tl__event-icon">{event.icon}</span>
                    <span className="tl__event-text">{event.text}</span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="tl__phase-summary">
                <p>{phase.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <style jsx>{`
        .tl {
          position: relative;
          min-height: 100vh;
          background: #000;
        }
        .tl__vignette {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at 20% 50%, transparent 20%, rgba(0,0,0,0.9) 100%);
          z-index: 1;
          pointer-events: none;
        }
        .tl__main {
          position: relative;
          z-index: 10;
          padding: 120px 60px 80px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .tl__hero {
          margin-bottom: 64px;
          opacity: 0;
          animation: tlReveal 1s ease 0.2s forwards;
        }
        .tl__label {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          letter-spacing: 0.4em;
          color: rgba(201, 169, 110, 0.5);
        }
        .tl__title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(40px, 6vw, 80px);
          font-weight: 300;
          color: #fff;
          margin: 12px 0 16px;
          line-height: 1;
        }
        .tl__sub {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.1em;
        }

        .tl__track {
          position: relative;
        }

        .tl__phase {
          position: relative;
          margin-bottom: 48px;
          opacity: 0;
          animation: tlReveal 0.8s ease forwards;
        }
        .tl__phase:nth-child(1) { animation-delay: 0.3s; }
        .tl__phase:nth-child(2) { animation-delay: 0.5s; }
        .tl__phase:nth-child(3) { animation-delay: 0.7s; }
        .tl__phase:nth-child(4) { animation-delay: 0.9s; }

        .tl__phase-header {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 24px;
          padding: 24px 32px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
        }
        .tl__phase--active .tl__phase-header {
          border-color: rgba(201, 169, 110, 0.15);
          background: rgba(201, 169, 110, 0.02);
        }
        .tl__phase--upcoming .tl__phase-header {
          opacity: 0.4;
        }

        .tl__phase-marker {
          position: relative;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
        }
        .tl__phase--complete .tl__phase-marker { border-color: rgba(201, 169, 110, 0.3); }
        .tl__phase--active .tl__phase-marker { border-color: #c9a96e; }
        .tl__phase-num {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 24px;
          font-weight: 300;
          color: rgba(255,255,255,0.3);
        }
        .tl__phase--complete .tl__phase-num { color: rgba(201, 169, 110, 0.7); }
        .tl__phase--active .tl__phase-num { color: #c9a96e; }
        .tl__phase-glow {
          position: absolute;
          inset: -4px;
          border: 1px solid rgba(201, 169, 110, 0.2);
          animation: pulse 2.5s ease infinite;
        }

        .tl__phase-info { flex: 1; }
        .tl__phase-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 24px;
          font-weight: 400;
          color: #fff;
          margin: 0 0 4px;
        }
        .tl__phase--upcoming .tl__phase-title { color: rgba(255,255,255,0.5); }
        .tl__phase-date {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.08em;
        }

        .tl__phase-badge {
          font-family: 'Inter', sans-serif;
          font-size: 9px;
          letter-spacing: 0.2em;
          padding: 6px 14px;
          flex-shrink: 0;
        }
        .tl__phase-badge--complete {
          color: rgba(201, 169, 110, 0.6);
          border: 1px solid rgba(201, 169, 110, 0.15);
        }
        .tl__phase-badge--active {
          color: #c9a96e;
          border: 1px solid rgba(201, 169, 110, 0.3);
          background: rgba(201, 169, 110, 0.05);
        }
        .tl__phase-badge--upcoming {
          color: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.05);
        }

        .tl__events {
          padding-left: 28px;
          margin-left: 28px;
          border-left: 1px solid rgba(255,255,255,0.04);
        }
        .tl__phase--active .tl__events { border-left-color: rgba(201, 169, 110, 0.1); }

        .tl__event {
          position: relative;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 0;
        }
        .tl__event--upcoming { opacity: 0.4; }
        .tl__event-dot {
          position: absolute;
          left: -32.5px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
        }
        .tl__phase--complete .tl__event-dot { background: rgba(201, 169, 110, 0.4); }
        .tl__phase--active .tl__event-dot { background: #c9a96e; }
        .tl__event-date {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.1em;
          min-width: 60px;
          flex-shrink: 0;
        }
        .tl__event-icon {
          font-size: 12px;
          color: rgba(255,255,255,0.15);
          flex-shrink: 0;
        }
        .tl__phase--active .tl__event-icon { color: rgba(201, 169, 110, 0.5); }
        .tl__event-text {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.01em;
          line-height: 1.5;
        }
        .tl__phase--active .tl__event-text { color: rgba(255,255,255,0.7); }

        .tl__phase-summary {
          margin: 16px 0 0 56px;
          padding: 20px 24px;
          border-left: 2px solid rgba(255,255,255,0.03);
        }
        .tl__phase--active .tl__phase-summary { border-left-color: rgba(201, 169, 110, 0.15); }
        .tl__phase-summary p {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 16px;
          font-style: italic;
          color: rgba(255,255,255,0.25);
          line-height: 1.6;
          margin: 0;
        }
        .tl__phase--active .tl__phase-summary p { color: rgba(255,255,255,0.4); }

        @keyframes tlReveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0; transform: scale(1.3); }
        }

        @media (max-width: 768px) {
          .tl__main { padding: 100px 16px 40px; }
          .tl__header h1 { font-size: 28px; }
          .tl__phase-header { flex-wrap: wrap; padding: 20px; gap: 16px; }
          .tl__phase-badge { order: -1; }
          .tl__events { padding-left: 20px; margin-left: 20px; }
          .tl__event { flex-wrap: wrap; }
          .tl__phase-summary { margin-left: 0; }
        }
      `}</style>
    </div>
  );
}
