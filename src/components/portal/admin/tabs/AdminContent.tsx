'use client';

import ContentEditor from '@/components/portal/admin/ContentEditor';

export default function AdminContent() {
  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-header__eyebrow">SYSTEM</div>
          <h1 className="admin-header__title">Site Content</h1>
          <p className="admin-header__subtitle">
            Edit marketing page copy directly. Changes save to localStorage (demo mode) or Supabase.
          </p>
        </div>
      </div>
      <ContentEditor />
    </>
  );
}
