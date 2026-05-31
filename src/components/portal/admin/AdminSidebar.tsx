'use client';

export type Tab = 'overview' | 'clients' | 'engagements' | 'documents' | 'messages' | 'invoices' | 'activity' | 'content' | 'settings';

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
  { id: 'messages',     label: 'Messages',     icon: '✉' },
  { id: 'activity',     label: 'Activity',     icon: '▸' },
  { id: 'content',      label: 'Content',      icon: '✎', section: 'SYSTEM' },
  { id: 'settings',     label: 'Settings',     icon: '⚙' },
];

interface AdminSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  alertCount?: number;
  unreadMessages?: number;
}

export default function AdminSidebar({ activeTab, onTabChange, alertCount = 0, unreadMessages = 0 }: AdminSidebarProps) {
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
              {item.id === 'overview' && alertCount > 0 && (
                <span className="admin-sidebar__badge admin-sidebar__badge--alert">{alertCount}</span>
              )}
              {item.id === 'messages' && unreadMessages > 0 && (
                <span className="admin-sidebar__badge admin-sidebar__badge--count">{unreadMessages}</span>
              )}
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
          >
            <span style={{ display: 'block', fontSize: 16, marginBottom: 2 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
