'use client';

import React from 'react';
import { CheckCircle2, XCircle, Calendar } from 'lucide-react';
import styles from './attendance.module.css';

export default function StudentAttendancePage() {
  const attendanceData = [
    { date: '2026-04-24', status: 'PRESENT', class: 'Intermediate Strategy' },
    { date: '2026-04-22', status: 'PRESENT', class: 'Intermediate Strategy' },
    { date: '2026-04-20', status: 'ABSENT', class: 'Intermediate Strategy' },
    { date: '2026-04-17', status: 'PRESENT', class: 'Intermediate Strategy' },
    { date: '2026-04-15', status: 'PRESENT', class: 'Intermediate Strategy' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Attendance History</h1>
        <p className={styles.subtitle}>Track your class participation and consistency.</p>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Overall Attendance</span>
          <h2 className={styles.summaryValue}>80%</h2>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Classes</span>
          <h2 className={styles.summaryValue}>5</h2>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Days Present</span>
          <h2 className={styles.summaryValue} style={{ color: '#10b981' }}>4</h2>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Days Absent</span>
          <h2 className={styles.summaryValue} style={{ color: '#ef4444' }}>1</h2>
        </div>
      </div>

      <div className={styles.historyList}>
        {attendanceData.map((item, index) => (
          <div key={index} className={styles.historyItem}>
            <div className={styles.itemDate}>
              <Calendar size={18} />
              <span>{item.date}</span>
            </div>
            <div className={styles.itemClass}>{item.class}</div>
            <div className={item.status === 'PRESENT' ? styles.statusPresent : styles.statusAbsent}>
              {item.status === 'PRESENT' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <span>{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
