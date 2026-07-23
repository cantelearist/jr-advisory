'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PortalNav from '@/components/portal/PortalNav';
import { useAuth } from '@/components/portal/AuthProvider';
import { fetchPortalData, type PortalData } from '@/lib/portal-data';

const TOUR_STEPS = [
  {
    icon: '◎',
    title: 'Your Dashboard',
    desc: 'A real-time overview of your engagement — current phase, upcoming milestones, and recent activity.',
    href: '/portal/dashboard',
  },
  {
    icon: '▤',
    title: 'Document Vault',
    desc: 'Every NDA, lab result, proposal, and clearance letter — organized, searchable, and always available.',
    href: '/portal/documents',
  },
  {
    icon: '◈',
    title: 'Engagement Timeline',
    desc: 'Follow your project journey from initial consultation through final clearance, phase by phase.',
    href: '/portal/timeline',
  },
  {
    icon: '▣',
    title: 'Secure Messages',
    desc: 'Private, encrypted communication with your advisory team. No email, no exposure.',
    href: '/portal/messages',
  },
  {
    icon: '▦',
    title: 'Invoices & Payments',
    desc: 'View billing history, outstanding balances, and make secure payments — all in one place.',
    href: '/portal/invoices',
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const { user, profile, supabase } = useAuth();
  const [step, setStep] = useState(0); // 0=welcome, 1-5=tour, 6=ready
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completionError, setCompletionError] = useState('');

  useEffect(() => {
    fetchPortalData().then(setPortalData);
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  const clientName = portalData?.client?.name || profile?.full_name || user?.user_metadata?.full_name || 'there';
  const firstName = clientName.split(' ')[0];
  const engagementType = portalData?.engagement?.type || 'your engagement';

  const handleNext = () => {
    if (step < TOUR_STEPS.length + 1) {
      setStep(step + 1);
    }
  };

  const completeOnboarding = async () => {
    if (completing) return;

    setCompleting(true);
    setCompletionError('');

    const { error } = await supabase.auth.updateUser({
      data: { onboarded: true },
    });

    if (error) {
      setCompletionError('We could not save your progress. Please try again.');
      setCompleting(false);
      return;
    }

    router.replace('/portal/dashboard');
  };

  return (
    <div className="welcome">
      <PortalNav />
      <div className="welcome__bg" />

      <main className={`welcome__main ${fadeIn ? 'welcome__main--visible' : ''}`}>
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="welcome__step welcome__step--hero">
            <div className="welcome__badge">WELCOME TO YOUR CLIENT OFFICE</div>
            <h1 className="welcome__title">
              <span className="welcome__line1">Welcome,</span>
              <span className="welcome__line2">{firstName}.</span>
            </h1>
            <p className="welcome__subtitle">
              Your private portal for <span className="welcome__gold">{engagementType}</span> is ready.
              Everything you need — documents, timeline, messaging, and billing — in one secure place.
            </p>
            <div className="welcome__actions">
              <button className="welcome__btn welcome__btn--primary" onClick={handleNext}>
                Take a Quick Tour
              </button>
              <button
                className="welcome__btn welcome__btn--ghost"
                onClick={completeOnboarding}
                disabled={completing}
              >
                {completing ? 'Preparing your office…' : 'Skip to Dashboard →'}
              </button>
            </div>
          </div>
        )}

        {/* Steps 1-5: Tour */}
        {step >= 1 && step <= TOUR_STEPS.length && (() => {
          const s = TOUR_STEPS[step - 1];
          return (
            <div className="welcome__step welcome__step--tour" key={step}>
              <div className="welcome__tour-progress">
                {TOUR_STEPS.map((_, i) => (
                  <div key={i} className={`welcome__progress-dot ${i < step ? 'welcome__progress-dot--done' : ''} ${i + 1 === step ? 'welcome__progress-dot--active' : ''}`} />
                ))}
              </div>
              <div className="welcome__tour-icon">{s.icon}</div>
              <h2 className="welcome__tour-title">{s.title}</h2>
              <p className="welcome__tour-desc">{s.desc}</p>
              <div className="welcome__actions">
                <button className="welcome__btn welcome__btn--primary" onClick={handleNext}>
                  {step < TOUR_STEPS.length ? 'Next' : 'Get Started'}
                </button>
                <button
                  className="welcome__btn welcome__btn--ghost"
                  onClick={completeOnboarding}
                  disabled={completing}
                >
                  {completing ? 'Preparing…' : 'Skip →'}
                </button>
              </div>
              <span className="welcome__step-count">{step} of {TOUR_STEPS.length}</span>
            </div>
          );
        })()}

        {/* Step 6: Ready */}
        {step > TOUR_STEPS.length && (
          <div className="welcome__step welcome__step--ready">
            <div className="welcome__ready-icon">✓</div>
            <h2 className="welcome__ready-title">You&#39;re all set.</h2>
            <p className="welcome__ready-desc">
              Your Client Office is ready. If you ever need anything,
              use the Messages tab to reach your advisory team directly.
            </p>
            <button
              className="welcome__btn welcome__btn--primary"
              onClick={completeOnboarding}
              disabled={completing}
            >
              {completing ? 'Preparing Your Office…' : 'Enter Your Dashboard'}
            </button>
          </div>
        )}
        {completionError && (
          <p className="welcome__error" role="alert">{completionError}</p>
        )}
      </main>

      <style jsx>{`
        .welcome {
          position: relative; min-height: 100vh; background: #000;
          display: flex; align-items: center; justify-content: center;
        }
        .welcome__bg {
          position: fixed; inset: 0; z-index: 0;
          background: radial-gradient(ellipse at 50% 30%, rgba(201,169,110,0.04) 0%, transparent 60%),
                      radial-gradient(circle at 20% 80%, rgba(201,169,110,0.02) 0%, transparent 40%);
        }
        .welcome__main {
          position: relative; z-index: 10;
          max-width: 640px; width: 100%; padding: 120px 40px 60px;
          text-align: center;
          opacity: 0; transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .welcome__main--visible { opacity: 1; transform: translateY(0); }
        .welcome__step {
          animation: welcomeFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .welcome__badge {
          font-family: 'Inter', sans-serif; font-size: 9px; letter-spacing: 0.4em;
          color: rgba(201,169,110,0.6); margin-bottom: 40px;
        }
        .welcome__title { margin: 0 0 32px; line-height: 1; }
        .welcome__line1 {
          display: block; font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(28px, 4vw, 42px); font-weight: 300;
          color: rgba(255,255,255,0.5);
        }
        .welcome__line2 {
          display: block; font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(48px, 7vw, 80px); font-weight: 300;
          color: #fff; margin-top: 8px;
        }
        .welcome__subtitle {
          font-family: 'Inter', sans-serif; font-size: 15px; line-height: 1.7;
          color: rgba(255,255,255,0.4); max-width: 480px; margin: 0 auto 48px;
          letter-spacing: 0.02em;
        }
        .welcome__gold { color: #c9a96e; }
        .welcome__actions { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .welcome__btn {
          font-family: 'Inter', sans-serif; font-size: 12px; letter-spacing: 0.15em;
          text-transform: uppercase; cursor: pointer; transition: all 0.4s ease;
          border: none; background: none;
        }
        .welcome__btn:disabled { cursor: wait; opacity: 0.55; }
        .welcome__btn--primary {
          padding: 16px 48px; background: rgba(201,169,110,0.1);
          border: 1px solid rgba(201,169,110,0.3); color: #c9a96e;
        }
        .welcome__btn--primary:hover {
          background: rgba(201,169,110,0.15); border-color: rgba(201,169,110,0.5);
        }
        .welcome__btn--ghost { color: rgba(255,255,255,0.25); padding: 8px; font-size: 11px; }
        .welcome__btn--ghost:hover { color: rgba(255,255,255,0.5); }
        .welcome__error {
          margin: 24px auto 0; color: #d9a0a0; font-family: 'Inter', sans-serif;
          font-size: 12px; letter-spacing: 0.04em;
        }
        .welcome__tour-progress {
          display: flex; gap: 8px; justify-content: center; margin-bottom: 48px;
        }
        .welcome__progress-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(255,255,255,0.08); transition: all 0.4s ease;
        }
        .welcome__progress-dot--done { background: rgba(201,169,110,0.4); }
        .welcome__progress-dot--active { background: #c9a96e; transform: scale(1.3); }
        .welcome__tour-icon {
          font-size: 48px; color: #c9a96e; margin-bottom: 24px;
          filter: drop-shadow(0 0 20px rgba(201,169,110,0.3));
        }
        .welcome__tour-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(28px, 4vw, 40px); font-weight: 300;
          color: #fff; margin: 0 0 16px;
        }
        .welcome__tour-desc {
          font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.8;
          color: rgba(255,255,255,0.4); max-width: 420px; margin: 0 auto 40px;
        }
        .welcome__step-count {
          display: block; margin-top: 32px;
          font-family: 'Inter', sans-serif; font-size: 10px; letter-spacing: 0.3em;
          color: rgba(255,255,255,0.12);
        }
        .welcome__ready-icon {
          width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 32px;
          border: 1px solid rgba(201,169,110,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; color: #c9a96e;
          background: rgba(201,169,110,0.05);
        }
        .welcome__ready-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(32px, 5vw, 48px); font-weight: 300;
          color: #fff; margin: 0 0 16px;
        }
        .welcome__ready-desc {
          font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.8;
          color: rgba(255,255,255,0.35); max-width: 400px; margin: 0 auto 40px;
        }
        @keyframes welcomeFade {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 600px) {
          .welcome__main { padding: 100px 24px 40px; }
          .welcome__actions { width: 100%; }
          .welcome__btn--primary { width: 100%; }
        }
      `}</style>
    </div>
  );
}
