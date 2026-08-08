'use client';

import { useRouter } from 'next/navigation';
import { Award, Calendar, BookOpen, BarChart3, Clock, ArrowRight, Target, Video, CalendarDays } from 'lucide-react';
import { useBatches } from '@/lib/hooks/useBatches';
import { StudentBatchSessions } from './StudentBatchSessions';
import { generateBatchSlug } from '@/lib/utils/urlUtils';
import styles from './student.module.css';

import { useState, useEffect } from 'react';

export default function StudentDashboard() {
  const router = useRouter();
  const { batches, isLoaded } = useBatches();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/token', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data?.token) return;
        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          fetch(`/api/users/${payload.id}`)
            .then(res => res.ok ? res.json() : null)
            .then(userData => {
              if (userData) {
                if (userData.role === 'COACH' || userData.role === 'ADMIN') {
                  router.replace('/dashboard/coach');
                  return;
                }
                setCurrentUser(userData);
              }
            })
            .catch(() => {});
        } catch (e) {}
      })
      .catch(() => {});
  }, [router]);

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStudentName = (user: any) => {
    if (!user) return 'Student';
    const first = (user.firstName || user.student?.firstName || '').trim();
    const last = (user.lastName || user.student?.lastName || '').trim();
    const combined = `${first} ${last}`.trim();
    if (combined) return combined;
    const name = (user.student?.name || user.name || '').trim();
    if (name) return name;
    if (user.username) {
      return user.username
        .split(/[_.\-\s]+/)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    return 'Student';
  };

  const studentName = getStudentName(currentUser);

  if (!isLoaded) return <div className={styles.container}>Loading dashboard...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeText}>
          <h1 className={styles.welcomeTitle}>
            {getGreeting()}, {studentName} <span role="img" aria-label="wave">👋</span>
          </h1>
          <p className={styles.welcomeSubtitle}>Keep learning, keep improving!</p>
        </div>
        {/* Placeholder for illustration if needed */}
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#fff5f5', color: '#e67e22' }}>
            <Award size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>My Level</p>
            <h3 className={styles.statValue} style={{ color: '#4a2018' }}>Intermediate</h3>
          </div>
        </div>
        
        <div className={styles.statItem}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
            <CalendarDays size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Active Batches</p>
            <h3 className={styles.statValue}>{batches.length || 2}</h3>
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#f0fdf4', color: '#22c55e' }}>
            <BookOpen size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Classes Attended</p>
            <h3 className={styles.statValue}>24</h3>
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>
            <BarChart3 size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Attendance</p>
            <h3 className={styles.statValue}>92%</h3>
          </div>
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleBlock}>
          <h2 className={styles.sectionTitle}>
            <CalendarDays size={20} />
            Today's Classes
          </h2>
          <p className={styles.sectionDate}>Saturday, May 31</p>
        </div>
        <a className={styles.viewAll}>View All Batches <ArrowRight size={16} /></a>
      </div>
      
      <div className={styles.classList}>
        {batches.map((batch, index) => {
          // For visual demo matching the screenshot, we alternate styles
          const isLiveSoon = index === 0; 
          const leftClass = isLiveSoon ? styles.live : styles.scheduled;
          const badgeText = isLiveSoon ? 'LIVE SOON' : 'SCHEDULED';
          
          return (
            <div key={batch.id} className={styles.classCard}>
              <div className={`${styles.cardLeft} ${leftClass}`}>
                <div className={`${styles.statusBadge} ${leftClass}`}>{badgeText}</div>
                <h3 className={`${styles.time} ${leftClass}`}>{batch.startTime || '17:00'}</h3>
                <p className={`${styles.timeSub} ${leftClass}`}>
                  {isLiveSoon ? 'Starts in 42 min' : 'Today'}
                </p>
                <Clock className={styles.clockIcon} size={20} />
              </div>
              
              <div className={styles.cardMiddle}>
                <h3 className={styles.className}>{batch.name}</h3>
                <p className={styles.coachName}>
                  <Award size={16} color="#6b7280" /> {batch.coach}
                </p>
                <div className={styles.tags}>
                  <span className={styles.tag}>Batch</span>
                  <span className={`${styles.tag} ${isLiveSoon ? styles.green : styles.blue}`}>Class 1</span>
                </div>
              </div>
              
              <StudentBatchSessions batchId={batch.id} batchSlug={generateBatchSlug(batch.id, batch.name, batches)} />
            </div>
          );
        })}

        {batches.length === 0 && (
          <div className={styles.classCard} style={{ padding: '48px', justifyContent: 'center', textAlign: 'center', color: '#6b7280' }}>
            You are not enrolled in any classes yet.
          </div>
        )}
      </div>

      <div className={styles.banner}>
        <div className={styles.bannerLeft}>
          <div className={styles.targetIcon}>
            <Target size={24} />
          </div>
          <div className={styles.bannerText}>
            <h4 className={styles.bannerTitle}>Stay Consistent, Get Better Every Day!</h4>
            <p className={styles.bannerSub}>Your dedication today builds your victory tomorrow.</p>
          </div>
        </div>
        <button className={styles.btnPractice}>
          <Target size={18} />
          Practice Puzzles
        </button>
      </div>
    </div>
  );
}
