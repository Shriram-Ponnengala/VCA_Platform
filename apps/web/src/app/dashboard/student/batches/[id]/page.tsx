'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, BookOpen, Play, Calendar as CalendarIcon, Clock, Users, Video } from 'lucide-react';
import { Badge } from '@vca/ui';
import { useBatches } from '@/lib/hooks/useBatches';
import { extractBatchId } from '@/lib/utils/urlUtils';
import { useSessions } from '@/lib/hooks/useSessions';
import styles from '../batches.module.css';

export default function StudentBatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { batches, isLoaded } = useBatches();
  
  const rawId = decodeURIComponent(params.id as string);
  const batchId = extractBatchId(rawId, batches);
  const batch = batches.find(b => b.id === batchId);
  
  const { sessions, isLoaded: sessionsLoaded } = useSessions(batchId);
  const [activeTab, setActiveTab] = useState('overview');

  if (!isLoaded || !sessionsLoaded) return <div className={styles.container}>Loading Batch Details...</div>;
  
  if (!batch) {
    return (
      <div className={styles.container}>
        <h2>Class not found</h2>
      </div>
    );
  }

  const peers = batch.studentDetails || [];

  return (
    <div className={styles.container}>


      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className={styles.title}>{batch.name}</h1>
            <Badge variant="active">{batch.status}</Badge>
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
              className={`${styles.tab} ${activeTab === 'peers' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('peers')}
            >
              Classmates ({peers.length})
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'sessions' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('sessions')}
            >
              Sessions ({sessions.length})
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader} style={{ marginBottom: '16px' }}>
                <h2 className={styles.sectionTitle}>Class Overview</h2>
              </div>
              <p style={{ color: '#4a2018', lineHeight: '1.6', margin: 0 }}>
                Welcome to your class <strong>{batch.name}</strong>! In this class, you will work closely with your coach <strong>{batch.coach}</strong> to master chess concepts under the <strong>{batch.program}</strong> curriculum. 
              </p>
              <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Program Curriculum</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: 'var(--primary)' }}>{batch.program}</p>
                </div>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Coach</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: 'var(--primary)' }}>{batch.coach}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'peers' && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Classmates</h2>
              </div>

              {peers.length === 0 ? (
                <div className={styles.emptyState}>No classmates enrolled in this batch.</div>
              ) : (
                <div className={styles.studentList}>
                  {peers.map(student => {
                    const initials = student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                    return (
                      <div key={student.id} className={styles.studentCard}>
                        <div className={styles.studentAvatar}>{initials}</div>
                        <div className={styles.studentInfo}>
                          <h4 className={styles.studentName}>{student.name}</h4>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Enrolled Student</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activeTab === 'sessions' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className={styles.sectionTitle}>Sessions Calendar</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                {sessions.length === 0 ? (
                  <div className={styles.emptyState}>No sessions scheduled yet.</div>
                ) : (
                  sessions.map(session => {
                    const d = new Date(session.date);
                    const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
                    const day = d.getDate();
                    const dayOfWeek = d.toLocaleString('default', { weekday: 'short' }).toUpperCase();
                    const isLive = session.status === 'Live';

                    return (
                      <div 
                        key={session.id} 
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '16px', 
                          padding: '16px', background: '#fff', borderRadius: '12px', 
                          border: isLive ? '2px solid #10b981' : '1px solid #e2e8f0',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        <div style={{ 
                          display: 'flex', flexDirection: 'column', alignItems: 'center', 
                          background: '#f1f5f9', padding: '8px 12px', borderRadius: '8px', minWidth: '54px' 
                        }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>{month}</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{day}</span>
                          <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8' }}>{dayOfWeek}</span>
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{session.title}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.85rem', color: '#64748b' }}>
                            <span>{session.startTime} - {session.endTime}</span>
                            <span>•</span>
                            <span>{session.duration} mins</span>
                            {session.platform && (
                              <>
                                <span>•</span>
                                <span>{session.platform}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ 
                            fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '99px',
                            backgroundColor: isLive ? '#dcfce7' : session.status === 'Upcoming' ? '#eff6ff' : '#f1f5f9',
                            color: isLive ? '#15803d' : session.status === 'Upcoming' ? '#1d4ed8' : '#475569'
                          }}>
                            {session.status}
                          </span>
                          
                          {isLive && session.meetingLink && (
                            <button 
                              onClick={() => window.open(session.meetingLink || '', '_blank')}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Video size={14} /> Join Meeting
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Schedule Panel */}
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
