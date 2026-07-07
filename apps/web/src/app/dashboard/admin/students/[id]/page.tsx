'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, BookOpen, User } from 'lucide-react';
import { useStudents } from '@/lib/hooks/useStudents';
import { useBatches } from '@/lib/hooks/useBatches';
import { AddStudentModal } from '../AddStudentModal';
import { generateBatchSlug } from '@/lib/utils/urlUtils';
import { ConfirmModal } from '@vca/ui';
import styles from './studentDetail.module.css';

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  
  const { students, isLoaded: studentsLoaded, updateStudent, deleteStudent } = useStudents();
  const { batches, isLoaded: batchesLoaded } = useBatches();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'batches' | 'history'>('batches');
  const [sessions, setSessions] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const studentId = params.id as string;
  const student = students.find(s => s.id === studentId);

  // Derived Data for this student
  const studentBatches = batches.filter(b => b.students.includes(student?.id || ''));

  useEffect(() => {
    if (!student || studentBatches.length === 0) {
      setSessionsLoading(false);
      return;
    }

    const loadData = async () => {
      setSessionsLoading(true);
      try {
        // Fetch sessions for all batches
        const sessionPromises = studentBatches.map(batch =>
          fetch(`/api/sessions/batch/${batch.id}`).then(res => res.ok ? res.json() : [])
        );
        const resolvedSessions = await Promise.all(sessionPromises);
        const allSessions = resolvedSessions.flat();

        // Fetch all attendance records
        const res = await fetch('/api/attendance');
        const allAttendance = res.ok ? await res.json() : [];

        setSessions(allSessions);
        setAttendanceRecords(allAttendance);
      } catch (err) {
        console.error('Failed to load session/attendance history:', err);
      } finally {
        setSessionsLoading(false);
      }
    };

    loadData();
  }, [student, batches]); // Re-run when student or batches load/update

  if (!studentsLoaded || !batchesLoaded) return <div className={styles.container}>Loading...</div>;

  if (!student) {
    return (
      <div className={styles.container}>
        <h2>Student not found</h2>
      </div>
    );
  }



  const handleEditSave = (data: any) => {
    updateStudent(student.id, data);
    setIsEditModalOpen(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.actions}>
          <button className={styles.editBtn} onClick={() => setIsEditModalOpen(true)}>Edit Student</button>
          <button className={styles.deleteBtn} onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className={styles.profilePanel}>
        <div className={styles.leftProfile}>
          <div 
            className={styles.avatar} 
            style={{ 
              backgroundImage: student.profilePhoto ? `url(${student.profilePhoto})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {!student.profilePhoto && <User size={64} />}
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.name}>{student.name}</h1>
            {student.username && <p className={styles.username}>@{student.username}</p>}
            <p className={styles.role}>STUDENT</p>
            <p className={styles.programTag}>Enrolled in: {student.program || 'No Program'}</p>
          </div>
        </div>
        
        <div className={styles.rightProfile}>
          <div className={styles.contactItem}>
            <Mail size={18} className={styles.contactIcon} />
            <span>{student.email}</span>
          </div>
          <div className={styles.contactItem}>
            <Phone size={18} className={styles.contactIcon} />
            <span>{student.countryCode} {student.mobile}</span>
          </div>
          <div className={styles.contactItem}>
            <MapPin size={18} className={styles.contactIcon} />
            <span>{student.city}, {student.country}</span>
          </div>
          <div className={styles.contactItem}>
            <Calendar size={18} className={styles.contactIcon} />
            <span>DOB: {student.dob}</span>
          </div>
          <div className={styles.memberSince}>
            Member Since: {new Date(student.memberSince).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className={styles.tabs} style={{ marginBottom: '24px' }}>
        <button 
          className={`${styles.tab} ${activeTab === 'batches' ? styles.active : ''}`}
          onClick={() => setActiveTab('batches')}
        >
          Enrolled Batches
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Session History
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'batches' && (
          <>
            <div className={styles.overviewStats}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Total Batches</span>
                <span className={styles.statValue}>{studentBatches.length}</span>
              </div>
            </div>

            <h3 className={styles.sectionTitle}>Enrolled Batches ({studentBatches.length})</h3>
            <div className={styles.batchList}>
              {studentBatches.map(batch => (
                <div key={batch.id} className={styles.batchCard} onClick={() => router.push(`/dashboard/admin/batches/${generateBatchSlug(batch.id, batch.name, batches)}`)}>
                  <div className={styles.batchHeader}>
                    <h4 className={styles.batchName}>{batch.name}</h4>
                    <span className={styles.batchBadge}>{batch.program.split(' ')[0]}</span>
                  </div>
                  <div className={styles.batchDetails}>
                    <span>Coach: {batch.coach}</span>
                    <span>{batch.days.join(', ')} • {batch.startTime} - {batch.endTime}</span>
                  </div>
                </div>
              ))}
              {studentBatches.length === 0 && (
                <p style={{ color: '#94a3b8' }}>This student is not currently enrolled in any batches.</p>
              )}
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className={styles.sessionHistoryList}>
            {sessionsLoading ? (
              <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading session history...</div>
            ) : [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).length === 0 ? (
              <div className={styles.emptyState}>No session history available yet.</div>
            ) : (
              [...sessions]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((session) => {
                  const d = new Date(session.date);
                  const formattedDate = d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  
                  // Find matching attendance record for this student and session
                  const record = attendanceRecords.find(r => 
                    r.studentId === student.id && 
                    new Date(r.date).toISOString().split('T')[0] === new Date(session.date).toISOString().split('T')[0]
                  );

                  const status = record ? record.status.toLowerCase() : 'unmarked';
                  
                  let badgeClass = styles.badgeUnmarked;
                  let badgeText = 'Unmarked';
                  if (status === 'present') {
                    badgeClass = styles.badgePresent;
                    badgeText = 'Present';
                  } else if (status === 'absent') {
                    badgeClass = styles.badgeAbsent;
                    badgeText = 'Absent';
                  } else if (status === 'compensated') {
                    badgeClass = styles.badgeCompensated;
                    badgeText = 'Compensated';
                  }

                  // Batch name
                  const sessionBatch = studentBatches.find(b => b.id === session.classId);
                  const batchName = sessionBatch ? sessionBatch.name : 'Unknown Batch';

                  return (
                    <div key={session.id} className={styles.sessionHistoryCard}>
                      <div className={styles.sessionHistoryInfo}>
                        <span className={styles.sessionDate}>{formattedDate}</span>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          Batch: <strong>{batchName}</strong> • {session.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span className={badgeClass}>{badgeText}</span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>

      <AddStudentModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={handleEditSave}
        initialData={student}
      />

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          deleteStudent(student.id);
          router.push('/dashboard/admin/students');
        }}
        title="Delete Student"
        message={`Delete student ${student?.name || ''}? This will remove them from all batches. This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
