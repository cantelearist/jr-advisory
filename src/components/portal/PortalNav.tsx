"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getDatabase } from "@/lib/testData";

const NAV_ITEMS = [
  { label: "Office", href: "/portal/dashboard", icon: "◎" },
  { label: "Documents", href: "/portal/documents", icon: "▤" },
  { label: "Timeline", href: "/portal/timeline", icon: "◈" },
  { label: "Messages", href: "/portal/messages", icon: "▣" },
  { label: "Invoices", href: "/portal/invoices", icon: "▦" },
];

export default function PortalNav({ active }: { active?: string } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [clientName, setClientName] = useState("Client");
  const [clientInitial, setClientInitial] = useState("C");
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const db = getDatabase();
    const clientId =
      typeof window !== "undefined"
        ? localStorage.getItem("jr_active_client")
        : null;
    const client = db.clients.find((c) => c.id === clientId) || db.clients[0];
    if (client) {
      setClientName(client.name);
      setClientInitial(client.name.charAt(0));
    }
  }, []);

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("jr_active_client");
    }
    router.push("/portal");
  };

  return (
    <nav className="portal-nav">
      {/* Top bar */}
      <div className="portal-nav__top">
        <div className="portal-nav__brand">
          <Link href="/" className="portal-nav__home-link" title="Back to main site">
            <img
              src="/images/logo.png"
              alt="James Roman Advisory"
              className="portal-nav__logo-img"
            />
          </Link>
          <span className="portal-nav__brand-sep">|</span>
          <Link href="/portal/dashboard" className="portal-nav__portal-label">
            Client Office
          </Link>
        </div>

        <div className="portal-nav__links">
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`portal-nav__link ${
                pathname === item.href ? "portal-nav__link--active" : ""
              }`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span className="portal-nav__link-icon">{item.icon}</span>
              <span className="portal-nav__link-label">{item.label}</span>
              <span
                className="portal-nav__link-line"
                style={{
                  transform:
                    pathname === item.href || hoveredIndex === i
                      ? "scaleX(1)"
                      : "scaleX(0)",
                }}
              />
            </Link>
          ))}
        </div>

        <div className="portal-nav__user">
          <button
            className="portal-nav__user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <span className="portal-nav__user-name">{clientName}</span>
            <div className="portal-nav__user-avatar">{clientInitial}</div>
          </button>

          {/* User dropdown */}
          {showUserMenu && (
            <div className="portal-nav__dropdown">
              <div className="portal-nav__dropdown-name">{clientName}</div>
              <div className="portal-nav__dropdown-divider" />
              <Link
                href="/portal/dashboard"
                className="portal-nav__dropdown-item"
                onClick={() => setShowUserMenu(false)}
              >
                ◎ Dashboard
              </Link>
              <Link
                href="/portal/invoices"
                className="portal-nav__dropdown-item"
                onClick={() => setShowUserMenu(false)}
              >
                ▦ Invoices
              </Link>
              <Link
                href="/portal/admin"
                className="portal-nav__dropdown-item"
                onClick={() => setShowUserMenu(false)}
              >
                ⚙ Admin Panel
              </Link>
              <Link
                href="/"
                className="portal-nav__dropdown-item"
                onClick={() => setShowUserMenu(false)}
              >
                ← Main Site
              </Link>
              <div className="portal-nav__dropdown-divider" />
              <button
                className="portal-nav__dropdown-item portal-nav__dropdown-signout"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .portal-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(0, 0, 0, 0.7);
          border-bottom: 1px solid rgba(201, 169, 110, 0.08);
        }
        .portal-nav__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          height: 72px;
          max-width: 1600px;
          margin: 0 auto;
        }

        /* Brand group: logo + separator + portal label */
        .portal-nav__brand {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .portal-nav__brand-sep {
          color: rgba(201, 169, 110, 0.2);
          font-size: 20px;
          font-weight: 200;
          user-select: none;
        }
        .portal-nav__portal-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.35);
          text-decoration: none;
          transition: color 0.3s ease;
        }
        .portal-nav__portal-label:hover {
          color: rgba(255, 255, 255, 0.6);
        }
        /* Logo - matches main site */
        .portal-nav__home-link {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: inherit;
          transition: opacity 0.3s ease;
        }
        .portal-nav__home-link:hover {
          opacity: 0.85;
        }
        .portal-nav__logo-img {
          height: 34px;
          width: auto;
          object-fit: contain;
        }

        .portal-nav__links {
          display: flex;
          gap: 40px;
          align-items: center;
        }
        .portal-nav__link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          padding: 8px 0;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .portal-nav__link-icon {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.25);
          transition: color 0.4s ease;
        }
        .portal-nav__link-label {
          font-family: "Inter", sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: color 0.4s ease;
        }
        .portal-nav__link:hover .portal-nav__link-label,
        .portal-nav__link--active .portal-nav__link-label {
          color: rgba(255, 255, 255, 0.95);
        }
        .portal-nav__link:hover .portal-nav__link-icon,
        .portal-nav__link--active .portal-nav__link-icon {
          color: #c9a96e;
        }
        .portal-nav__link-line {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: #c9a96e;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: left;
        }

        /* User section */
        .portal-nav__user {
          position: relative;
        }
        .portal-nav__user-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          transition: opacity 0.3s ease;
        }
        .portal-nav__user-btn:hover {
          opacity: 0.85;
        }
        .portal-nav__user-name {
          font-family: "Inter", sans-serif;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.08em;
        }
        .portal-nav__user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(201, 169, 110, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 16px;
          color: #c9a96e;
          background: rgba(201, 169, 110, 0.05);
        }

        /* Dropdown */
        .portal-nav__dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 200px;
          background: rgba(16, 18, 24, 0.95);
          border: 1px solid rgba(201, 169, 110, 0.12);
          backdrop-filter: blur(20px);
          padding: 8px 0;
          z-index: 200;
        }
        .portal-nav__dropdown-name {
          padding: 12px 16px 8px;
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.8);
        }
        .portal-nav__dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin: 6px 0;
        }
        .portal-nav__dropdown-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px 16px;
          font-family: "Inter", sans-serif;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.05em;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .portal-nav__dropdown-item:hover {
          background: rgba(201, 169, 110, 0.06);
          color: rgba(255, 255, 255, 0.8);
        }
        .portal-nav__dropdown-signout {
          color: rgba(201, 169, 110, 0.6);
        }
        .portal-nav__dropdown-signout:hover {
          color: #c9a96e;
          background: rgba(201, 169, 110, 0.08);
        }

        @media (max-width: 768px) {
          .portal-nav__top {
            padding: 0 20px;
            height: 60px;
          }
          .portal-nav__links {
            gap: 20px;
          }
          .portal-nav__link-label {
            display: none;
          }
          .portal-nav__link-icon {
            font-size: 18px;
          }
          .portal-nav__user-name {
            display: none;
          }
          .portal-nav__logo-text-wrap {
            display: none;
          }
          .portal-nav__brand-sep {
            display: none;
          }
          .portal-nav__portal-label {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}
