'use client';

import {
  Activity,
  BriefcaseBusiness,
  Building2,
  CreditCard,
  FileSignature,
  Files,
  LayoutDashboard,
  Mail,
  PanelsTopLeft,
  Settings,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type Tab = 'overview' | 'clients' | 'engagements' | 'documents' | 'signatures' | 'messages' | 'invoices' | 'activity' | 'team' | 'content' | 'pages' | 'settings';

interface SidebarItem {
  id: Tab;
  label: string;
  icon: LucideIcon;
  section?: string;
}

const ITEMS: SidebarItem[] = [
  { id: 'overview',     label: 'Dashboard',     icon: LayoutDashboard, section: 'CRM' },
  { id: 'clients',      label: 'Clients',       icon: Building2 },
  { id: 'engagements',  label: 'Engagements',   icon: BriefcaseBusiness },
  { id: 'invoices',     label: 'Billing',       icon: CreditCard },
  { id: 'documents',    label: 'Documents',     icon: Files, section: 'OPERATIONS' },
  { id: 'signatures',   label: 'Signatures',    icon: FileSignature },
  { id: 'messages',     label: 'Messages',      icon: Mail },
  { id: 'activity',     label: 'Activity',      icon: Activity },
  { id: 'team',         label: 'Team',          icon: Users, section: 'WORKSPACE' },
  { id: 'pages',        label: 'Page Builder',  icon: PanelsTopLeft },
  { id: 'content',      label: 'Content',       icon: SlidersHorizontal },
  { id: 'settings',     label: 'Settings',      icon: Settings },
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
        <div className="admin-sidebar__workspace">
          <div className="admin-sidebar__workspace-mark">JR</div>
          <div>
            <div className="admin-sidebar__workspace-name">Private Office</div>
            <div className="admin-sidebar__workspace-type">CRM workspace</div>
          </div>
        </div>
        <div className="admin-sidebar__nav">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {item.section && (
                  <div className="admin-sidebar__section-label">{item.section}</div>
                )}
                <button
                  className={`admin-sidebar__item ${activeTab === item.id ? 'admin-sidebar__item--active' : ''}`}
                  onClick={() => onTabChange(item.id)}
                >
                  <span className="admin-sidebar__icon"><Icon size={16} strokeWidth={1.9} /></span>
                  <span>{item.label}</span>
                  {getBadge(item.id)}
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Mobile tab bar */}
      <div className="admin-mobile-tabs">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={activeTab === item.id ? 'active' : ''}
              onClick={() => onTabChange(item.id)}
              style={{ position: 'relative' }}
            >
              <span style={{ display: 'flex', justifyContent: 'center', marginBottom: 3 }}><Icon size={16} /></span>
              {item.label}
              {(mergedBadges[item.id as keyof BadgeCounts] || 0) > 0 && (
                <span className="admin-mobile-badge">
                  {mergedBadges[item.id as keyof BadgeCounts]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
