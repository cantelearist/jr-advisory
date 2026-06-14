'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, Engagement, Invoice, Todo } from '@/lib/database.types';

/* ── Romer-style phase colors ── */
const PHASE_COLORS: Record<string, string> = {
  '1': '#bec2ff',   // consultation — indigo-light
  '2': '#50d8e9',   // assessment — cyan
  '3': '#ffb689',   // scope & vendor — amber
  '4': '#c9a96e',   // oversight — gold
};
const PHASE_LABELS: Record<string, string> = {
  '1': 'Consultation',
  '2': 'Assessment',
  '3': 'Scope & Vendor',
  '4': 'Oversight',
};

/* ── Mini sparkline bar generator ── */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="romer-kpi__bars">
      {values.map((v, i) => (
        <div
          key={i}
          className="romer-kpi__bar"
          style={{
            height: `${Math.max((v / max) * 100, 8)}%`,
            background: `${color}${i === values.length - 1 ? '' : '60'}`,
          }}
        />
      ))}
    </div>
  );
}

/* ── SVG Revenue Chart ── */
function RevenueChart({ invoices }: { invoices: Invoice[] }) {
  // Group invoices by month for last 6 months
  const months = useMemo(() => {
    const now = new Date();
    const labels: string[] = [];
    const billed: number[] = [];
    const collected: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      labels.push(label);

      const monthInvoices = invoices.filter(inv => {
        const created = new Date(inv.created_at);
        return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth();
      });

      billed.push(monthInvoices.reduce((s, inv) => s + Number(inv.amount), 0));
      collected.push(
        monthInvoices.filter(inv => inv.status === 'paid').reduce((s, inv) => s + Number(inv.amount), 0)
      );
    }

    return { labels, billed, collected };
  }, [invoices]);

  const maxVal = Math.max(...months.billed, ...months.collected, 1);
  const w = 600;
  const h = 150;
  const padX = 40;
  const padY = 20;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  const toPath = (data: number[]) => {
    return data
      .map((v, i) => {
        const x = padX + (i / (data.length - 1)) * chartW;
        const y = padY + chartH - (v / maxVal) * chartH;
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  };

  const toArea = (data: number[]) => {
    const pts = data.map((v, i) => {
      const x = padX + (i / (data.length - 1)) * chartW;
      const y = padY + chartH - (v / maxVal) * chartH;
      return `${x},${y}`;
    });
    return `M${pts.join(' L')} L${padX + chartW},${padY + chartH} L${padX},${padY + chartH} Z`;
  };

  return (
    <div className="romer-chart">
      <div className="romer-chart__header">
        <span className="romer-chart__title">Revenue Signal</span>
        <div className="romer-chart__legend">
          <span>
            <span className="romer-chart__legend-dot" style={{ background: '#bec2ff' }} />
            Billed
          </span>
          <span>
            <span className="romer-chart__legend-dot" style={{ background: '#50d8e9' }} />
            Collected
          </span>
        </div>
      </div>
      <div className="romer-chart__canvas">
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((frac, i) => (
            <line
              key={i}
              x1={padX}
              y1={padY + chartH - frac * chartH}
              x2={padX + chartW}
              y2={padY + chartH - frac * chartH}
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="2 4"
            />
          ))}
          {/* Area fills */}
          <path d={toArea(months.billed)} fill="rgba(190,194,255,0.06)" />
          <path d={toArea(months.collected)} fill="rgba(80,216,233,0.06)" />
          {/* Lines */}
          <path d={toPath(months.billed)} fill="none" stroke="#bec2ff" strokeWidth="2" />
          <path d={toPath(months.collected)} fill="none" stroke="#50d8e9" strokeWidth="2" />
          {/* Data points */}
          {months.billed.map((v, i) => {
            const x = padX + (i / (months.billed.length - 1)) * chartW;
            const y = padY + chartH - (v / maxVal) * chartH;
            return <circle key={`b${i}`} cx={x} cy={y} r="3" fill="#bec2ff" />;
          })}
          {months.collected.map((v, i) => {
            const x = padX + (i / (months.collected.length - 1)) * chartW;
            const y = padY + chartH - (v / maxVal) * chartH;
            return <circle key={`c${i}`} cx={x} cy={y} r="3" fill="#50d8e9" />;
          })}
          {/* X axis labels */}
          {months.labels.map((label, i) => {
            const x = padX + (i / (months.labels.length - 1)) * chartW;
            return (
              <text
                key={i}
                x={x}
                y={h - 2}
                textAnchor="middle"
                fill="rgba(255,255,255,0.25)"
                fontSize="9"
                fontFamily="'JetBrains Mono', monospace"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ── Props ── */
interface Props {
  clients: Client[];
  engagements: Engagement[];
  invoices: Invoice[];
  todos: Todo[];
  onAddTodo: (title: string, priority: string, clientId: string, due: string, visible: boolean) => void;
  onToggleTodo: (todo: Todo) => void;
  onDeleteTodo: (id: string) => void;
  onOpenEngagement: (eng: Engagement) => void;
}

export default function AdminOverview({
  clients, engagements, invoices, todos,
  onAddTodo, onToggleTodo, onDeleteTodo, onOpenEngagement,
}: Props) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<string>('normal');
  const [lastSyncTime, setLastSyncTime] = useState('');

  useEffect(() => {
    const updateLastSyncTime = () => {
      setLastSyncTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };

    updateLastSyncTime();
    const interval = window.setInterval(updateLastSyncTime, 60000);
    return () => window.clearInterval(interval);
  }, []);

  // ── KPI Data ──
  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalRevenue = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const paidRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
  const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + Number(i.amount), 0);
  const activeEngagements = engagements.length;
  const pendingTodos = todos.filter(t => t.status !== 'done').length;

  const fmt = (n: number) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0,
  }).format(n);

  // Sparkline values (mock distribution based on real data)
  const clientSpark = [3, 4, 3, 5, 5, activeClients].slice(-7);
  const revSpark = [8, 12, 6, 15, 10, Math.round(totalRevenue / 10000)].slice(-7);
  const engSpark = [2, 3, 4, 3, 5, activeEngagements].slice(-7);

  // ── Focus queue — urgent + overdue todos ──
  const urgentTodos = todos
    .filter(t => t.status !== 'done')
    .sort((a, b) => {
      const prio: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
      return (prio[a.priority] ?? 2) - (prio[b.priority] ?? 2);
    })
    .slice(0, 5);

  const tagClass = (priority: string) => {
    if (priority === 'urgent') return 'romer-queue-tag--urgent';
    if (priority === 'high') return 'romer-queue-tag--active';
    if (priority === 'normal') return 'romer-queue-tag--today';
    return 'romer-queue-tag--normal';
  };

  const tagLabel = (t: Todo) => {
    if (t.priority === 'urgent') return 'URGENT';
    if (t.priority === 'high') return 'HIGH';
    if (t.due_date && new Date(t.due_date) <= new Date()) return 'OVERDUE';
    if (t.due_date) {
      const d = new Date(t.due_date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    }
    return 'OPEN';
  };

  // ── Pipeline data ──
  const phases = (['1', '2', '3', '4'] as const).map(p => ({
    phase: p,
    label: PHASE_LABELS[p],
    count: engagements.filter(e => e.phase === p).length,
    color: PHASE_COLORS[p],
  }));
  const totalPhases = Math.max(engagements.length, 1);

  // ── Recent activity ──
  const recentActivity = useMemo(() => {
    const items: { title: string; time: string; color: string }[] = [];
    // Use invoices + engagements as proxy for recent activity
    invoices
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .forEach(inv => {
        items.push({
          title: `Invoice ${inv.invoice_number} — ${fmt(Number(inv.amount))}`,
          time: new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          color: inv.status === 'paid' ? '#4ade80' : inv.status === 'overdue' ? '#ef4444' : '#bec2ff',
        });
      });
    engagements
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .forEach(eng => {
        const client = clients.find(c => c.id === eng.client_id);
        items.push({
          title: `${client?.name || 'Client'} — Phase ${eng.phase}`,
          time: new Date(eng.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          color: PHASE_COLORS[eng.phase] || '#bec2ff',
        });
      });
    return items.slice(0, 5);
  }, [invoices, engagements, clients]);

  // ── Quick Add ──
  const handleQuickAdd = () => {
    if (!newTitle.trim()) return;
    onAddTodo(newTitle.trim(), newPriority, '', '', false);
    setNewTitle('');
    setNewPriority('normal');
  };

  // Suppress unused warnings for required props
  void onToggleTodo;
  void onDeleteTodo;
  void onOpenEngagement;

  return (
    <>
      {/* ── Status Bar ── */}
      <div className="romer-status-bar">
        <div className="romer-status-bar__live">
          <span className="romer-status-bar__dot" />
          <span className="romer-status-bar__label">System Active</span>
        </div>
        <span className="romer-status-bar__time">
          Last sync: <span data-testid="admin-last-sync-time">{lastSyncTime || '--:--'}</span>
        </span>
      </div>

      {/* ── KPI Grid (3x2) ── */}
      <div className="romer-kpi-grid">
        <div className="romer-kpi">
          <div className="romer-kpi__label">Active Clients</div>
          <div className="romer-kpi__value">{activeClients}</div>
          <div className="romer-kpi__delta romer-kpi__delta--positive">
            <span>{clients.length} total</span>
            <Sparkline values={clientSpark} color="#50d8e9" />
          </div>
        </div>

        <div className="romer-kpi">
          <div className="romer-kpi__label">Total Billed</div>
          <div className="romer-kpi__value">{fmt(totalRevenue)}</div>
          <div className="romer-kpi__delta romer-kpi__delta--neutral">
            <span>{invoices.length} invoices</span>
            <Sparkline values={revSpark} color="#bec2ff" />
          </div>
        </div>

        <div className="romer-kpi">
          <div className="romer-kpi__label">Collected</div>
          <div className="romer-kpi__value">{fmt(paidRevenue)}</div>
          <div className="romer-kpi__delta romer-kpi__delta--success">
            <span>{totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0}% rate</span>
            <Sparkline values={[4, 6, 8, 5, 9, Math.round(paidRevenue / 10000)]} color="#4ade80" />
          </div>
        </div>

        <div className="romer-kpi">
          <div className="romer-kpi__label">Outstanding</div>
          <div className="romer-kpi__value" style={{ color: outstanding > 0 ? '#ffb689' : '#4ade80' }}>{fmt(outstanding)}</div>
          <div className={`romer-kpi__delta ${outstanding > 0 ? 'romer-kpi__delta--warning' : 'romer-kpi__delta--success'}`}>
            <span>{invoices.filter(i => i.status === 'overdue').length} overdue</span>
          </div>
        </div>

        <div className="romer-kpi">
          <div className="romer-kpi__label">Engagements</div>
          <div className="romer-kpi__value">{activeEngagements}</div>
          <div className="romer-kpi__delta romer-kpi__delta--neutral">
            <span>{phases.map(p => `P${p.phase}: ${p.count}`).join(' · ')}</span>
            <Sparkline values={engSpark} color="#c9a96e" />
          </div>
        </div>

        <div className="romer-kpi">
          <div className="romer-kpi__label">Open Tasks</div>
          <div className="romer-kpi__value">{pendingTodos}</div>
          <div className="romer-kpi__delta romer-kpi__delta--neutral">
            <span>{todos.filter(t => t.status === 'done').length} completed</span>
            <Sparkline values={[2, 3, 5, 4, 6, pendingTodos]} color="#c9a96e" />
          </div>
        </div>
      </div>

      {/* ── Revenue Signal Chart ── */}
      <RevenueChart invoices={invoices} />

      {/* ── Duo Grid: Focus Queue + Pipeline ── */}
      <div className="romer-duo-grid">
        {/* Focus Queue */}
        <div className="romer-panel">
          <div className="romer-panel__title">Focus Queue</div>
          <div>
            {urgentTodos.length === 0 ? (
              <div className="admin-empty" style={{ padding: '24px 0' }}>All clear — no urgent items.</div>
            ) : (
              urgentTodos.map(t => {
                const client = clients.find(c => c.id === t.client_id);
                return (
                  <div key={t.id} className="romer-queue-item">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{t.title}</span>
                      {client && (
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {client.name}
                        </span>
                      )}
                    </div>
                    <span className={`romer-queue-tag ${tagClass(t.priority)}`}>
                      {tagLabel(t)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick add */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14, marginTop: 10, display: 'flex', gap: 8 }}>
            <input
              className="admin-input"
              style={{ flex: 1, padding: '8px 12px', fontSize: 12 }}
              placeholder="Add a task…"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
            />
            <select
              className="admin-select"
              style={{ padding: '8px 10px', fontSize: 10, minWidth: 80 }}
              value={newPriority}
              onChange={e => setNewPriority(e.target.value)}
            >
              <option value="urgent">URGENT</option>
              <option value="high">HIGH</option>
              <option value="normal">NORMAL</option>
              <option value="low">LOW</option>
            </select>
            <button className="admin-btn admin-btn--primary admin-btn--sm" onClick={handleQuickAdd}>+</button>
          </div>
        </div>

        {/* Engagement Pipeline */}
        <div className="romer-panel">
          <div className="romer-panel__title">Engagement Pipeline</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 4 }}>
            {phases.map(p => (
              <div key={p.phase} className="romer-progress">
                <div className="romer-progress__track">
                  <div
                    className="romer-progress__fill"
                    style={{
                      width: `${(p.count / totalPhases) * 100}%`,
                      background: p.color,
                    }}
                  />
                </div>
                <div className="romer-progress__meta">
                  <span>Phase {p.phase} — {p.label}</span>
                  <span className="romer-progress__count" style={{ color: p.color }}>
                    {p.count}/{engagements.length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Activity Feed ── */}
      <div className="romer-activity">
        <div className="romer-panel__title">Recent Activity</div>
        {recentActivity.map((item, i) => (
          <div key={i} className="romer-activity__item">
            <span className="romer-activity__dot" style={{ background: item.color }} />
            <div>
              <div className="romer-activity__title">{item.title}</div>
              <div className="romer-activity__time">{item.time}</div>
            </div>
          </div>
        ))}
        {recentActivity.length === 0 && (
          <div className="admin-empty" style={{ padding: '20px 0' }}>No recent activity.</div>
        )}
      </div>

      {/* ── Pipeline Cards (Kanban-style, below fold) ── */}
      <div className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 520, letterSpacing: '-0.02em' }}>
            Pipeline Detail
          </h2>
          <span className="admin-section__count">{engagements.length} ENGAGEMENTS</span>
        </div>
        <div className="admin-pipeline">
          {(['1', '2', '3', '4'] as const).map(phase => {
            const phaseEngs = engagements.filter(e => e.phase === phase);
            return (
              <div key={phase} className="admin-pipeline__column">
                <div className="admin-pipeline__column-header" style={{ borderBottom: `2px solid ${PHASE_COLORS[phase]}40` }}>
                  <span className="admin-pipeline__column-label" style={{ color: PHASE_COLORS[phase] }}>
                    PHASE {phase} — {PHASE_LABELS[phase]}
                  </span>
                  <span className="admin-pipeline__column-count" style={{
                    background: `${PHASE_COLORS[phase]}15`,
                    color: PHASE_COLORS[phase],
                  }}>{phaseEngs.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {phaseEngs.length === 0 ? (
                    <div className="admin-pipeline__empty">NO ENGAGEMENTS</div>
                  ) : (
                    phaseEngs.map(eng => {
                      const client = clients.find(c => c.id === eng.client_id);
                      return (
                        <div
                          key={eng.id}
                          className="admin-pipeline__card"
                          onClick={() => client ? router.push(`/portal/admin/clients/${client.id}`) : onOpenEngagement(eng)}
                          style={{ borderLeft: `3px solid ${PHASE_COLORS[phase]}60` }}
                        >
                          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0, fontWeight: 500 }}>
                            {client?.name || 'Unknown'}
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '4px 0 0' }}>{eng.type}</p>
                          {eng.next_milestone && (
                            <p style={{ fontSize: 11, color: PHASE_COLORS[phase], margin: '4px 0 0', opacity: 0.7 }}>
                              {eng.next_milestone}
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
      </div>
    </>
  );
}
