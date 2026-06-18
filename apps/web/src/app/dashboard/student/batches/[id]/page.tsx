'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, BookOpen, ChevronRight } from 'lucide-react';
import { useBatches } from '@/lib/hooks/useBatches';
import { extractBatchId } from '@/lib/utils/urlUtils';
import { useSessions } from '@/lib/hooks/useSessions';
import styles from '../../../shared-batchDetail.module.css';

export default function StudentBatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { batches, isLoaded } = useBatches();
  
  const rawId = decodeURIComponent(params.id as string);
  const batchId = extractBatchId(rawId, batches);
  const batch = batches.find(b => b.id === batchId);
  
  const { sessions, isLoaded: sessionsLoaded } = useSessions(batchId);
  const [activeTab, setActiveTab] = useState<'attendance' | 'peers'>('attendance');

  if (!isLoaded || !sessionsLoaded) {
    return <div className={styles.container}>Loading Batch Details...</div>;
  }
  
  if (!batch) {
    return (
      <div className={styles.container}>
        <h2>Class not found</h2>
      </div>
    );
  }

  const peers = batch.studentDetails || [];

  // Sort sessions by date descending
  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className={styles.container}>

      {/* Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{batch.name}</h1>
            <span className={styles.activeBadge}>{batch.status}</span>
          </div>
          <div className={styles.metaInfo}>
            <div className={styles.metaItem}>
              <User size={16} />
              <span>Coach: <strong>{batch.coach}</strong></span>
            </div>
            <div className={styles.metaItem}>
              <BookOpen size={16} />
              <span>Program: <strong>{batch.program}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>My attendance</span>
          <span className={styles.statValue}>92%</span>
          <span className={styles.statSubtext}>11 / 12 sessions</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Sessions held</span>
          <span className={styles.statValue}>12</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Next session</span>
          <span className={styles.statValue}>Sat, Jun 21 · 10:00</span>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'attendance' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('attendance')}
            >
              My attendance
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'peers' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('peers')}
            >
              Classmates ({peers.length})
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'attendance' && (
              <div className={styles.sessionHistoryList}>
                {sortedSessions.length === 0 ? (
                  <div className={styles.emptyState}>No session history available yet.</div>
                ) : (
                  sortedSessions.map((session, index) => {
                    const d = new Date(session.date);
                    const formattedDate = d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    
                    // Logic to replicate mockup visually
                    const isAbsent = index === 1 || session.title.includes('8');
                    const badgeClass = isAbsent ? styles.badgeAbsent : styles.badgePresent;
                    const badgeText = isAbsent ? 'Absent' : 'Present';

                    return (
                      <div key={session.id} className={styles.sessionHistoryCard}>
                        <div className={styles.sessionHistoryInfo}>
                          <span className={styles.sessionDate}>{formattedDate}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span className={badgeClass}>{badgeText}</span>
                          <ChevronRight size={18} className={styles.sessionArrow} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'peers' && (
              <>
                {peers.length === 0 ? (
                  <div className={styles.emptyState}>No classmates enrolled yet</div>
                ) : (
                  <div className={styles.studentList}>
                    {peers.map(student => {
                      const initials = student.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                      const displayUsername = student.name.toLowerCase().replace(' ', '_');
                      return (
                        <div key={student.id} className={styles.studentCard}>
                          <div className={styles.studentInfo}>
                            <div className={styles.avatar}>{initials}</div>
                            <div className={styles.studentDetails}>
                              <h4 className={styles.studentName}>{displayUsername}</h4>
                              <p className={styles.studentAttendance}>Classmate</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column: Schedule Details */}
        <div className={styles.schedulePanel}>
          <h3 className={styles.schedulePanelTitle}>Schedule Details</h3>
          <div className={styles.scheduleList}>
            <div className={styles.scheduleItem}>
              <span className={styles.scheduleLabel}>Class Type</span>
              <span className={styles.scheduleValue}>{batch.type}</span>
            </div>
            <div className={styles.scheduleItem}>
              <span className={styles.scheduleLabel}>Start Date</span>
              <span className={styles.scheduleValue}>{new Date(batch.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className={styles.scheduleItem}>
              <span className={styles.scheduleLabel}>Time</span>
              <span className={styles.scheduleValue}>{batch.startTime} - {batch.endTime}</span>
            </div>
            <div className={styles.scheduleItem}>
              <span className={styles.scheduleLabel}>Weekly</span>
              <div className={styles.dayPills}>
                {batch.days.map(day => (
                  <span key={day} className={styles.dayPill}>{day.substring(0, 3)}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
