'use client';

import React from 'react';
import { CalendarDays, Clock, PlayCircle, Calendar as CalendarIcon } from 'lucide-react';
import { useSessions } from '@/lib/hooks/useSessions';
import styles from './student.module.css';
import { useRouter } from 'next/navigation';

export function StudentBatchSessions({ batchId, batchSlug }: { batchId: string, batchSlug: string }) {
  const router = useRouter();
  const { sessions, isLoaded } = useSessions(batchId);

  if (!isLoaded) return <div className={styles.cardRight} style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading sessions...</div>;

  const upcomingSessions = sessions.filter(s => s.status === 'Upcoming' || s.status === 'Live');
  
  if (upcomingSessions.length === 0) {
    return (
      <div className={styles.cardRight} style={{ flex: 1, justifyContent: 'space-between', paddingLeft: 0, borderLeft: 'none' }}>
        <div style={{ color: '#6b7280', fontSize: '0.875rem', padding: '0 24px' }}>No upcoming sessions.</div>
        <div className={styles.cardActions}>
          <button 
            className={styles.btnView}
            onClick={() => router.push(`/dashboard/student/batches/${batchSlug}`)}
          >
            <CalendarIcon size={16} /> View Details
          </button>
        </div>
      </div>
    );
  }

  const nextSession = upcomingSessions[0]; // Assuming they are sorted by date

  const d = new Date(nextSession.date);
  const dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className={styles.cardRight}>
      <div className={styles.scheduleInfo}>
        <div className={styles.scheduleItem}>
          <CalendarDays size={16} className={styles.scheduleIcon} />
          {dateStr}
        </div>
        <div className={styles.scheduleItem}>
          <Clock size={16} className={styles.scheduleIcon} />
          {nextSession.startTime} - {nextSession.endTime || '18:00'}
        </div>
      </div>
      
      <div className={styles.cardActions}>
        <button 
          className={styles.btnDetails}
          onClick={() => router.push(`/dashboard/student/batches/${batchSlug}`)}
        >
          Class Details
        </button>
      </div>
    </div>
  );
}
