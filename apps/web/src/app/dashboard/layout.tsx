import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient';
import styles from './layout.module.css';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  let role: 'ADMIN' | 'COACH' | 'STUDENT' = 'STUDENT';
  let username = 'User';
  let userId = '';

  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      role = payload.role;
      username = payload.username;
      userId = payload.id;
    }
  }

  return (
    <DashboardLayoutClient role={role} username={username} userId={userId}>
      {children}
    </DashboardLayoutClient>
  );
}
