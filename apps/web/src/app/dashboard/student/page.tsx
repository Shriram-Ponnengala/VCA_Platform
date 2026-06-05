'use client';

import { useRouter } from 'next/navigation';
import { Award, Calendar, BookOpen, BarChart3, Clock, ArrowRight, Target, Video, CalendarDays } from 'lucide-react';
import { useBatches } from '@/lib/hooks/useBatches';
import { StudentBatchSessions } from './StudentBatchSessions';
import styles from './student.module.css';

export default function StudentDashboard() {
  const router = useRouter();
  const { batches, isLoaded } = useBatches();

  if (!isLoaded) return <div className={styles.container}>Loading dashboard...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeText}>
          <h1 className={styles.welcomeTitle}>
            Good Evening, student1 <span role="img" aria-label="wave">👋</span>
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
              
              <StudentBatchSessions batchId={batch.id} />
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
