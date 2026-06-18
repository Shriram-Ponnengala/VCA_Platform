'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Home, ChevronRight, MoreHorizontal, User, BookOpen, Plus, X as XIcon, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useBatches } from '@/lib/hooks/useBatches';
import { useStudents } from '@/lib/hooks/useStudents';
import { useSessions } from '@/lib/hooks/useSessions';
import { extractBatchId } from '@/lib/utils/urlUtils';
import { BatchModal } from '../BatchModal';
import { ConfirmModal } from '@vca/ui';
import styles from '../../../shared-batchDetail.module.css';

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { batches, isLoaded, updateBatch, deleteBatch, enrollStudent, unenrollStudent } = useBatches();
  const { students: allStudents, isLoaded: studentsLoaded } = useStudents();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddStudentMode, setIsAddStudentMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isRemoveStudentModalOpen, setIsRemoveStudentModalOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'history'>('students');

  const rawId = decodeURIComponent(params.id as string);
  const batchId = extractBatchId(rawId, batches);
  const batch = batches.find(b => b.id === batchId);

  const { sessions, isLoaded: sessionsLoaded } = useSessions(batchId);

  if (!isLoaded || !studentsLoaded || !sessionsLoaded) return <div className={styles.container}>Loading...</div>;
  
  if (!batch) {
    return (
      <div className={styles.container}>
        <h2>Batch not found</h2>
      </div>
    );
  }

  const safeStudents = Array.isArray(batch.students) ? batch.students : [];
  const enrolledStudents = allStudents.filter(s => safeStudents.includes(s.id));
  const availableStudents = allStudents.filter(s => !safeStudents.includes(s.id));

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleEditSave = (data: any) => {
    updateBatch(batch.id, data);
    setIsEditModalOpen(false);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteBatch(batch.id);
    router.push('/dashboard/admin/batches');
  };

  const handleEnroll = () => {
    if (selectedStudentId) {
      enrollStudent(batch.id, selectedStudentId);
      setIsAddStudentMode(false);
      setSelectedStudentId('');
    }
  };

  const handleRemoveStudent = (studentId: string, studentName: string) => {
    setStudentToRemove({ id: studentId, name: studentName });
    setIsRemoveStudentModalOpen(true);
  };

  const confirmRemoveStudent = () => {
    if (studentToRemove) {
      unenrollStudent(batch.id, studentToRemove.id);
      setIsRemoveStudentModalOpen(false);
      setStudentToRemove(null);
    }
  };

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
        <div className={styles.headerActions}>
          <button className={styles.editBtn} onClick={() => setIsEditModalOpen(true)}>
            <Edit size={16} /> Edit Batch
          </button>
          <button className={styles.deleteBtn} onClick={handleDelete} title="Delete Batch">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Students</span>
          <span className={styles.statValue}>{enrolledStudents.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Sessions held</span>
          <span className={styles.statValue}>12</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Attendance</span>
          <span className={styles.statValue}>92%</span>
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
              className={`${styles.tab} ${activeTab === 'students' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('students')}
            >
              Students ({enrolledStudents.length})
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Session history
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'students' && (
              <>
                <div className={styles.tabContentHeader}>
                  {!isAddStudentMode && (
                    <button className={styles.addStudentBtn} onClick={() => setIsAddStudentMode(true)}>
                      <Plus size={16} /> Add Student
                    </button>
                  )}
                </div>

                {isAddStudentMode && (
                  <div className={styles.addStudentSearchArea}>
                    <div className={styles.searchWrapper}>
                      <input 
                        type="text" 
                        placeholder="Search students to add..." 
                        className={styles.searchInnerInput}
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        autoFocus
                      />
                      <button className={styles.closeSearch} onClick={() => { setIsAddStudentMode(false); setSelectedStudentId(''); }}>
                        <XIcon size={18} />
                      </button>
                    </div>
                    
                    <div className={styles.studentSearchResults}>
                      {availableStudents
                        .filter(s => s.name.toLowerCase().includes(selectedStudentId.toLowerCase()))
                        .slice(0, 5)
                        .map(student => (
                          <div key={student.id} className={styles.searchResultItem}>
                            <div className={styles.resultInfo}>
                              <span className={styles.resultName}>{student.name}</span>
                              <span className={styles.resultEmail}>{student.email}</span>
                            </div>
                            <button 
                              className={styles.quickAddBtn}
                              onClick={() => {
                                enrollStudent(batch.id, student.id);
                                setSelectedStudentId('');
                              }}
                            >
                              <Plus size={14} /> Add
                            </button>
                          </div>
                        ))
                      }
                      {availableStudents.length === 0 && (
                        <p className={styles.noResults}>All students are already enrolled.</p>
                      )}
                    </div>
                  </div>
                )}


                {enrolledStudents.length === 0 ? (
                  <div className={styles.emptyState}>No students enrolled yet</div>
                ) : (
                  <div className={styles.studentList}>
                    {enrolledStudents.map(student => {
                      const initials = student.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                      const displayUsername = student.name.toLowerCase().replace(' ', '_');
                      return (
                        <div key={student.id} className={styles.studentCard}>
                          <div className={styles.studentInfo}>
                            <div className={styles.avatar}>{initials}</div>
                            <div className={styles.studentDetails}>
                              <h4 className={styles.studentName}>{displayUsername}</h4>
                              <p className={styles.studentAttendance}>11 / 12 attended</p>
                            </div>
                          </div>
                          <button 
                            className={styles.moreBtn} 
                            onClick={() => handleRemoveStudent(student.id, student.name)}
                            title="Remove Student"
                          >
                            <MoreHorizontal size={20} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'history' && (
              <div className={styles.sessionHistoryList}>
                {sortedSessions.length === 0 ? (
                  <div className={styles.emptyState}>No session history available yet.</div>
                ) : (
                  sortedSessions.map((session, index) => {
                    const d = new Date(session.date);
                    const formattedDate = d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    
                    let attendanceTextJsx = <span className={styles.textGreen}>2 present</span>;
                    if (index === 1 || session.title.includes('8')) {
                       attendanceTextJsx = <><span className={styles.textGreen}>1 present</span> · <span className={styles.textRed}>1 absent</span></>;
                    } else if (index === 2 || session.title.includes('7')) {
                       attendanceTextJsx = <><span className={styles.textGreen}>1 present</span> · <span className={styles.textOrange}>1 compensated</span></>;
                    }

                    return (
                      <div 
                        key={session.id} 
                        className={styles.sessionHistoryCard}
                        onClick={() => router.push(`/dashboard/admin/batches/${params.id}/sessions/${session.id}`)}
                      >
                        <div className={styles.sessionHistoryInfo}>
                          <span className={styles.sessionDate}>{formattedDate}</span>
                          <span className={styles.sessionAttendanceText}>{attendanceTextJsx}</span>
                        </div>
                        <ChevronRight size={18} className={styles.sessionArrow} />
                      </div>
                    );
                  })
                )}
              </div>
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

      <BatchModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
        initialData={batch}
      />

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Batch"
        message="Are you sure you want to delete this batch? All history records for this batch will be lost. Students will remain in the system but will be unenrolled from this batch."
        confirmText="Delete Batch"
        variant="danger"
      />
      <ConfirmModal 
        isOpen={isRemoveStudentModalOpen}
        onClose={() => setIsRemoveStudentModalOpen(false)}
        onConfirm={confirmRemoveStudent}
        title="Remove Student"
        message={`Are you sure you want to remove ${studentToRemove?.name} from this batch? Their attendance history for this batch will be preserved but they will no longer appear in the active list.`}
        confirmText="Remove Student"
        variant="danger"
      />
    </div>
  );
}
