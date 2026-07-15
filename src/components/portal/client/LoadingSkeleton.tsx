'use client';

import { useEffect, useState } from 'react';
import './portal.css';

interface LoadingSkeletonProps {
  label?: string;
  sublabel?: string;
}

const LOADING_RECOVERY_TIMEOUT_MS = 12_000;

export default function LoadingSkeleton({ label = 'Opening your file.', sublabel = 'Verifying access.' }: LoadingSkeletonProps) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), LOADING_RECOVERY_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (timedOut) {
    return (
      <div className="portal-skeleton" role="alert">
        <div className="portal-skeleton__inner">
          <span className="portal-skeleton__label">Access is taking longer than expected.</span>
          <span className="portal-skeleton__sublabel">Refresh to try again.</span>
          <button
            type="button"
            className="portal-skeleton__retry"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-skeleton">
      <div className="portal-skeleton__inner">
        <span className="portal-skeleton__label">{label}</span>
        <span className="portal-skeleton__sublabel">{sublabel}</span>
        <div className="portal-skeleton__bar" />
      </div>
    </div>
  );
}
