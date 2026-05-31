'use client';

import type { Engagement } from '@/lib/database.types';
import './dashboard.css';

const PHASE_LABELS = [
  { num: 'I', label: 'Confidential Consultation' },
  { num: 'II', label: 'Independent Assessment' },
  { num: 'III', label: 'Scope & Vendor Curation' },
  { num: 'IV', label: 'Oversight & Clearance' },
];

interface PhaseTrackerProps {
  engagement: Engagement;
}

export default function PhaseTracker({ engagement }: PhaseTrackerProps) {
  const phases = PHASE_LABELS.map((p, i) => ({
    ...p,
    status: i + 1 < parseInt(engagement.phase)
      ? 'complete' as const
      : i + 1 === parseInt(engagement.phase)
        ? 'active' as const
        : 'upcoming' as const,
  }));

  return (
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
  );
}
