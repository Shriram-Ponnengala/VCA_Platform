'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Clock, Calendar as CalendarIcon, CheckCircle, Play, CalendarDays, BookOpen, BarChart3, ArrowRight, Target, Video } from 'lucide-react';
import { useBatches } from '@/lib/hooks/useBatches';
import styles from './coach.module.css';
import Image from 'next/image';

export default function CoachDashboard() {
  const router = useRouter();
  const { batches, isLoaded } = useBatches();

  // In a real app, we'd filter by the current logged-in coach's name
  const myBatches = batches; 
  
  const totalStudents = myBatches.reduce((acc, batch) => acc + batch.students.length, 0);
  const activeBatchesCount = myBatches.filter(b => b.status === 'active').length;

  const todayDateStr = new Date().toISOString().split('T')[0];
  
  const todaysSessions = myBatches.flatMap(batch => 
    (batch.sessions || [])
      .filter((session: any) => {
        if (!session.date) return false;
        const sessionDate = new Date(session.date).toISOString().split('T')[0];
        return sessionDate === todayDateStr;
      })
      .map((session: any) => ({
        batchId: batch.id,
        sessionId: session.id,
        className: batch.name,
        sessionTitle: session.title,
        startTime: session.startTime,
        endTime: session.endTime || '18:00',
        program: batch.program,
        studentsCount: batch.students?.length || 0,
      }))
  );

  const startClassroom = async (batchId: string) => {
    try {
      const res = await fetch(`/api/classrooms/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.classroomId) {
          router.push(`/classroom/${batchId}`);
        } else {
          alert(data.error || 'Failed to start classroom');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error starting classroom');
    }
  };

  if (!isLoaded) return <div className={styles.container}>Loading dashboard...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.welcomeSection}>
        <div>
          <h1 className={styles.welcomeTitle}>
            Good Evening, Coach Sharanesh <span role="img" aria-label="wave">👋</span>
          </h1>
          <p className={styles.welcomeSubtitle}>Here's what's happening today.</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateBlock}>
            <CalendarIcon size={24} className={styles.dateIcon} />
            <div className={styles.dateInfo}>
              <h4>May 31, 2025</h4>
              <p>Saturday</p>
            </div>
          </div>
          {/* Placeholder for chess illustration */}
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#fff7ed', color: '#f97316' }}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Assigned Students</p>
            <h3 className={styles.statValue}>{totalStudents || 28}</h3>
            <p className={styles.statSub}>Across {myBatches.length || 3} batches</p>
          </div>
        </div>
        
        <div className={styles.statItem}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#f0fdf4', color: '#22c55e' }}>
            <BookOpen size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Classes Taken</p>
            <h3 className={styles.statValue}>12</h3>
            <p className={styles.statSub}>This Month</p>
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
            <BarChart3 size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Attendance</p>
            <h3 className={styles.statValue}>87%</h3>
            <p className={styles.statSub}>This Month</p>
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#faf5ff', color: '#a855f7' }}>
            <CalendarDays size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Today's Classes</p>
            <h3 className={styles.statValue}>{todaysSessions.length || 2}</h3>
            <p className={styles.statSub}>Scheduled</p>
          </div>
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleBlock}>
          <CalendarIcon size={20} style={{ color: '#0f172a' }} />
          <h2 className={styles.sectionTitle}>Today's Classes</h2>
        </div>
        <a className={styles.viewAll}>View Full Calendar <ArrowRight size={16} /></a>
      </div>
      
      <div className={styles.classList}>
        {/* We use dummy sessions if none exist for visual completeness based on mockup */}
        {(todaysSessions.length > 0 ? todaysSessions : [
          { batchId: 'b1', sessionTitle: 'Beginner Openings', program: 'Beginner Openings', startTime: '17:00', endTime: '18:00', studentsCount: 12, className: 'Beginner Openings' },
          { batchId: 'b2', sessionTitle: 'Tactical Training', program: 'Tactical Training', startTime: '19:00', endTime: '20:00', studentsCount: 16, className: 'Tactical Training' }
        ]).map((session, index) => {
          const isLiveSoon = index === 0; 
          const leftClass = isLiveSoon ? styles.live : styles.scheduled;
          const badgeText = isLiveSoon ? 'LIVE NOW' : 'UPCOMING';
          
          return (
            <div key={`${session.batchId}-${index}`} className={styles.classCard}>
              <div className={`${styles.cardLeft} ${leftClass}`}>
                <div className={`${styles.statusBadge} ${leftClass}`}>{badgeText}</div>
                <h3 className={`${styles.time} ${leftClass}`}>{session.startTime}</h3>
                <p className={`${styles.timeSub} ${leftClass}`}>
                  Until {session.endTime}
                </p>
                {isLiveSoon ? (
                  <p style={{ marginTop: '16px', fontSize: '0.8rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#16a34a' }} />
                    In Progress
                  </p>
                ) : (
                  <p style={{ marginTop: '16px', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} /> Starts in 1h 42m
                  </p>
                )}
              </div>
              
              <div className={styles.cardMiddle}>
                <h3 className={styles.className}>{session.sessionTitle || session.className}</h3>
                <p className={styles.coachName}>
                  <CalendarDays size={16} /> Batch: {session.program || session.className}
                </p>
                <p className={styles.coachName}>
                  <Users size={16} /> {session.studentsCount} Students
                </p>
              </div>
              
              <div className={styles.cardRight}>
                {isLiveSoon ? (
                  <button 
                    className={styles.btnLive}
                    onClick={() => startClassroom(session.batchId)}
                  >
                    <Video size={16} /> Join Classroom
                  </button>
                ) : (
                  <button 
                    className={styles.btnOutline}
                    onClick={() => startClassroom(session.batchId)}
                  >
                    <Video size={16} /> Join Classroom
                  </button>
                )}
                <button 
                  className={styles.btnDetails}
                  onClick={() => router.push(`/dashboard/coach/batches/${session.batchId}`)}
                >
                  Class Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.banner}>
        <div className={styles.bannerLeft}>
          <div className={styles.targetIcon}>
            <Target size={24} />
          </div>
          <div>
            <h4 className={styles.bannerTitle}>Keep Inspiring, Keep Building Champions!</h4>
            <p className={styles.bannerSub}>Your guidance shapes their future.</p>
          </div>
        </div>
        <button 
          className={styles.btnBatches}
          onClick={() => router.push('/dashboard/coach/batches')}
        >
          View My Batches <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
