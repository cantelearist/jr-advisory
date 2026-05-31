'use client';

import type { Document as DBDocument, Message } from '@/lib/database.types';
import './dashboard.css';

interface StatsGridProps {
  documents: DBDocument[];
  messages: Message[];
  daysSince: number;
}

export default function StatsGrid({ documents, messages, daysSince }: StatsGridProps) {
  const unreadMsgs = messages.filter(m => !m.read).length;

  const stats = [
    { label: 'Documents', value: String(documents.length), sub: 'in vault', href: '/portal/documents' },
    { label: 'Messages', value: String(messages.length), sub: `unread: ${unreadMsgs}`, href: '/portal/messages' },
    { label: 'Days Active', value: String(Math.max(daysSince, 1)), sub: 'since engagement', href: '#' },
  ];

  const recentActivity = [
    ...documents.slice(0, 3).map(d => ({
      date: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      action: `Document: ${d.status === 'final' ? 'uploaded' : d.status === 'draft' ? 'draft saved' : 'pending review'}`,
      type: 'document' as const,
      detail: d.name,
    })),
    ...messages.slice(0, 2).map(m => ({
      date: new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      action: `Message from ${m.sender_name}`,
      type: 'message' as const,
      detail: m.subject,
    })),
  ].slice(0, 5);

  return (
    <div className="dash__grid">
      <section className="dash__stats" style={{ animationDelay: '0.6s' }}>
        {stats.map((stat, i) => (
          <a
            key={i}
            className="dash__stat"
            href={stat.href}
            style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
          >
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
          {recentActivity.length > 0 ? (
            recentActivity.map((item, i) => (
              <a
                key={i}
                className="dash__activity-item"
                href={item.type === 'document' ? '/portal/documents' : '/portal/messages'}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="dash__activity-dot" data-type={item.type} />
                <div className="dash__activity-content">
                  <span className="dash__activity-action">{item.action}</span>
                  <span className="dash__activity-detail">{item.detail}</span>
                </div>
                <span className="dash__activity-date">{item.date}</span>
              </a>
            ))
          ) : (
            <div className="portal-empty" style={{ padding: '40px 20px' }}>
              <p className="portal-empty__sub">No recent activity</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
