'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent';
  markedBy?: string;
  timestamp?: string;
}

export function useAttendance(classId?: string, date?: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    if (!classId || !date) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/attendance?classId=${classId}&date=${date}`);
      if (!res.ok) throw new Error('Failed to fetch attendance');
      const data = await res.json();
      setRecords(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [classId, date]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const saveAttendance = async (recordsToSave: Omit<AttendanceRecord, 'id'>[]) => {
    if (!classId || !date) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          date,
          records: recordsToSave
        }),
      });
      if (!res.ok) throw new Error('Failed to save attendance');
      const savedData = await res.json();
      setRecords(savedData);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    records,
    isLoading,
    error,
    saveAttendance,
    refresh: fetchAttendance
  };
}
