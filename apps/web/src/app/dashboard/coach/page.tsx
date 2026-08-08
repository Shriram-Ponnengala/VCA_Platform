'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Clock, Calendar as CalendarIcon, CalendarDays, BookOpen, BarChart3, ArrowRight, Target, Video } from 'lucide-react';
import { useBatches } from '@/lib/hooks/useBatches';
import { generateBatchSlug } from '@/lib/utils/urlUtils';
import styles from './coach.module.css';

export default function CoachDashboard() {
  const router = useRouter();
  const { batches, isLoaded: batchesLoaded } = useBatches();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    // 1. Fetch current user from token
    fetch('/api/auth/token', { credentials: 'include' })
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(data => {
        if (!data || !data.token) {
          setIsAuthLoaded(true);
          return;
        }
        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          fetch(`/api/users/${payload.id}`)
            .then(res => res.ok ? res.json() : null)
            .then(userData => {
              if (userData) {
                if (userData.role === 'STUDENT') {
                  router.replace('/dashboard/student');
                  return;
                }
                setCurrentUser(userData);
              }
              setIsAuthLoaded(true);
            })
            .catch(() => setIsAuthLoaded(true));
        } catch (e) {
          console.warn('Error decoding token:', e);
          setIsAuthLoaded(true);
        }
      })
      .catch(err => {
        console.warn('[Dashboard] Auth error:', err);
        setIsAuthLoaded(true);
      });

    // 2. Fetch all attendance records
    fetch('/api/attendance')
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(data => {
        setAttendanceRecords(data);
      })
      .catch(err => {
        console.error('[Dashboard] Failed to fetch attendance:', err);
      });
  }, []);

  if (!batchesLoaded || !isAuthLoaded) {
    return <div className={styles.container}>Loading dashboard...</div>;
  }

  // Filter batches to only show those assigned to the logged-in coach
  const myBatches = batches.filter(batch => batch.coachId === currentUser?.id);

  // Total students enrolled in the coach's batches
  const totalStudents = myBatches.reduce((acc, batch) => acc + (batch.students?.length || 0), 0);

  // Current date formatting
  const today = new Date();
  const todayDateStr = today.toISOString().split('T')[0];
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const weekdayStr = today.toLocaleDateString('en-US', { weekday: 'long' });

  // Today's sessions for this coach
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

  // Stats Calculations
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // 1. Classes Taken This Month (sessions that have a date <= today in the current month)
  const thisMonthSessions = myBatches.flatMap(batch => batch.sessions || []).filter(session => {
    if (!session.date) return false;
    const d = new Date(session.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const classesTaken = thisMonthSessions.filter(session => {
    const sessionDateStr = new Date(session.date).toISOString().split('T')[0];
    return sessionDateStr <= todayDateStr;
  }).length;

  // 2. Attendance rate this month
  const myBatchIds = new Set(myBatches.map(b => b.id));
  const myAttendance = attendanceRecords.filter(record => myBatchIds.has(record.classId));
  const currentMonthAttendance = myAttendance.filter(record => {
    if (!record.date) return false;
    const d = new Date(record.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });
  
  const presentCount = currentMonthAttendance.filter(r => r.status?.toLowerCase() === 'present').length;
  const totalAttendanceCount = currentMonthAttendance.length;
  const attendanceRate = totalAttendanceCount > 0 
    ? Math.round((presentCount / totalAttendanceCount) * 100) 
    : 100; // Default to 100% if no records are registered yet

  // Greeting time logic
  const getGreeting = () => {
    const hrs = today.getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const isCoachRole = currentUser?.role === 'COACH';
  const namePrefix = isCoachRole ? 'Coach ' : '';
  const getFullName = (user: any) => {
    if (!user) return '';
    const first = (user.firstName || user.coach?.firstName || user.student?.firstName || '').trim();
    const last = (user.lastName || user.coach?.lastName || user.student?.lastName || '').trim();
    const combined = `${first} ${last}`.trim();
    if (combined) return combined;
    const name = (user.coach?.name || user.student?.name || user.name || '').trim();
    if (name) return name;
    if (user.username) {
      return user.username
        .split(/[_.\-\s]+/)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    return '';
  };

  const fullName = getFullName(currentUser);

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

  return (
    <div className={styles.container}>
      <div className={styles.welcomeSection}>
        <div>
          <h1 className={styles.welcomeTitle}>
            {getGreeting()}, {namePrefix}{fullName}
          </h1>
          <p className={styles.welcomeSubtitle}>Here's what's happening today.</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateBlock}>
            <CalendarIcon size={20} className={styles.dateIcon} />
            <div className={styles.dateInfo}>
              <h4>{dateStr}</h4>
              <p>{weekdayStr}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#fff7ed', color: '#f97316' }}>
            <Users size={20} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Assigned Students</p>
            <h3 className={styles.statValue}>{totalStudents}</h3>
            <p className={styles.statSub}>Across {myBatches.length} batches</p>
          </div>
        </div>
        
        <div className={styles.statItem}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#f0fdf4', color: '#22c55e' }}>
            <BookOpen size={20} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Classes Taken</p>
            <h3 className={styles.statValue}>{classesTaken}</h3>
            <p className={styles.statSub}>This Month</p>
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
            <BarChart3 size={20} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Attendance</p>
            <h3 className={styles.statValue}>{attendanceRate}%</h3>
            <p className={styles.statSub}>This Month</p>
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#faf5ff', color: '#a855f7' }}>
            <CalendarDays size={20} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Today's Classes</p>
            <h3 className={styles.statValue}>{todaysSessions.length}</h3>
            <p className={styles.statSub}>Scheduled</p>
          </div>
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleBlock}>
          <CalendarIcon size={18} style={{ color: '#0f172a' }} />
          <h2 className={styles.sectionTitle}>Today's Classes</h2>
        </div>
        <a className={styles.viewAll} onClick={() => router.push('/dashboard/coach/batches')}>
          View Full Calendar <ArrowRight size={14} />
        </a>
      </div>
      
      <div className={styles.classList}>
        {todaysSessions.length === 0 ? (
          <div className={styles.emptyStateCard}>
            <CalendarDays size={40} className={styles.emptyStateIcon} />
            <h3>No classes scheduled today</h3>
            <p>Enjoy your day off or review your upcoming batch schedules.</p>
          </div>
        ) : (
          todaysSessions.map((session, index) => {
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
                    <p style={{ marginTop: '12px', fontSize: '0.75rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a' }} />
                      In Progress
                    </p>
                  ) : (
                    <p style={{ marginTop: '12px', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> Starts today
                    </p>
                  )}
                </div>
                
                <div className={styles.cardMiddle}>
                  <h3 className={styles.className}>{session.sessionTitle || session.className}</h3>
                  <p className={styles.coachName}>
                    <CalendarDays size={14} /> Batch: {session.program || session.className}
                  </p>
                  <p className={styles.coachName}>
                    <Users size={14} /> {session.studentsCount} Students
                  </p>
                </div>
                
                <div className={styles.cardRight}>
                  <button 
                    className={isLiveSoon ? styles.btnLive : styles.btnOutline}
                    onClick={() => startClassroom(session.batchId)}
                  >
                    <Video size={14} /> Join Classroom
                  </button>
                  <button 
                    className={styles.btnDetails}
                    onClick={() => router.push(`/dashboard/coach/batches/${generateBatchSlug(session.batchId, session.program || session.className || '', batches)}`)}
                  >
                    Class Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className={styles.banner}>
        <div className={styles.bannerLeft}>
          <div className={styles.targetIcon}>
            <Target size={20} />
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
          View My Batches <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
