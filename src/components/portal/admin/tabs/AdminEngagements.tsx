'use client';

import { useRouter } from 'next/navigation';
import type { Client, Engagement, Invoice } from '@/lib/database.types';
import { updateEngagement } from '@/lib/data';

const PHASE_LABELS: Record<string, string> = {
  '1': 'I — Consultation',
  '2': 'II — Assessment',
  '3': 'III — Scope & Vendor',
  '4': 'IV — Oversight',
};

const PHASE_COLORS: Record<string, string> = {
  '1': '#579bfc',
  '2': '#00c875',
  '3': '#fdab3d',
  '4': '#a25ddc',
};

interface Props {
  clients: Client[];
  engagements: Engagement[];
  invoices: Invoice[];
  onNewEngagement: () => void;
  onOpenEngagement: (eng: Engagement) => void;
  onReload: () => void;
}

export default function AdminEngagements({ clients, engagements, invoices, onNewEngagement, onOpenEngagement, onReload }: Props) {
  const router = useRouter();
  const KANBAN_PHASES = ['1', '2', '3', '4'] as const;
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-header__eyebrow">ADMINISTRATION</div>
          <h1 className="admin-header__title">Engagement Pipeline</h1>
          <p className="admin-header__subtitle">{engagements.length} active engagements across {clients.length} clients</p>
        </div>
        <button onClick={onNewEngagement} className="admin-btn admin-btn--primary">+ New Engagement</button>
      </div>

      <div className="admin-pipeline">
        {KANBAN_PHASES.map(phase => {
          const phaseEngs = engagements.filter(e => e.phase === phase);
          const phaseColor = PHASE_COLORS[phase];
          return (
            <div
              key={phase}
              className="admin-pipeline__column"
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.background = 'rgba(201,169,110,0.04)'; }}
              onDragLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              onDrop={async e => {
                e.preventDefault();
                e.currentTarget.style.background = 'transparent';
                const engId = e.dataTransfer.getData('text/plain');
                const eng = engagements.find(en => en.id === engId);
                if (eng && eng.phase !== phase) {
                  await updateEngagement(eng.id, {
                    phase,
                    phase_label: PHASE_LABELS[phase].split(' — ')[1] || PHASE_LABELS[phase],
                  });
                  onReload();
                }
              }}
            >
              <div className="admin-pipeline__column-header" style={{ borderBottom: `2px solid ${phaseColor}` }}>
                <span className="admin-pipeline__column-label" style={{ color: phaseColor }}>
                  PHASE {PHASE_LABELS[phase]}
                </span>
                <span className="admin-pipeline__column-count" style={{
                  background: `${phaseColor}25`,
                  color: phaseColor,
                }}>{phaseEngs.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {phaseEngs.length === 0 ? (
                  <div className="admin-pipeline__empty">DROP HERE</div>
                ) : (
                  phaseEngs.map(eng => {
                    const client = clients.find(c => c.id === eng.client_id);
                    const engInvoices = invoices.filter(i => i.engagement_id === eng.id);
                    const totalBilled = engInvoices.reduce((s, i) => s + Number(i.amount), 0);
                    return (
                      <div
                        key={eng.id}
                        className="admin-pipeline__card"
                        style={{ borderLeft: `3px solid ${phaseColor}` }}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('text/plain', eng.id);
                          e.dataTransfer.effectAllowed = 'move';
                          (e.currentTarget as HTMLElement).style.opacity = '0.4';
                        }}
                        onDragEnd={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                        onClick={() => client ? router.push(`/portal/admin/clients/${client.id}`) : onOpenEngagement(eng)}
                      >
                        <p style={{ fontSize: 14, color: 'var(--admin-text)', margin: 0, fontWeight: 600 }}>
                          {client?.name || 'Unknown'}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '4px 0 0' }}>{eng.type}</p>
                        <p style={{ fontSize: 11, color: 'var(--admin-text-dim)', margin: '2px 0 0' }}>{eng.property}</p>
                        {eng.next_milestone && (
                          <p style={{ fontSize: 11, color: 'var(--admin-accent)', margin: '8px 0 0', opacity: 0.7, fontStyle: 'italic' }}>
                            ▸ {eng.next_milestone}
                          </p>
                        )}
                        {totalBilled > 0 && (
                          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--admin-text-muted)', margin: '6px 0 0', letterSpacing: '0.04em' }}>
                            {fmt(totalBilled)}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
