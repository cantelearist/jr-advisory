'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Office', href: '/portal/dashboard', icon: '◎' },
  { label: 'Documents', href: '/portal/documents', icon: '▤' },
  { label: 'Timeline', href: '/portal/timeline', icon: '◈' },
  { label: 'Messages', href: '/portal/messages', icon: '▣' },
];

export default function PortalNav() {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <nav className="portal-nav">
      {/* Top bar */}
      <div className="portal-nav__top">
        <Link href="/portal/dashboard" className="portal-nav__logo">
          <span className="portal-nav__logo-mark">JR</span>
          <span className="portal-nav__logo-text">YOUR OFFICE</span>
        </Link>
        
        <div className="portal-nav__links">
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`portal-nav__link ${pathname === item.href ? 'portal-nav__link--active' : ''}`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span className="portal-nav__link-icon">{item.icon}</span>
              <span className="portal-nav__link-label">{item.label}</span>
              <span 
                className="portal-nav__link-line"
                style={{
                  transform: pathname === item.href || hoveredIndex === i 
                    ? 'scaleX(1)' 
                    : 'scaleX(0)',
                }}
              />
            </Link>
          ))}
        </div>

        <div className="portal-nav__user">
          <span className="portal-nav__user-name">Mathis Residence</span>
          <div className="portal-nav__user-avatar">M</div>
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
        .portal-nav__logo {
          display: flex;
          align-items: center;
          gap: 16px;
          text-decoration: none;
        }
        .portal-nav__logo-mark {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px;
          font-weight: 300;
          color: #c9a96e;
          letter-spacing: 0.15em;
        }
        .portal-nav__logo-text {
          font-family: 'Archivo', 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.35);
          letter-spacing: 0.35em;
          text-transform: uppercase;
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
          font-family: 'Archivo', 'Inter', sans-serif;
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
        .portal-nav__user {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .portal-nav__user-name {
          font-family: 'Archivo', 'Inter', sans-serif;
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
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 16px;
          color: #c9a96e;
          background: rgba(201, 169, 110, 0.05);
        }
        @media (max-width: 768px) {
          .portal-nav__top { padding: 0 20px; height: 60px; }
          .portal-nav__links { gap: 20px; }
          .portal-nav__link-label { display: none; }
          .portal-nav__link-icon { font-size: 18px; }
          .portal-nav__user-name { display: none; }
          .portal-nav__logo-text { display: none; }
        }
      `}</style>
    </nav>
  );
}
