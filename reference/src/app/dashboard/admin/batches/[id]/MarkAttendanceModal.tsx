'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './MarkAttendanceModal.module.css';

interface Student {
  id: string;
  name: string;
}

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onSave: (date: string, day: string, records: { studentId: string; status: 'present' | 'absent' | 'makeup' }[]) => void;
}

export function MarkAttendanceModal({ isOpen, onClose, students, onSave }: MarkAttendanceModalProps) {
  const [date, setDate] = useState('');
  const [records, setRecords] = useState<Record<string, 'present' | 'absent' | 'makeup'>>({});

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      const initialRecords: Record<string, 'present' | 'absent' | 'makeup'> = {};
      students.forEach(s => {
        initialRecords[s.id] = 'present'; // Default to present
      });
      setRecords(initialRecords);
    }
  }, [isOpen, students]);

  if (!isOpen) return null;

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'makeup') => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = () => {
    if (!date) return;
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const attendanceArray = Object.entries(records).map(([id, status]) => ({
      studentId: id,
      status
    }));
    onSave(date, dayName, attendanceArray);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Mark Attendance</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.dateRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>CLASS DATE *</label>
              <input 
                type="date" 
                className={styles.input} 
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.studentList}>
            {students.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No students enrolled in this batch.</p>
            ) : (
              students.map(student => (
                <div key={student.id} className={styles.studentCard}>
                  <h4 className={styles.studentName}>{student.name}</h4>
                  <div className={styles.toggleGroup}>
                    <button 
                      className={`${styles.statusBtn} ${records[student.id] === 'present' ? styles.activeP : ''}`}
                      onClick={() => handleStatusChange(student.id, 'present')}
                    >
                      P
                    </button>
                    <button 
                      className={`${styles.statusBtn} ${records[student.id] === 'absent' ? styles.activeA : ''}`}
                      onClick={() => handleStatusChange(student.id, 'absent')}
                    >
                      A
                    </button>
                    <button 
                      className={`${styles.statusBtn} ${records[student.id] === 'makeup' ? styles.activeM : ''}`}
                      onClick={() => handleStatusChange(student.id, 'makeup')}
                    >
                      M
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.saveBtn} onClick={handleSave}>
            Save Attendance
          </button>
        </div>
      </div>
    </div>
  );
}
