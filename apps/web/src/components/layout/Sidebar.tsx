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
  HelpCircle
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
  const [showHelpModal, setShowHelpModal] = React.useState(false);

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
        .catch(console.error);
    }
  }, [userId]);

  const adminLinks = [
    { name: 'Dashboard', href: '/dashboard/coach', icon: Home },
    { name: 'Programs', href: '/dashboard/admin/programs', icon: BookOpen },
    { name: 'Batches', href: '/dashboard/admin/batches', icon: Calendar },
    { name: 'Classroom', href: '/classroom', icon: Zap },
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
    { name: 'Database', href: '/dashboard/coach/database', icon: Database },
    { name: 'Settings', href: '/dashboard/coach/settings', icon: Settings },
  ];

  const studentLinks = [
    { name: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
    { name: 'My Batch', href: '/dashboard/student/batches', icon: Calendar },
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
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.logoSection}>
        <button className={styles.menuButton} onClick={onToggle}>
          <Menu size={28} strokeWidth={1.5} />
        </button>
        <div className={styles.logoImage}>
          <Image 
            src="/vca_logo.png" 
            alt="VCA Logo" 
            width={44} 
            height={44} 
            className={styles.avatar}
          />
        </div>
        <div className={styles.logoText}>
          <span className={styles.venture}>VCA</span>
          <span className={styles.chess}>VENTURE CHESS ACADEMY</span>
        </div>
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
        <button className={styles.helpBtn} onClick={() => setShowHelpModal(true)}>
          <HelpCircle size={20} />
          <span>Help & Shortcuts</span>
        </button>
      </div>

      {showHelpModal && (
        <div className={styles.modalOverlay} onClick={() => setShowHelpModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Platform Help & Shortcuts</h2>
              <button className={styles.closeBtn} onClick={() => setShowHelpModal(false)}>
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <section className={styles.section}>
                <h3>Interactive Board Drawing</h3>
                <ul>
                  <li><strong>Arrow drawing:</strong> Right-click and drag on the board. Modifier keys: Shift (Red arrow), Ctrl (Green arrow), Alt (Yellow arrow), default (Blue arrow).</li>
                  <li><strong>Square highlighting:</strong> Right-click any square. Modifier keys: Shift (Red square), Ctrl (Green square), Alt (Yellow square), default (Blue square).</li>
                  <li><strong>Freehand drawing:</strong> Select the Freehand tool and click-and-drag with left click.</li>
                  <li><strong>Emoji Reactions:</strong> Click anywhere on the board (when Emoji Mode is active) to trigger an animated emoji reaction at the click point.</li>
                </ul>
              </section>

              <section className={styles.section}>
                <h3>Board Shortcuts</h3>
                <div className={styles.shortcutGrid}>
                  <div className={styles.shortcutItem}><kbd>→</kbd><span>Next move</span></div>
                  <div className={styles.shortcutItem}><kbd>←</kbd><span>Previous move</span></div>
                  <div className={styles.shortcutItem}><kbd>↑</kbd><span>Go to start of line</span></div>
                  <div className={styles.shortcutItem}><kbd>↓</kbd><span>Go to end of line</span></div>
                  <div className={styles.shortcutItem}><kbd>Space</kbd><span>Toggle engine analysis</span></div>
                </div>
              </section>

              <section className={styles.section}>
                <h3>Emoji Reactions (Shift + Key)</h3>
                <div className={styles.emojiGrid}>
                  <div className={styles.emojiItem}><kbd>Shift+P</kbd><span>👊 Punch</span></div>
                  <div className={styles.emojiItem}><kbd>Shift+O</kbd><span>👌 OK</span></div>
                  <div className={styles.emojiItem}><kbd>Shift+Y</kbd><span>🥱 Yawning</span></div>
                  <div className={styles.emojiItem}><kbd>Shift+U</kbd><span>👍 Thumbsup</span></div>
                  <div className={styles.emojiItem}><kbd>Shift+I</kbd><span>👎 Thumbsdown</span></div>
                  <div className={styles.emojiItem}><kbd>Shift+R</kbd><span>😠 Angry</span></div>
                  <div className={styles.emojiItem}><kbd>Shift+E</kbd><span>😄 Happy</span></div>
                  <div className={styles.emojiItem}><kbd>Shift+T</kbd><span>😂 Laughing</span></div>
                  <div className={styles.emojiItem}><kbd>Shift+W</kbd><span>👏 Clap</span></div>
                  <div className={styles.emojiItem}><kbd>Shift+Q</kbd><span>😢 Sad</span></div>
                  <div className={styles.emojiItem}><kbd>Shift+C</kbd><span>😭 Crying</span></div>
                  <div className={styles.emojiItem}><kbd>Shift+K</kbd><span>🤝 Handshake</span></div>
                  <div className={styles.emojiItem}><kbd>Shift+Z</kbd><span>😴 Sleeping</span></div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
