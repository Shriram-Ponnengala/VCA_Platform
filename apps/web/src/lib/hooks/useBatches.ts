'use client';

import { useState, useEffect } from 'react';

export interface BatchHistoryRecord {
  id: string;
  date: string;
  day: string;
  presentCount: number;
  totalCount: number;
  status: 'completed' | 'cancelled' | 'makeup';
  attendanceRecords: { studentId: string; status: 'present' | 'absent' | 'makeup' }[];
}

export interface Batch {
  id: string;
  name: string;
  program: string;
  coach?: string;
  coachId: string;
  type: 'Group' | 'One-on-One';
  startDate: string;
  days: string[];
  startTime: string;
  endTime: string;
  students: string[]; // array of student IDs
  studentDetails: { id: string; name: string }[];
  status: 'active' | 'inactive';
  history: BatchHistoryRecord[];
}

const INITIAL_BATCHES: Batch[] = [
  {
    id: 'b1',
    name: 'Weekend Pawn Beginners',
    program: 'Pawn Batch',
    coach: 'Judit Polgar',
    coachId: 'coach-1',
    type: 'Group',
    startDate: '2023-01-07',
    days: ['SAT', 'SUN'],
    startTime: '10:00',
    endTime: '11:00',
    students: ['s1'],
    studentDetails: [],
    status: 'active',
    history: []
  },
  {
    id: 'b2',
    name: 'Advanced Rook Strategy',
    program: 'Rook Batch',
    coach: 'Magnus Carlsen',
    coachId: 'coach-2',
    type: 'Group',
    startDate: '2023-01-04',
    days: ['WED', 'FRI'],
    startTime: '18:00',
    endTime: '19:30',
    students: ['s1', 's2'],
    studentDetails: [],
    status: 'active',
    history: [
      {
        id: 'h1',
        date: '2023-01-04',
        day: 'Wednesday',
        presentCount: 2,
        totalCount: 2,
        status: 'completed',
        attendanceRecords: [
          { studentId: 's1', status: 'present' },
          { studentId: 's2', status: 'present' }
        ]
      }
    ]
  }
];

export function useBatches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/batches');
      if (!res.ok) throw new Error('Failed to fetch batches');
      const data = await res.json();
      const mapped = data.map((b: any) => ({
        ...b,
        name: b.className || b.name,
        coach: b.coach?.user?.username || b.coach?.username || 'No Coach',
        coachId: b.coach?.userId || b.coachId,
        students: (b.enrollments || []).map((e: any) => e.student?.id || e.studentId),
        studentDetails: (b.enrollments || []).map((e: any) => ({
          id: e.student?.id || e.studentId,
          name: e.student?.user ? `${e.student.user.firstName} ${e.student.user.lastName}` : 'Unknown Student'
        }))
      }));
      setBatches(mapped);
      setIsLoaded(true);
    } catch (err: any) {
      setError(err.message);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const addBatch = async (batch: Omit<Batch, 'id' | 'students' | 'history' | 'status' | 'studentDetails'>) => {
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });
      if (!res.ok) throw new Error('Failed to create batch');
      const newBatch = await res.json();
      const flattened = {
        ...newBatch,
        name: newBatch.className || newBatch.name,
        coach: newBatch.coach?.user?.username || newBatch.coach?.username || 'No Coach',
        coachId: newBatch.coach?.userId || newBatch.coachId,
        students: [],
        studentDetails: [],
        history: []
      };
      setBatches(prev => [flattened, ...prev]);
      return newBatch.id;
    } catch (err: any) {
      console.error('[Hook] useBatches: Create failed:', err.message);
      throw err;
    }
  };

  const updateBatch = async (id: string, updates: Partial<Batch>) => {
    try {
      const res = await fetch(`/api/batches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update batch');
      setBatches(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    } catch (err: any) {
      console.error('[Hook] useBatches: Update failed:', err.message);
      throw err;
    }
  };

  const deleteBatch = async (id: string) => {
    try {
      const res = await fetch(`/api/batches/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete batch');
      setBatches(prev => prev.filter(b => b.id !== id));
    } catch (err: any) {
      console.error('[Hook] useBatches: Delete failed:', err.message);
      throw err;
    }
  };

  const enrollStudent = async (batchId: string, studentId: string) => {
    try {
      const res = await fetch(`/api/batches/${batchId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      if (!res.ok) throw new Error('Failed to enroll student');
      setBatches(prev => prev.map(b => {
        if (b.id === batchId && !b.students.includes(studentId)) {
          return { ...b, students: [...b.students, studentId] };
        }
        return b;
      }));
    } catch (err: any) {
      console.error('[Hook] useBatches: Enroll failed:', err.message);
      throw err;
    }
  };

  const unenrollStudent = async (batchId: string, studentId: string) => {
    try {
      const res = await fetch(`/api/batches/${batchId}/enroll`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      if (!res.ok) throw new Error('Failed to unenroll student');
      setBatches(prev => prev.map(b => {
        if (b.id === batchId) {
          return { ...b, students: b.students.filter(id => id !== studentId) };
        }
        return b;
      }));
    } catch (err: any) {
      console.error('[Hook] useBatches: Unenroll failed:', err.message);
      throw err;
    }
  };

  const addHistoryRecord = async (batchId: string, record: Omit<BatchHistoryRecord, 'id'>) => {
    // History logic will be part of the Attendance API implementation
    console.warn('addHistoryRecord not yet fully implemented with API');
  };

  return {
    batches,
    isLoaded,
    error,
    addBatch,
    updateBatch,
    deleteBatch,
    enrollStudent,
    unenrollStudent,
    addHistoryRecord,
    refresh: fetchBatches
  };
}

export const MOCK_STUDENTS = [
  { id: 's1', name: 'Arjun Kumar', email: 'arjun.k@example.com' },
  { id: 's2', name: 'Priya Sharma', email: 'priya.s@example.com' },
  { id: 's3', name: 'Rohan Patel', email: 'rohan.p@example.com' },
];

export const MOCK_COACHES = [
  'Magnus Carlsen',
  'Judit Polgar',
  'Shriram Ponnengala',
  'Viswanathan Anand',
  'Garry Kasparov'
];

export const PROGRAM_OPTIONS = [
  'Pawn Batch',
  'Knight Batch',
  'Bishop Batch',
  'Rook Batch',
  'Queen Batch',
  'King Batch'
];
