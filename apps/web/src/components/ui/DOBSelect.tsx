import React, { useState, useEffect } from 'react';
import styles from './DOBSelect.module.css';

interface DOBSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export function DOBSelect({ value, onChange, error, className = '' }: DOBSelectProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      if (y) setYear(y);
      if (m) setMonth(m.replace(/^0+/, ''));
      if (d) setDay(d.replace(/^0+/, ''));
    } else {
      setDay('');
      setMonth('');
      setYear('');
    }
  }, [value]);

  const handleUpdate = (type: 'day' | 'month' | 'year', val: string) => {
    let newD = type === 'day' ? val : day;
    let newM = type === 'month' ? val : month;
    let newY = type === 'year' ? val : year;

    if (type === 'day') setDay(val);
    if (type === 'month') setMonth(val);
    if (type === 'year') setYear(val);

    if (newD && newM && newY) {
      const pd = newD.padStart(2, '0');
      const pm = newM.padStart(2, '0');
      onChange(`${newY}-${pm}-${pd}`);
    } else {
      onChange('');
    }
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className={styles.container}>
        <select 
          value={day} 
          onChange={e => handleUpdate('day', e.target.value)} 
          className={`${styles.select} ${error ? styles.errorBorder : ''}`}
        >
          <option value="">Day</option>
          {days.map(d => <option key={d} value={d.toString()}>{d}</option>)}
        </select>
        
        <select 
          value={month} 
          onChange={e => handleUpdate('month', e.target.value)} 
          className={`${styles.select} ${error ? styles.errorBorder : ''}`}
        >
          <option value="">Month</option>
          {months.map((m, i) => <option key={m} value={(i + 1).toString()}>{m}</option>)}
        </select>

        <select 
          value={year} 
          onChange={e => handleUpdate('year', e.target.value)} 
          className={`${styles.select} ${error ? styles.errorBorder : ''}`}
        >
          <option value="">Year</option>
          {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
        </select>
      </div>
    </div>
  );
}
