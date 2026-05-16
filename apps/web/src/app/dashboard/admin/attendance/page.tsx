'use client';

import React, { useState } from 'react';
import { Download, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@vca/ui';
import styles from './attendance.module.css';

export default function AttendancePage() {
  const [students, setStudents] = useState([
    { name: 'Alice Smith', attendance: [ 'P', 'P', 'A', 'A', 'P' ], percent: '60%' },
    { name: 'Rohan Gupta', attendance: [ 'P', 'P', 'P', 'A', 'A' ], percent: '60%' },
  ]);

  const dates = ['Apr 20', 'Apr 22', 'Apr 24', 'Apr 27', 'Apr 29'];

  const toggleStatus = (studentIdx: number, dateIdx: number) => {
    const nextStatus: Record<string, string> = { 'P': 'A', 'A': 'M', 'M': 'P' };
    setStudents(prev => {
      const updated = [...prev];
      const student = { ...updated[studentIdx] };
      student.attendance = [...student.attendance];
      student.attendance[dateIdx] = nextStatus[student.attendance[dateIdx]] || 'P';
      
      // Recalculate percent
      const presentCount = student.attendance.filter(s => s === 'P').length;
      student.percent = `${Math.round((presentCount / student.attendance.length) * 100)}%`;
      
      updated[studentIdx] = student;
      return updated;
    });
  };

  // Recalculate column averages
  const getColumnAverage = (dateIdx: number) => {
    let presentCount = 0;
    students.forEach(s => {
      if (s.attendance[dateIdx] === 'P') presentCount++;
    });
    return `${Math.round((presentCount / students.length) * 100)}%`;
  };

  const getOverallAverage = () => {
    let totalP = 0;
    let totalSlots = students.length * dates.length;
    students.forEach(s => {
      totalP += s.attendance.filter(st => st === 'P').length;
    });
    return `${Math.round((totalP / totalSlots) * 100)}%`;
  };

  const exportToCSV = () => {
    const header = ['STUDENT NAME', ...dates, 'ATTENDANCE %'];
    const rows = students.map(s => [s.name, ...s.attendance, s.percent]);
    const avgRow = ['AVERAGE', ...dates.map((_, i) => getColumnAverage(i)), getOverallAverage()];
    
    const csvContent = [
      header.join(','),
      ...rows.map(r => r.join(',')),
      avgRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'attendance_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Attendance</h1>
          <p className={styles.subtitle}>Track and manage class participation</p>
        </div>
        <Button className={styles.exportBtn} onClick={exportToCSV}>
          <Download size={18} />
          Export to CSV
        </Button>
      </header>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <div className={styles.dropdown}>
            <select className={styles.nativeSelect}>
              <option>Weekend Pawn Beginners</option>
              <option>Advanced Rook Strategy</option>
            </select>
          </div>
          <div className={styles.datePicker}>
            <CalendarIcon size={18} className={styles.dateIcon} />
            <input type="month" className={styles.nativeMonth} defaultValue="2026-04" />
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.studentCol}>STUDENT NAME</th>
              {dates.map(date => (
                <th key={date} className={styles.dateCol}>{date}</th>
              ))}
              <th className={styles.statsCol}>ATTENDANCE %</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, i) => (
              <tr key={i}>
                <td className={styles.studentName}>{student.name}</td>
                {student.attendance.map((status, idx) => (
                  <td key={idx}>
                    <div className={styles.statusToggle}>
                      <button 
                        className={`${styles.statusBtn} ${status === 'P' ? styles.present : status === 'A' ? styles.absent : styles.makeup}`}
                        onClick={() => toggleStatus(i, idx)}
                      >
                        {status}
                      </button>
                    </div>
                  </td>
                ))}
                <td className={styles.percent}>{student.percent}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>AVERAGE</td>
              {dates.map((_, i) => (
                <td key={i}>{getColumnAverage(i)}</td>
              ))}
              <td>{getOverallAverage()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.dot} ${styles.presentBg}`} />
          <span>Present</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.dot} ${styles.absentBg}`} />
          <span>Absent</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.dot} ${styles.makeupBg}`} />
          <span>Makeup</span>
        </div>
      </div>
    </div>
  );
}
