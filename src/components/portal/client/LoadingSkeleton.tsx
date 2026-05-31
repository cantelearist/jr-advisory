'use client';

import './portal.css';

interface LoadingSkeletonProps {
  label?: string;
}

export default function LoadingSkeleton({ label = 'LOADING' }: LoadingSkeletonProps) {
  return (
    <div className="portal-skeleton">
      <div className="portal-skeleton__inner">
        <span className="portal-skeleton__label">{label}</span>
        <div className="portal-skeleton__bar" />
      </div>
    </div>
  );
}
