'use client';

import './portal.css';

interface LoadingSkeletonProps {
  label?: string;
  sublabel?: string;
}

export default function LoadingSkeleton({ label = 'Opening your file.', sublabel = 'Verifying access.' }: LoadingSkeletonProps) {
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
