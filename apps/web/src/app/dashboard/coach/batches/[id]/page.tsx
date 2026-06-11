'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, BookOpen, Play } from 'lucide-react';
import { useBatches } from '@/lib/hooks/useBatches';
import { useStudents } from '@/lib/hooks/useStudents';
import { extractBatchId } from '@/lib/utils/urlUtils';
import { SessionsTab } from './SessionsTab';
import { AttendanceTab } from './AttendanceTab';
import styles from '../../../admin/batches/[id]/batchDetail.module.css';

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { batches, isLoaded } = useBatches();
  const { students: allStudents, isLoaded: studentsLoaded } = useStudents();
  const [activeTab, setActiveTab] = useState('overview');

  const rawId = decodeURIComponent(params.id as string);
  const batchId = extractBatchId(rawId, batches);
  const batch = batches.find(b => b.id === batchId);

  if (!isLoaded || !studentsLoaded) return <div className={styles.container}>Loading...</div>;
  
  if (!batch) {
    return (
      <div className={styles.container}>
        <h2>Batch not found</h2>
      </div>
    );
  }

  const safeStudents = Array.isArray(batch.students) ? batch.students : [];
  const enrolledStudents = allStudents.filter(s => safeStudents.includes(s.id));

  const startClassroom = async () => {
    try {
      const res = await fetch(`/api/classrooms/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: batch.id })
      });
      const data = await res.json();
      if (res.ok || data.classroomId) {
        router.push(`/classroom/${batch.id}`);
      } else {
        alert(data.error || 'Failed to start classroom');
      }
    } catch (err) {
      console.error(err);
      alert('Error starting classroom');
    }
  };

  return (
    <div className={styles.container}>


      <header className={styles.header}>
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
        <div className={styles.actions} style={{ display: 'flex', gap: '12px' }}>
          <button 
            style={{ 
              backgroundColor: '#f59e0b', color: 'white', padding: '10px 16px', 
              borderRadius: '8px', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' 
            }}
            onClick={startClassroom}
          >
            <Play size={16} fill="white" /> Start Classroom
          </button>
        </div>
      </header>

      <div className={styles.mainContent}>
        <div className={styles.leftCol}>
          <div className={styles.tabsContainer}>
            <button 
              className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'students' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('students')}
            >
              Students ({enrolledStudents.length})
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'sessions' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('sessions')}
            >
              Sessions
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'attendance' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('attendance')}
            >
              Attendance
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className={styles.emptyState}>Overview content goes here.</div>
          )}

          {activeTab === 'students' && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Enrolled Students ({enrolledStudents.length})</h2>
              </div>

              {enrolledStudents.length === 0 ? (
                <div className={styles.emptyState}>No students enrolled yet</div>
              ) : (
                <div className={styles.studentList}>
                  {enrolledStudents.map(student => (
                    <div key={student.id} className={styles.studentCard}>
                      <div className={styles.studentInfo}>
                        <h4 className={styles.studentName}>{student.name}</h4>
                        <p className={styles.studentEmail}>{student.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'sessions' && (
            <SessionsTab batchId={batch.id} enrolledStudents={enrolledStudents} />
          )}

          {activeTab === 'attendance' && (
            <AttendanceTab batchId={batch.id} enrolledStudents={enrolledStudents} />
          )}

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
              <span className={styles.scheduleValue}>{batch.startDate}</span>
            </div>
            <div className={styles.scheduleItem}>
              <span className={styles.scheduleLabel}>Time</span>
              <span className={styles.scheduleValue}>{batch.startTime} - {batch.endTime}</span>
            </div>
            <div className={styles.scheduleItem}>
              <span className={styles.scheduleLabel}>Weekly Schedule</span>
              <div className={styles.dayPills}>
                {batch.days.map(day => (
                  <span key={day} className={styles.dayPill}>{day}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
