'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home,
  LayoutDashboard, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Settings, 
  LogOut,
  Calendar,
  Zap,
  Menu,
  UserCog,
  Database,
  Compass
} from 'lucide-react';
import Image from 'next/image';
import styles from './Sidebar.module.css';

interface SidebarProps {
  role: 'ADMIN' | 'COACH' | 'STUDENT';
  username: string;
  userId?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ role, username, userId, isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [profilePhoto, setProfilePhoto] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (userId) {
      fetch(`/api/users/${userId}`)
        .then(async (res) => {
          if (!res.ok) return null;
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return res.json();
          }
          return null;
        })
        .then(data => {
          if (data && data.profilePhoto) {
            setProfilePhoto(data.profilePhoto);
          }
        })
        .catch(() => {});
    }
  }, [userId]);

  const [branding, setBranding] = React.useState<any>(null);
  React.useEffect(() => {
    const loadBranding = () => {
      try {
        const stored = localStorage.getItem('vca_settings_branding');
        if (stored) {
          try { setBranding(JSON.parse(stored)); } catch (e) {}
        }
        // Always fetch from DB to ensure we have the latest (in case large logos failed to save to localStorage)
        fetch('/api/settings/branding', { cache: 'no-store' })
          .then(res => res.json())
          .then(data => {
            if (data && Object.keys(data).length > 0) {
              setBranding(data);
            }
          })
          .catch(() => {});
      } catch (e) {}
    };

    loadBranding();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'vca_settings_branding' && e.newValue) {
        try { setBranding(JSON.parse(e.newValue)); } catch (e) {}
      }
    };
    
    const handleCustom = () => {
      loadBranding();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('vca-branding-updated', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('vca-branding-updated', handleCustom);
    };
  }, []);

  const adminLinks = [
    { name: 'Dashboard', href: '/dashboard/coach', icon: Home },
    { name: 'Programs', href: '/dashboard/admin/programs', icon: BookOpen },
    { name: 'Batches', href: '/dashboard/admin/batches', icon: Calendar },
    { name: 'Classroom', href: '/classroom', icon: Zap },
    { name: 'Analysis Board', href: '/dashboard/analysis', icon: Compass },
    { name: 'Database', href: '/dashboard/admin/database', icon: Database },
    { name: 'Students', href: '/dashboard/admin/students', icon: GraduationCap },
    { name: 'Coaches', href: '/dashboard/admin/coaches', icon: Users },
    { name: 'Users', href: '/dashboard/admin/users', icon: UserCog },
    { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
  ];

  const coachLinks = [
    { name: 'Dashboard', href: '/dashboard/coach', icon: Home },
    { name: 'Batches', href: '/dashboard/coach/batches', icon: Calendar },
    { name: 'Classroom', href: '/classroom', icon: Zap },
    { name: 'Analysis Board', href: '/dashboard/analysis', icon: Compass },
    { name: 'Database', href: '/dashboard/coach/database', icon: Database },
    { name: 'Settings', href: '/dashboard/coach/settings', icon: Settings },
  ];

  const studentLinks = [
    { name: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
    { name: 'My Batch', href: '/dashboard/student/batches', icon: Calendar },
    { name: 'Homework', href: '/dashboard/student/homework', icon: BookOpen },
    { name: 'Analysis Board', href: '/dashboard/analysis', icon: Compass },
    { name: 'Database', href: '/dashboard/student/database', icon: Database },
    { name: 'Settings', href: '/dashboard/student/settings', icon: Settings },
  ];

  const safeRole = role ? role.toUpperCase() : 'STUDENT';
  const links = safeRole === 'ADMIN' ? adminLinks : safeRole === 'COACH' ? coachLinks : studentLinks;

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
    <aside data-app-sidebar className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.logoSection}>
        <div className={styles.logoRow}>
          <button className={styles.menuButton} onClick={onToggle}>
            <Menu size={28} strokeWidth={1.5} />
          </button>
          <div className={styles.logoImage}>
            {(() => {
              let logoSrc = null;
              if (isCollapsed && (branding?.iconUpload || branding?.iconUrl)) {
                logoSrc = branding.iconUpload || branding.iconUrl;
              } else if (branding?.logoDarkUpload || branding?.logoDarkUrl) {
                logoSrc = branding.logoDarkUpload || branding.logoDarkUrl;
              } else if (branding?.logoUpload || branding?.logoUrl) {
                logoSrc = branding.logoUpload || branding.logoUrl;
              }

              if (logoSrc) {
                return <img src={logoSrc} alt="Academy Logo" width={44} height={44} className={styles.avatar} style={{ objectFit: 'contain' }} />;
              }
              
              return (
                <Image 
                  src="/vca_logo.png" 
                  alt="VCA Logo" 
                  width={44} 
                  height={44} 
                  className={styles.avatar}
                />
              );
            })()}
          </div>
          <div className={styles.logoText}>
            {branding?.academyName ? (
              <span className={styles.venture} style={{ fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', fontWeight: 700 }}>
                {branding.academyName}
              </span>
            ) : (
              <span className={styles.venture}>VCA</span>
            )}
          </div>
        </div>
        {!branding?.academyName && (
          <div className={styles.logoBottomText}>
            <span className={styles.chess}>Venture Chess Academy</span>
          </div>
        )}
      </div>

      <nav className={styles.nav}>
        {links.map((link) => {
          const Icon = link.icon;
          const isDashboardRoot = link.href === '/dashboard/coach' || link.href === '/dashboard/student';
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

      <div className={styles.sidebarFooter}>
        <div className={styles.userInfo}>
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className={styles.userAvatar} />
          ) : (
            <div className={styles.userAvatarPlaceholder}>
              {username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <span className={styles.usernameText}>{username}</span>
        </div>
        <button className={styles.signOut} onClick={handleLogout}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
