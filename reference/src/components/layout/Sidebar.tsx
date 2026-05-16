'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Layers, 
  Settings, 
  LogOut
} from 'lucide-react';
import Image from 'next/image';
import styles from './Sidebar.module.css';

interface SidebarProps {
  role: 'ADMIN' | 'COACH' | 'STUDENT';
  username: string;
}

export function Sidebar({ role, username }: SidebarProps) {
  const pathname = usePathname();

  const adminLinks = [
    { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'Programs', href: '/dashboard/admin/programs', icon: BookOpen },
    { name: 'Students', href: '/dashboard/admin/students', icon: Users },
    { name: 'Coaches', href: '/dashboard/admin/coaches', icon: GraduationCap },
    { name: 'Batches', href: '/dashboard/admin/batches', icon: Layers },
    { name: 'Users', href: '/dashboard/admin/users', icon: Users },
    { name: 'Chess Test', href: '/chess-test', icon: Layers },
    { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
  ];

  const coachLinks = [
    { name: 'Dashboard', href: '/dashboard/coach', icon: LayoutDashboard },
    { name: 'Attendance', href: '/dashboard/coach/attendance', icon: Users },
  ];

  const studentLinks = [
    { name: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
    { name: 'Attendance', href: '/dashboard/student/attendance', icon: Users },
  ];

  const links = role === 'ADMIN' ? adminLinks : role === 'COACH' ? coachLinks : studentLinks;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/';
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoSection}>
        <div className={styles.logoImage}>
          <Image 
            src="/vca_logo.png" 
            alt="VCA Logo" 
            width={40} 
            height={40} 
            className={styles.avatar}
          />
        </div>
        <div className={styles.logoText}>
          <span className={styles.venture}>Venture</span>
          <span className={styles.chess}>CHESS</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {links.map((link) => {
          const Icon = link.icon;
          const isDashboardRoot = link.href === '/dashboard/admin' || link.href === '/dashboard/coach' || link.href === '/dashboard/student';
          const isActive = isDashboardRoot ? pathname === link.href : (pathname === link.href || pathname.startsWith(link.href + '/'));
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={20} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <button className={styles.signOut} onClick={handleLogout}>
        <LogOut size={20} />
        <span>Sign Out</span>
      </button>
    </aside>
  );
}
