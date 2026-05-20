'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PortalNav from '@/components/portal/PortalNav';
// Test database integration ready — will wire in next iteration
// import { getDatabase, getClientMessages, saveDatabase } from '@/lib/testData';
// import type { Message as DBMessage } from '@/lib/testData';

const Scene3D = dynamic(() => import('@/components/portal/Scene3D'), { ssr: false });

const MESSAGES = [
  {
    id: 1,
    from: 'firm',
    sender: 'James Roman Advisory',
    date: 'May 15, 2026 · 3:42 PM',
    subject: 'Vendor Proposal Comparison — Ready for Review',
    body: `Good afternoon,

The scope comparison matrix is now in your document vault. Three qualified vendors have submitted proposals based on the remediation scope we developed from the Phase II findings.

Each proposal has been reviewed for completeness, assumption accuracy, and pricing transparency. The matrix highlights where each vendor aligns with the scope — and where they deviate.

We've scheduled the shortlist presentation for May 22. Before that call, we'd recommend reviewing the matrix and flagging any questions.

No immediate action required on your end. We'll walk through everything together.

— The Firm`,
    read: false,
  },
  {
    id: 2,
    from: 'client',
    sender: 'You',
    date: 'May 12, 2026 · 10:15 AM',
    subject: 'RE: Phase II Closeout',
    body: `Thank you for the thorough documentation. The closeout summary is clear. Ready to proceed to vendor evaluation when you are.`,
    read: true,
  },
  {
    id: 3,
    from: 'firm',
    sender: 'James Roman Advisory',
    date: 'May 3, 2026 · 5:18 PM',
    subject: 'Phase II Closeout — Assessment Complete',
    body: `The independent assessment phase is now complete. All documentation has been uploaded to your vault, including:

• IEP Assessment — Final Report
• Moisture Mapping Report (Zones A–C)
• Air Quality Sampling Results
• Phase II Closeout Summary

Key findings: Elevated moisture and confirmed microbial activity in three zones. The data supports a targeted remediation scope, which we'll develop in Phase III.

We'll begin vendor outreach this week. Expect 3–4 qualified proposals within 10 days.

— The Firm`,
    read: true,
  },
  {
    id: 4,
    from: 'firm',
    sender: 'James Roman Advisory',
    date: 'Apr 12, 2026 · 2:30 PM',
    subject: 'Air Quality Results Received',
    body: `Lab results from the April 5 sampling are in. Report uploaded to your vault under Lab Results.

Summary: Two of three zones show spore counts above baseline. This is consistent with the moisture findings and will inform the remediation scope.

We'll continue with the remaining site inspections as scheduled. No immediate action needed.

— The Firm`,
    read: true,
  },
  {
    id: 5,
    from: 'firm',
    sender: 'James Roman Advisory',
    date: 'Mar 21, 2026 · 11:00 AM',
    subject: 'Engagement Confirmed',
    body: `Welcome to your private office.

Your engagement has been formally accepted. The signed NDA and engagement letter are in your document vault. Your dedicated portal is now active — all communications, documents, and timeline updates will be accessible here.

Phase I is complete. We'll begin the independent assessment (Phase II) next week.

This channel is encrypted and confidential. Only authorized parties have access.

— The Firm`,
    read: true,
  },
];

export default function PortalMessages() {
  const [selectedId, setSelectedId] = useState<number>(1);
  const selected = MESSAGES.find(m => m.id === selectedId)!;

  return (
    <div className="msg">
      <Scene3D variant="minimal" />
      <PortalNav />
      <div className="msg__vignette" />

      <main className="msg__main">
        <section className="msg__hero">
          <span className="msg__label">SECURE MESSAGES</span>
          <h1 className="msg__title">Correspondence</h1>
          <p className="msg__sub">
            <span className="msg__encrypted">⬡ End-to-end encrypted</span> · {MESSAGES.length} messages
          </p>
        </section>

        <div className="msg__layout">
          {/* Thread list */}
          <div className="msg__list">
            {MESSAGES.map((msg) => (
              <button
                key={msg.id}
                className={`msg__thread ${selectedId === msg.id ? 'msg__thread--active' : ''} ${!msg.read ? 'msg__thread--unread' : ''}`}
                onClick={() => setSelectedId(msg.id)}
              >
                <div className="msg__thread-header">
                  <span className="msg__thread-sender">{msg.sender}</span>
                  <span className="msg__thread-date">{msg.date.split('·')[0]}</span>
                </div>
                <span className="msg__thread-subject">{msg.subject}</span>
                {!msg.read && <div className="msg__thread-dot" />}
              </button>
            ))}
          </div>

          {/* Message detail */}
          <div className="msg__detail">
            <div className="msg__detail-header">
              <div className="msg__detail-meta">
                <span className="msg__detail-sender">{selected.sender}</span>
                <span className="msg__detail-date">{selected.date}</span>
              </div>
              <h2 className="msg__detail-subject">{selected.subject}</h2>
            </div>
            <div className="msg__detail-body">
              {selected.body.split('\n').map((line, i) => (
                <p key={i} className={line.startsWith('•') ? 'msg__detail-bullet' : ''}>
                  {line || '\u00A0'}
                </p>
              ))}
            </div>

            {/* Reply box */}
            <div className="msg__reply">
              <textarea
                className="msg__reply-input"
                placeholder="Write a secure reply..."
                rows={3}
              />
              <div className="msg__reply-actions">
                <span className="msg__reply-encrypt">⬡ Encrypted</span>
                <button className="msg__reply-send">Send Reply →</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .msg {
          position: relative;
          min-height: 100vh;
          background: #000;
        }
        .msg__vignette {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at 50% 20%, transparent 20%, rgba(0,0,0,0.9) 100%);
          z-index: 1;
          pointer-events: none;
        }
        .msg__main {
          position: relative;
          z-index: 10;
          padding: 120px 60px 60px;
          max-width: 1300px;
          margin: 0 auto;
        }

        .msg__hero {
          margin-bottom: 40px;
          opacity: 0;
          animation: msgReveal 1s ease 0.2s forwards;
        }
        .msg__label {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          letter-spacing: 0.4em;
          color: rgba(201, 169, 110, 0.5);
        }
        .msg__title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(40px, 6vw, 72px);
          font-weight: 300;
          color: #fff;
          margin: 12px 0 16px;
          line-height: 1;
        }
        .msg__sub {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.1em;
        }
        .msg__encrypted { color: rgba(110, 201, 160, 0.5); }

        .msg__layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 0;
          border: 1px solid rgba(255,255,255,0.04);
          min-height: 600px;
          opacity: 0;
          animation: msgReveal 1s ease 0.4s forwards;
        }

        /* ── Thread list ── */
        .msg__list {
          border-right: 1px solid rgba(255,255,255,0.04);
          overflow-y: auto;
          max-height: 700px;
        }
        .msg__thread {
          display: block;
          width: 100%;
          text-align: left;
          padding: 20px 24px;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }
        .msg__thread:hover {
          background: rgba(255,255,255,0.02);
        }
        .msg__thread--active {
          background: rgba(201, 169, 110, 0.03);
          border-left: 2px solid #c9a96e;
        }
        .msg__thread-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .msg__thread-sender {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.05em;
        }
        .msg__thread--unread .msg__thread-sender { color: rgba(255,255,255,0.8); }
        .msg__thread-date {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          color: rgba(255,255,255,0.15);
        }
        .msg__thread-subject {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          line-height: 1.4;
          display: block;
        }
        .msg__thread--unread .msg__thread-subject { color: rgba(255,255,255,0.75); }
        .msg__thread-dot {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #c9a96e;
        }

        /* ── Detail ── */
        .msg__detail {
          display: flex;
          flex-direction: column;
          background: rgba(255,255,255,0.01);
        }
        .msg__detail-header {
          padding: 28px 32px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .msg__detail-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .msg__detail-sender {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .msg__detail-date {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: rgba(255,255,255,0.15);
        }
        .msg__detail-subject {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 22px;
          font-weight: 400;
          color: #fff;
          margin: 0;
          line-height: 1.3;
        }
        .msg__detail-body {
          flex: 1;
          padding: 28px 32px;
          overflow-y: auto;
        }
        .msg__detail-body p {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: rgba(255,255,255,0.55);
          line-height: 1.75;
          margin: 0 0 4px;
          letter-spacing: 0.01em;
        }
        .msg__detail-bullet {
          padding-left: 8px;
          color: rgba(255,255,255,0.45) !important;
        }

        /* ── Reply ── */
        .msg__reply {
          padding: 20px 32px 24px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .msg__reply-input {
          width: 100%;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 16px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #fff;
          resize: none;
          outline: none;
          transition: border-color 0.3s;
          box-sizing: border-box;
        }
        .msg__reply-input:focus {
          border-color: rgba(201, 169, 110, 0.3);
        }
        .msg__reply-input::placeholder { color: rgba(255,255,255,0.15); }
        .msg__reply-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
        }
        .msg__reply-encrypt {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          color: rgba(110, 201, 160, 0.4);
          letter-spacing: 0.1em;
        }
        .msg__reply-send {
          padding: 10px 24px;
          background: transparent;
          border: 1px solid rgba(201, 169, 110, 0.3);
          color: #c9a96e;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          letter-spacing: 0.15em;
          cursor: pointer;
          transition: all 0.4s ease;
        }
        .msg__reply-send:hover {
          background: rgba(201, 169, 110, 0.1);
          border-color: rgba(201, 169, 110, 0.5);
        }

        @keyframes msgReveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 900px) {
          .msg__main { padding: 100px 20px 40px; }
          .msg__layout {
            grid-template-columns: 1fr;
            max-height: none;
          }
          .msg__list {
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.04);
            max-height: 250px;
          }
        }
      `}</style>
    </div>
  );
}
