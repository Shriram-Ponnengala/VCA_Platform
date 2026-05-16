'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, BookOpen, Plus, X as XIcon, ClipboardCheck } from 'lucide-react';
import { useBatches } from '@/lib/hooks/useBatches';
import { useStudents } from '@/lib/hooks/useStudents';
import { BatchModal } from '../BatchModal';
import { MarkAttendanceModal } from './MarkAttendanceModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import styles from './batchDetail.module.css';

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { batches, isLoaded, updateBatch, deleteBatch, enrollStudent, unenrollStudent, addHistoryRecord } = useBatches();
  const { students: allStudents, isLoaded: studentsLoaded } = useStudents();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [isAddStudentMode, setIsAddStudentMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const batchId = params.id as string;
  const batch = batches.find(b => b.id === batchId);

  if (!isLoaded || !studentsLoaded) return <div className={styles.container}>Loading...</div>;
  
  if (!batch) {
    return (
      <div className={styles.container}>
        <button className={styles.backLink} onClick={() => router.push('/dashboard/admin/batches')}>
          <ArrowLeft size={16} /> Back to Batches
        </button>
        <h2>Batch not found</h2>
      </div>
    );
  }

  const safeStudents = Array.isArray(batch.students) ? batch.students : [];
  const enrolledStudents = allStudents.filter(s => safeStudents.includes(s.id));
  const availableStudents = allStudents.filter(s => !safeStudents.includes(s.id));

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
    if (confirm(`Remove ${studentName} from this batch?`)) {
      unenrollStudent(batch.id, studentId);
    }
  };

  const handleSaveAttendance = (date: string, day: string, records: { studentId: string; status: 'present' | 'absent' | 'makeup' }[]) => {
    const presentCount = records.filter(r => r.status === 'present').length;
    addHistoryRecord(batch.id, {
      date,
      day,
      presentCount,
      totalCount: records.length,
      status: 'completed',
      attendanceRecords: records
    });
  };

  return (
    <div className={styles.container}>
      <button className={styles.backLink} onClick={() => router.push('/dashboard/admin/batches')}>
        <ArrowLeft size={16} /> Batches &gt; {batch.name}
      </button>

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
        <div className={styles.actions}>
          <button className={styles.markAttBtn} onClick={() => setIsMarkAttendanceOpen(true)}>
            Mark Attendance
          </button>
          <button className={styles.editBtn} onClick={() => setIsEditModalOpen(true)}>Edit Batch</button>
          <button className={styles.deleteBtn} onClick={handleDelete}>Delete</button>
        </div>
      </header>

      <div className={styles.mainContent}>
        <div className={styles.leftCol}>
          {/* Section 1: Enrolled Students */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Enrolled Students ({enrolledStudents.length})</h2>
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
                    value={selectedStudentId} // Reusing this for search text
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
                {enrolledStudents.map(student => (
                  <div key={student.id} className={styles.studentCard}>
                    <div className={styles.studentInfo}>
                      <h4 className={styles.studentName}>{student.name}</h4>
                      <p className={styles.studentEmail}>{student.email}</p>
                    </div>
                    <button 
                      className={styles.removeBtn} 
                      onClick={() => handleRemoveStudent(student.id, student.name)}
                    >
                      <XIcon size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 2: History */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>History</h2>
            </div>
            {batch.history && batch.history.length > 0 ? (
              <table className={styles.historyTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Students Present</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.history.map(record => (
                    <tr key={record.id} className={styles.historyRow}>
                      <td>{record.date}</td>
                      <td>{record.day}</td>
                      <td>{record.presentCount}/{record.totalCount}</td>
                      <td style={{ textTransform: 'capitalize' }}>{record.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyState}>No classes conducted yet</div>
            )}
          </section>
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

      <BatchModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
        initialData={batch}
      />

      <MarkAttendanceModal
        isOpen={isMarkAttendanceOpen}
        onClose={() => setIsMarkAttendanceOpen(false)}
        students={enrolledStudents}
        onSave={handleSaveAttendance}
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
    </div>
  );
}
