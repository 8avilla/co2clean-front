'use client';

import React from 'react';
import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { UserProfile } from '@/components/Profile/components/UserProfile';

export default function ProfilePage() {
  return (
    <MainLayout>
      <div className="py-8">
        <UserProfile />
      </div>
    </MainLayout>
  );
}
