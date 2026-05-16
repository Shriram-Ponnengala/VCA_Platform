'use client';

import React, { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useBatches } from '@/lib/hooks/useBatches';
import { useAttendance } from '@/lib/hooks/useAttendance';
import styles from './attendance.module.css';

export default function AttendancePage() {
  const { batches, isLoaded } = useBatches();
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { 
    records, 
    isLoading: isAttendanceLoading, 
    saveAttendance 
  } = useAttendance(selectedBatchId, currentDate);

  const [studentsStatus, setStudentsStatus] = useState<Record<string, 'present' | 'absent'>>({});
  const [saveStatus, setSaveStatus] = useState('');

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  useEffect(() => {
    if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  // Sync studentsStatus with fetched records OR selectedBatch students
  useEffect(() => {
    if (selectedBatch) {
      const status: Record<string, 'present' | 'absent'> = {};
      
      // If we have saved records, use them
      if (records.length > 0) {
        records.forEach(r => {
          status[r.studentId] = r.status as 'present' | 'absent';
        });
      } else {
        // Otherwise default to present
        selectedBatch.studentDetails.forEach(student => {
          status[student.id] = 'present';
        });
      }
      setStudentsStatus(status);
    }
  }, [selectedBatchId, selectedBatch, records]);

  const toggleStatus = (studentId: string) => {
    setStudentsStatus(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const handleSave = async () => {
    if (!selectedBatch) return;

    const recordsToSave = Object.entries(studentsStatus).map(([studentId, status]) => ({
      studentId,
      classId: selectedBatch.id,
      date: currentDate,
      status: status as 'present' | 'absent'
    }));

    const success = await saveAttendance(recordsToSave);
    
    if (success) {
      setSaveStatus('Attendance saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } else {
      setSaveStatus('Failed to save attendance.');
    }
  };

  if (!isLoaded) return <div className={styles.container}>Loading batches...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Mark Attendance</h1>
          <div className={styles.batchSelectorWrapper}>
            <select 
              value={selectedBatchId} 
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className={styles.batchSelector}
            >
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <p className={styles.subtitle}>
              {selectedBatch?.program} • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {saveStatus && <span className={styles.saveMessage}>{saveStatus}</span>}
          <Button 
            className={styles.saveBtn} 
            onClick={handleSave} 
            disabled={!selectedBatch || isAttendanceLoading}
          >
            {isAttendanceLoading ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      </div>

      {selectedBatch ? (
        <>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Students</span>
              <span className={styles.statValue}>{selectedBatch.studentDetails.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Present</span>
              <span className={styles.statValue} style={{ color: '#10b981' }}>
                {Object.values(studentsStatus).filter(s => s === 'present').length}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Absent</span>
              <span className={styles.statValue} style={{ color: '#ef4444' }}>
                {Object.values(studentsStatus).filter(s => s === 'absent').length}
              </span>
            </div>
          </div>

          <div className={styles.studentList}>
            {selectedBatch.studentDetails.map((student) => {
              const status = studentsStatus[student.id] || 'present';
              return (
                <div key={student.id} className={styles.studentItem}>
                  <div className={styles.studentInfo}>
                    <div className={styles.avatar}>
                      {student.name.substring(0, 1).toUpperCase()}
                    </div>
                    <span className={styles.studentName}>{student.name}</span>
                  </div>
                  <div className={styles.statusActions}>
                    <button 
                      onClick={() => toggleStatus(student.id)}
                      className={status === 'present' ? styles.presentBtn : styles.absentBtn}
                    >
                      {status.toUpperCase()}
                    </button>
                  </div>
                </div>
              );
            })}
            {selectedBatch.studentDetails.length === 0 && (
              <p className={styles.emptyText}>No students enrolled in this batch.</p>
            )}
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <p>No batches found. Please contact admin.</p>
        </div>
      )}
    </div>
  );
}
