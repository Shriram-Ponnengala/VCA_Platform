import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
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

  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      role = payload.role;
      username = payload.username;
    }
  }

  return (
    <div className={styles.layout}>
      <Sidebar role={role} username={username} />
      <main className={styles.mainContent}>
        <div className={styles.pageContent}>
          <Breadcrumbs />
          {children}
        </div>
      </main>
    </div>
  );
}
