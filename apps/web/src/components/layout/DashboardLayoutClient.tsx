'use client';
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import styles from '@/app/dashboard/layout.module.css';
import { Breadcrumbs } from './Breadcrumbs';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  role: 'ADMIN' | 'COACH' | 'STUDENT';
  username: string;
  userId: string;
}

import { usePathname } from 'next/navigation';

export function DashboardLayoutClient({ children, role, username, userId }: DashboardLayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const isClassroom = pathname === '/classroom' || pathname.startsWith('/classroom/');

  return (
    <div className={`${styles.layout} ${isCollapsed ? styles.collapsed : ''}`}>
      <Sidebar 
        role={role} 
        username={username} 
        userId={userId} 
        isCollapsed={isCollapsed} 
        onToggle={() => setIsCollapsed(!isCollapsed)} 
      />
      <main className={styles.mainContent}>
        <div className={styles.pageContent} style={isClassroom ? { padding: 0 } : {}}>
          {!isClassroom && <Breadcrumbs />}
          {children}
        </div>
      </main>
    </div>
  );
}
