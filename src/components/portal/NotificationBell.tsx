'use client';

/* ── Notification Bell — in-app notification dropdown for PortalNav ── */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Notification } from '@/lib/database.types';

interface Props {
  target: string; /* 'firm' for admin, or client_id */
}

const TYPE_ICONS: Record<string, string> = {
  message: '✉',
  document: '▤',
  invoice: '▦',
  signature: '✍',
  phase: '◈',
  system: '⚙',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationBell({ target }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications/list?target=${encodeURIComponent(target)}&limit=15`);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch { /* silent */ }
  }, [target]);

  /* Poll every 30s */
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  /* Close on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const dismiss = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await fetch('/api/notifications/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id }),
      });
    } catch { /* silent */ }
  };

  const dismissAll = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await fetch('/api/notifications/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismiss_all: true, target }),
      });
    } catch { /* silent */ }
  };

  const handleNotifClick = (n: Notification) => {
    dismiss(n.id);
    if (n.link) {
      window.location.href = n.link;
    }
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 8px',
          position: 'relative',
          fontSize: 18,
          color: unreadCount > 0 ? '#c9a96e' : 'rgba(255,255,255,0.35)',
          transition: 'color 0.3s ease',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 2,
              minWidth: 16,
              height: 16,
              borderRadius: '50%',
              background: '#c9a96e',
              color: '#0a0a0a',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'JetBrains Mono', monospace",
              padding: '0 4px',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 340,
            maxHeight: 440,
            overflow: 'auto',
            background: 'rgba(16, 18, 24, 0.97)',
            border: '1px solid rgba(201, 169, 110, 0.12)',
            backdropFilter: 'blur(20px)',
            zIndex: 200,
            borderRadius: 8,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px 10px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={dismissAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c9a96e',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Items */}
          {notifications.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.25)',
                fontSize: 13,
              }}
            >
              No notifications
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotifClick(n)}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 16px',
                  cursor: n.link ? 'pointer' : 'default',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: n.read ? 'transparent' : 'rgba(201,169,110,0.04)',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,169,110,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(201,169,110,0.04)')}
              >
                <span style={{ fontSize: 14, opacity: 0.6, marginTop: 2 }}>
                  {TYPE_ICONS[n.type] || '●'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: n.read ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.85)',
                      fontWeight: n.read ? 400 : 500,
                      lineHeight: 1.4,
                    }}
                  >
                    {n.title}
                  </div>
                  {n.body && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.3)',
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {n.body}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.2)',
                      marginTop: 4,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {timeAgo(n.created_at)}
                  </div>
                </div>
                {!n.read && (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#c9a96e',
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
