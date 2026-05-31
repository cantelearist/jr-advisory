'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, Engagement, Invoice, Todo } from '@/lib/database.types';

const PHASE_LABELS: Record<string, string> = {
  '1': 'I — Consultation',
  '2': 'II — Assessment',
  '3': 'III — Scope & Vendor',
  '4': 'IV — Oversight',
};

const PRIO_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f59e0b',
  normal: '#60a5fa',
  low: 'rgba(255,255,255,0.25)',
};

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
  const [newClientId, setNewClientId] = useState('');
  const [newDue, setNewDue] = useState('');
  const [newVisible, setNewVisible] = useState(false);

  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalRevenue = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const paidRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
  const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + Number(i.amount), 0);
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  const urgentTodos = todos.filter(t => t.status !== 'done' && (t.priority === 'urgent' || t.priority === 'high'));
  const overdueTodos = todos.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date());
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const pendingTodos = todos.filter(t => t.status !== 'done');
  const alertCount = urgentTodos.length + overdueTodos.length + overdueInvoices.length;

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAddTodo(newTitle.trim(), newPriority, newClientId, newDue, newVisible);
    setNewTitle(''); setNewPriority('normal'); setNewClientId(''); setNewDue(''); setNewVisible(false);
  };

  return (
    <>
      {/* ── KPI Row ── */}
      <div className="admin-kpi-grid">
        {[
          { label: 'Active Clients', value: String(activeClients), color: 'var(--admin-green)' },
          { label: 'Total Billed', value: fmt(totalRevenue), color: 'var(--admin-text)' },
          { label: 'Collected', value: fmt(paidRevenue), color: 'var(--admin-green)' },
          { label: 'Outstanding', value: fmt(outstanding), color: outstanding > 0 ? 'var(--admin-accent)' : 'var(--admin-green)' },
        ].map((kpi, i) => (
          <div key={i} className="admin-kpi">
            <div className="admin-kpi__label">{kpi.label}</div>
            <div className="admin-kpi__value" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* ── Urgent Alert ── */}
      {alertCount > 0 && (
        <div className="admin-alert">
          <span className="admin-alert__icon">⚠</span>
          <div style={{ flex: 1 }}>
            <div className="admin-alert__title">
              {alertCount} ITEM{alertCount > 1 ? 'S' : ''} REQUIRING ATTENTION
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {urgentTodos.map(t => (
                <div key={t.id} className="admin-alert__item">
                  <span className="admin-badge" style={{
                    background: `${PRIO_COLORS[t.priority]}15`,
                    color: PRIO_COLORS[t.priority],
                    padding: '2px 8px',
                  }}>{t.priority.toUpperCase()}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{t.title}</span>
                  {t.client_id && (() => { const c = clients.find(cl => cl.id === t.client_id); return c ? <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>— {c.name}</span> : null; })()}
                </div>
              ))}
              {overdueTodos.filter(t => !urgentTodos.includes(t)).map(t => (
                <div key={t.id} className="admin-alert__item">
                  <span className="admin-badge admin-badge--overdue" style={{ padding: '2px 8px' }}>OVERDUE</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{t.title}</span>
                </div>
              ))}
              {overdueInvoices.map(inv => (
                <div key={inv.id} className="admin-alert__item">
                  <span className="admin-badge admin-badge--overdue" style={{ padding: '2px 8px' }}>OVERDUE INV</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{inv.invoice_number} — {fmt(Number(inv.amount))}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Pipeline ── */}
      <div className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">Pipeline</h2>
          <span className="admin-section__count">{engagements.length} ENGAGEMENTS</span>
        </div>
        <div className="admin-pipeline">
          {(['1', '2', '3', '4'] as const).map(phase => {
            const phaseEngs = engagements.filter(e => e.phase === phase);
            return (
              <div key={phase} className="admin-pipeline__column">
                <div className="admin-pipeline__column-header" style={{ borderBottom: '2px solid var(--admin-accent-dim)' }}>
                  <span className="admin-pipeline__column-label" style={{ color: 'var(--admin-accent)' }}>
                    PHASE {PHASE_LABELS[phase]}
                  </span>
                  <span className="admin-pipeline__column-count" style={{
                    background: 'rgba(201,169,110,0.12)',
                    color: 'var(--admin-accent)',
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
                          style={{ borderLeft: '3px solid var(--admin-accent-dim)' }}
                        >
                          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0, fontWeight: 500 }}>
                            {client?.name || 'Unknown'}
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '4px 0 0' }}>{eng.type}</p>
                          {eng.next_milestone && (
                            <p style={{ fontSize: 11, color: 'var(--admin-accent)', margin: '4px 0 0', opacity: 0.7 }}>
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

      {/* ── Quick Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div className="admin-kpi">
          <div className="admin-kpi__label">Outstanding</div>
          <div className="admin-kpi__value" style={{ fontSize: 24, color: outstanding > 0 ? 'var(--admin-accent)' : 'var(--admin-green)' }}>
            {fmt(outstanding)}
          </div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi__label">Active Engagements</div>
          <div className="admin-kpi__value" style={{ fontSize: 24 }}>{engagements.length}</div>
        </div>
      </div>

      {/* ── Todo List ── */}
      <div className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">To-Do List</h2>
          <span className="admin-section__count">
            {pendingTodos.length} OPEN · {todos.filter(t => t.status === 'done').length} DONE
          </span>
        </div>

        {/* Add form */}
        <div className="admin-card" style={{ marginBottom: 16 }}>
          <div className="admin-card__body" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '14px 18px' }}>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Add a task…"
              className="admin-input"
              style={{ flex: 1, minWidth: 200 }}
            />
            <select value={newPriority} onChange={e => setNewPriority(e.target.value)} className="admin-select">
              <option value="urgent">URGENT</option>
              <option value="high">HIGH</option>
              <option value="normal">NORMAL</option>
              <option value="low">LOW</option>
            </select>
            <select value={newClientId} onChange={e => setNewClientId(e.target.value)} className="admin-select" style={{ maxWidth: 160 }}>
              <option value="">NO CLIENT</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} className="admin-select" style={{ cursor: 'pointer' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: 'var(--admin-text-muted)' }}>
              <input type="checkbox" checked={newVisible} onChange={e => setNewVisible(e.target.checked)} />
              Client-visible
            </label>
            <button onClick={handleAdd} className="admin-btn admin-btn--primary">+ ADD</button>
          </div>
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {todos.length === 0 && <div className="admin-empty">No tasks yet. Add one above.</div>}
          {todos.map(todo => {
            const isDone = todo.status === 'done';
            const isOverdue = !isDone && todo.due_date && new Date(todo.due_date) < new Date();
            const client = clients.find(c => c.id === todo.client_id);
            return (
              <div
                key={todo.id}
                className={`admin-todo ${isDone ? 'admin-todo--done' : ''} ${isOverdue ? 'admin-todo--overdue' : ''}`}
                style={{ background: isDone ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.015)' }}
              >
                <button
                  className="admin-todo__check"
                  onClick={() => onToggleTodo(todo)}
                  style={{
                    background: isDone ? 'rgba(74,222,128,0.15)' : 'transparent',
                    border: `2px solid ${isDone ? 'var(--admin-green)' : PRIO_COLORS[todo.priority] || '#555'}`,
                    color: 'var(--admin-green)',
                  }}
                >
                  {isDone ? '✓' : ''}
                </button>
                <div>
                  <span style={{
                    fontSize: 14,
                    color: isDone ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}>
                    {todo.title}
                  </span>
                  <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9, letterSpacing: '0.08em', padding: '1px 6px', borderRadius: 3,
                      background: `${PRIO_COLORS[todo.priority]}15`, color: PRIO_COLORS[todo.priority],
                    }}>
                      {todo.priority.toUpperCase()}
                    </span>
                    {client && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{client.name}</span>}
                    {todo.due_date && (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: isOverdue ? 'var(--admin-red)' : 'rgba(255,255,255,0.2)' }}>
                        {isOverdue ? '⚠ ' : ''}Due {new Date(todo.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    {todo.visible_to_client && (
                      <span style={{ fontSize: 9, color: 'var(--admin-accent)', opacity: 0.6 }}>👁 client-visible</span>
                    )}
                  </div>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>
                  {new Date(todo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <button className="admin-todo__delete" onClick={() => onDeleteTodo(todo.id)}>✕</button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
