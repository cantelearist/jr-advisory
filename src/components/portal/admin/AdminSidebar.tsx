'use client';

export type Tab = 'overview' | 'clients' | 'engagements' | 'documents' | 'signatures' | 'messages' | 'invoices' | 'activity' | 'team' | 'content' | 'pages' | 'settings';

interface SidebarItem {
  id: Tab;
  label: string;
  icon: string;
  section?: string;
}

const ITEMS: SidebarItem[] = [
  { id: 'overview',     label: 'Overview',     icon: '◎', section: 'COMMAND' },
  { id: 'clients',      label: 'Clients',      icon: '◉' },
  { id: 'engagements',  label: 'Engagements',  icon: '◈' },
  { id: 'invoices',     label: 'Invoices',     icon: '▦' },
  { id: 'documents',    label: 'Documents',    icon: '▤', section: 'WORKSPACE' },
  { id: 'signatures',   label: 'Signatures',   icon: '✍' },
  { id: 'messages',     label: 'Messages',     icon: '✉' },
  { id: 'activity',     label: 'Activity',     icon: '▸' },
  { id: 'team',         label: 'Team',         icon: '⊡', section: 'SYSTEM' },
  { id: 'pages',        label: 'Page Builder', icon: '◧' },
  { id: 'content',      label: 'Content',      icon: '✎' },
  { id: 'settings',     label: 'Settings',     icon: '⚙' },
];

interface BadgeCounts {
  overview?: number;    // total alerts
  messages?: number;    // unread messages
  invoices?: number;    // overdue invoices
  documents?: number;   // pending-review docs
  signatures?: number;  // pending signatures
}

interface AdminSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  alertCount?: number;
  unreadMessages?: number;
  badges?: BadgeCounts;
}

export default function AdminSidebar({ activeTab, onTabChange, alertCount = 0, unreadMessages = 0, badges = {} }: AdminSidebarProps) {
  // Merge legacy props into badges
  const mergedBadges: BadgeCounts = {
    overview: badges.overview ?? alertCount,
    messages: badges.messages ?? unreadMessages,
    invoices: badges.invoices ?? 0,
    documents: badges.documents ?? 0,
  };

  const getBadge = (tab: Tab) => {
    const count = mergedBadges[tab as keyof BadgeCounts] || 0;
    if (count <= 0) return null;

    const isAlert = tab === 'overview' || tab === 'invoices';
    return (
      <span className={`admin-sidebar__badge ${isAlert ? 'admin-sidebar__badge--alert' : 'admin-sidebar__badge--count'}`}>
        {count}
      </span>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="admin-sidebar">
        {ITEMS.map((item) => (
          <div key={item.id}>
            {item.section && (
              <div className="admin-sidebar__section-label">{item.section}</div>
            )}
            <button
              className={`admin-sidebar__item ${activeTab === item.id ? 'admin-sidebar__item--active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <span className="admin-sidebar__icon">{item.icon}</span>
              <span>{item.label}</span>
              {getBadge(item.id)}
            </button>
          </div>
        ))}
      </aside>

      {/* Mobile tab bar */}
      <div className="admin-mobile-tabs">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            className={activeTab === item.id ? 'active' : ''}
            onClick={() => onTabChange(item.id)}
            style={{ position: 'relative' }}
          >
            <span style={{ display: 'block', fontSize: 16, marginBottom: 2 }}>{item.icon}</span>
            {item.label}
            {(mergedBadges[item.id as keyof BadgeCounts] || 0) > 0 && (
              <span className="admin-mobile-badge">
                {mergedBadges[item.id as keyof BadgeCounts]}
              </span>
            )}
          </button>
        ))}
      </div>
    </>
  );
}
