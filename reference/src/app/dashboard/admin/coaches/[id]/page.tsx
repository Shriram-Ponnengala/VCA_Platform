'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useCoaches } from '@/lib/hooks/useCoaches';
import { useBatches, Batch, BatchHistoryRecord, MOCK_STUDENTS } from '@/lib/hooks/useBatches';
import { AddCoachModal } from '../AddCoachModal';
import styles from './coachDetail.module.css';

export default function CoachProfilePage() {
  const params = useParams();
  const router = useRouter();
  
  const { coaches, isLoaded: coachesLoaded, updateCoach, deleteCoach } = useCoaches();
  const { batches, isLoaded: batchesLoaded } = useBatches();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const coachId = params.id as string;
  const coach = coaches.find(c => c.id === coachId);

  if (!coachesLoaded || !batchesLoaded) return <div className={styles.container}>Loading...</div>;

  if (!coach) {
    return (
      <div className={styles.container}>
        <button className={styles.backLink} onClick={() => router.push('/dashboard/admin/coaches')}>
          <ArrowLeft size={16} /> Back to Coaches
        </button>
        <h2>Coach not found</h2>
      </div>
    );
  }

  // Derived Data for this coach
  const coachBatches = batches.filter(b => b.coach === coach.name);
  
  // Aggregate all history sessions from these batches
  let allSessions: (BatchHistoryRecord & { batchName: string, type: string })[] = [];
  coachBatches.forEach(b => {
    if (b.history) {
      const batchSessions = b.history.map(h => ({
        ...h,
        batchName: b.name,
        type: b.type
      }));
      allSessions = [...allSessions, ...batchSessions];
    }
  });
  
  // Sort sessions newest first
  allSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const groupSessionsCount = allSessions.filter(s => s.type === 'Group').length;
  const oneOnOneSessionsCount = allSessions.filter(s => s.type === 'One-on-One').length;

  const handleEditSave = (data: any) => {
    updateCoach(coach.id, data);
    setIsEditModalOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete ${coach.name}?\nThis coach will be removed from all assigned batches.\nThis action cannot be undone.`)) {
      try {
        deleteCoach(coach.id);
        router.push('/dashboard/admin/coaches');
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete coach. Your storage might be full.');
      }
    }
  };

  const toggleRow = (id: string) => {
    if (expandedRow === id) setExpandedRow(null);
    else setExpandedRow(id);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backLink} onClick={() => router.push('/dashboard/admin/coaches')}>
          <ArrowLeft size={16} /> Coaches &gt; {coach.name}
        </button>
        <div className={styles.actions}>
          <button className={styles.editBtn} onClick={() => setIsEditModalOpen(true)}>Edit Coach</button>
          <button className={styles.deleteBtn} onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className={styles.profilePanel}>
        <div className={styles.leftProfile}>
          {coach.photo ? (
            <img src={coach.photo} alt={coach.name} className={styles.avatar} />
          ) : (
            <div className={styles.avatar}>{coach.initials}</div>
          )}
          <div className={styles.profileInfo}>
            <h1 className={styles.name}>{coach.name}</h1>
            <p className={styles.role}>CHESS COACH</p>
            <p className={styles.specialization}>"{coach.specialization}"</p>
          </div>
        </div>
        
        <div className={styles.rightProfile}>
          <div className={styles.contactItem}>
            <Mail size={18} className={styles.contactIcon} />
            <span>{coach.email}</span>
          </div>
          <div className={styles.contactItem}>
            <Phone size={18} className={styles.contactIcon} />
            <span>{coach.phone}</span>
          </div>
          {(coach.city || coach.country) && (
            <div className={styles.contactItem}>
              <MapPin size={18} className={styles.contactIcon} />
              <span>{coach.city ? `${coach.city}, ` : ''}{coach.country}</span>
            </div>
          )}
          {coach.dob && (
            <div className={styles.contactItem}>
              <Calendar size={18} className={styles.contactIcon} />
              <span>DOB: {coach.dob}</span>
            </div>
          )}
          <div className={styles.memberSince}>
            Member Since: {new Date(coach.memberSince).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Session History
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className={styles.tabContent}>
          <div className={styles.overviewStats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Classes Taken</span>
              <span className={styles.statValue}>{allSessions.length}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Group Classes</span>
              <span className={styles.statValue}>{groupSessionsCount}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>One-on-One Classes</span>
              <span className={styles.statValue}>{oneOnOneSessionsCount}</span>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Active Batches ({coachBatches.length})</h3>
          <div className={styles.batchList}>
            {coachBatches.map(batch => (
              <div key={batch.id} className={styles.batchCard} onClick={() => router.push(`/dashboard/admin/batches/${batch.id}`)}>
                <div className={styles.batchHeader}>
                  <h4 className={styles.batchName}>{batch.name}</h4>
                  <span className={styles.batchBadge}>{batch.program.split(' ')[0]}</span>
                </div>
                <div className={styles.batchDetails}>
                  <span>{batch.days.join(', ')} • {batch.startTime} - {batch.endTime}</span>
                  <span>{batch.students.length} Students</span>
                </div>
              </div>
            ))}
            {coachBatches.length === 0 && (
              <p style={{ color: '#94a3b8' }}>This coach is not currently assigned to any batches.</p>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.tabContent}>
          <div className={styles.filterBar}>
            <div className={styles.filters}>
              <select className={styles.filterSelect}>
                <option>All Types</option>
                <option>Group</option>
                <option>One-on-One</option>
              </select>
              <select className={styles.filterSelect}>
                <option>All Batches</option>
                {coachBatches.map(b => (
                  <option key={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <button className={styles.exportBtn}>Export CSV</button>
          </div>

          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}>
              Total Sessions: <strong>{allSessions.length}</strong>
            </div>
            <div className={styles.summaryItem}>
              Group Sessions: <strong>{groupSessionsCount}</strong>
            </div>
            <div className={styles.summaryItem}>
              One-on-One: <strong>{oneOnOneSessionsCount}</strong>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            {allSessions.length === 0 ? (
              <div className={styles.emptyState}>
                <Clock size={48} className={styles.emptyStateIcon} />
                <h3 className={styles.emptyStateTitle}>No sessions recorded yet</h3>
                <p className={styles.emptyStateSub}>Sessions will appear here once attendance is marked</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>DAY</th>
                    <th>BATCH NAME</th>
                    <th>TYPE</th>
                    <th>STUDENTS PRESENT</th>
                    <th>STATUS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {allSessions.map(session => (
                    <React.Fragment key={session.id}>
                      <tr className={styles.tableRow} onClick={() => toggleRow(session.id)}>
                        <td>{new Date(session.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td>{session.day}</td>
                        <td>
                          <button 
                            className={styles.batchLink}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/admin/batches/${session.batchId || 'b1'}`);
                            }}
                          >
                            {session.batchName}
                          </button>
                        </td>
                        <td>
                          <span className={`${styles.typeBadge} ${session.type === 'Group' ? styles.group : styles.oneonone}`}>
                            {session.type}
                          </span>
                        </td>
                        <td>{session.presentCount} / {session.totalCount}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[session.status]}`}>
                            {session.status}
                          </span>
                        </td>
                        <td style={{ width: '40px' }}>
                          {expandedRow === session.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                      </tr>
                      {expandedRow === session.id && (
                        <tr className={styles.expandedRow}>
                          <td colSpan={7}>
                            <div className={styles.expandedContent}>
                              <div className={styles.expandedSection}>
                                <h4>Present</h4>
                                <div className={styles.studentPillList}>
                                  {session.attendanceRecords.filter(r => r.status === 'present').map(r => {
                                    const studentName = MOCK_STUDENTS.find(s => s.id === r.studentId)?.name || r.studentId;
                                    return (
                                      <span key={r.studentId} className={`${styles.studentPill} ${styles.present}`}>{studentName}</span>
                                    );
                                  })}
                                  {session.attendanceRecords.filter(r => r.status === 'present').length === 0 && <span>None</span>}
                                </div>
                              </div>
                              <div className={styles.expandedSection}>
                                <h4>Absent</h4>
                                <div className={styles.studentPillList}>
                                  {session.attendanceRecords.filter(r => r.status === 'absent').map(r => {
                                    const studentName = MOCK_STUDENTS.find(s => s.id === r.studentId)?.name || r.studentId;
                                    return (
                                      <span key={r.studentId} className={`${styles.studentPill} ${styles.absent}`}>{studentName}</span>
                                    );
                                  })}
                                  {session.attendanceRecords.filter(r => r.status === 'absent').length === 0 && <span>None</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <AddCoachModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={handleEditSave}
        initialData={coach}
      />
    </div>
  );
}
