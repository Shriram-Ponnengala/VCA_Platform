'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Clock, Calendar, CheckCircle } from 'lucide-react';
import { useBatches } from '@/lib/hooks/useBatches';
import styles from './coach.module.css';

export default function CoachDashboard() {
  const router = useRouter();
  const { batches, isLoaded } = useBatches();

  // In a real app, we'd filter by the current logged-in coach's name
  // For now, we'll show all batches to demonstrate the UI
  const myBatches = batches; 
  
  const totalStudents = myBatches.reduce((acc, batch) => acc + batch.students.length, 0);
  const activeBatchesCount = myBatches.filter(b => b.status === 'active').length;

  const stats = [
    { label: 'Total Students', value: totalStudents.toString(), icon: Users, color: '#10b981' },
    { label: 'Active Batches', value: activeBatchesCount.toString(), icon: CheckCircle, color: '#3b82f6' },
    { label: 'Classes Today', value: '2', icon: Calendar, color: '#f59e0b' },
  ];

  if (!isLoaded) return <div className={styles.container}>Loading dashboard...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}10`, color: stat.color }}>
                <Icon size={24} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{stat.label}</p>
                <h3 className={styles.statValue}>{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.todaySchedule}>
        <h2 className={styles.sectionTitle}>Today's Schedule</h2>
        <div className={styles.scheduleList}>
          {myBatches.slice(0, 2).map((batch) => (
            <div key={batch.id} className={styles.scheduleItem}>
              <div className={styles.timeInfo}>
                <span className={styles.time}>{batch.startTime}</span>
              </div>
              <div className={styles.classInfo}>
                <h4 className={styles.className}>{batch.name}</h4>
                <p className={styles.classDetails}>{batch.program} • {batch.students.length} Students</p>
              </div>
              <button 
                className={styles.actionBtn}
                onClick={() => router.push('/dashboard/coach/attendance')}
              >
                Mark Attendance
              </button>
            </div>
          ))}
          {myBatches.length === 0 && (
            <p className={styles.emptyText}>No classes scheduled for today.</p>
          )}
        </div>
      </div>
    </div>
  );
}
