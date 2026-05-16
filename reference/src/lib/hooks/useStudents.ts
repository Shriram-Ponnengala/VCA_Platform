'use client';

import { useState, useEffect } from 'react';

export interface Student {
  id: string;
  userId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  name: string;
  email: string;
  parentFirstName: string;
  parentMiddleName?: string;
  parentLastName: string;
  parentName: string;
  mobile: string;
  countryCode: string;
  secParentFirstName?: string;
  secParentMiddleName?: string;
  secParentLastName?: string;
  dob: string;
  country: string;
  city: string;
  status: 'active' | 'inactive';
  memberSince: string;
  program?: string; // Default or assigned program
}

const INITIAL_STUDENTS: Student[] = [
  {
    id: 's1',
    firstName: 'Arjun',
    lastName: 'Kumar',
    name: 'Arjun Kumar',
    email: 'arjun.k@example.com',
    parentFirstName: 'Amit',
    parentLastName: 'Kumar',
    parentName: 'Amit Kumar',
    mobile: '9876543210',
    countryCode: '+91',
    dob: '2015-05-20',
    country: 'India',
    city: 'Mumbai',
    status: 'active',
    memberSince: '2023-01-10',
    program: 'Pawn Batch'
  },
  {
    id: 's2',
    firstName: 'Priya',
    lastName: 'Sharma',
    name: 'Priya Sharma',
    email: 'priya.s@example.com',
    parentFirstName: 'Rajesh',
    parentLastName: 'Sharma',
    parentName: 'Rajesh Sharma',
    mobile: '9876543211',
    countryCode: '+91',
    dob: '2014-08-15',
    country: 'India',
    city: 'Delhi',
    status: 'active',
    memberSince: '2023-02-12',
    program: 'Rook Batch'
  },
  {
    id: 's3',
    firstName: 'Alice',
    lastName: 'Smith',
    name: 'Alice Smith',
    email: 'alice.s@example.com',
    parentFirstName: 'Bob',
    parentLastName: 'Smith',
    parentName: 'Bob Smith',
    mobile: '1234567890',
    countryCode: '+1',
    dob: '2016-03-10',
    country: 'USA',
    city: 'New York',
    status: 'active',
    memberSince: '2023-03-05',
    program: 'Pawn Batch'
  }
];

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchStudents = async () => {
    console.log('[Hook] useStudents: Fetching students from API...');
    try {
      const res = await fetch('/api/users?role=STUDENT');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch students');
      }
      const data = await res.json();
      console.log(`[Hook] useStudents: Successfully fetched ${data.length} students`);
      const mapped = data.map((u: any) => {
        const studentProfile = u.student || {};
        return {
          ...u,
          ...studentProfile,
          id: studentProfile.id, // Primary ID is now student.id
          userId: u.id,         // Keep userId for API calls
          name: `${u.firstName || ''} ${u.middleName ? u.middleName + ' ' : ''}${u.lastName || ''}`.trim() || u.username,
          parentName: `${studentProfile.parentFirstName || ''} ${studentProfile.parentMiddleName ? studentProfile.parentMiddleName + ' ' : ''}${studentProfile.parentLastName || ''}`.trim(),
          memberSince: u.createdAt ? u.createdAt.split('T')[0] : '',
          status: u.status || 'active'
        };
      });
      setStudents(mapped);
      setIsLoaded(true);
    } catch (e) {
      console.error('[Hook] useStudents: Fetch error:', e);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const addStudent = async (studentData: Omit<Student, 'id' | 'name' | 'parentName' | 'memberSince' | 'status'>) => {
    console.log('[Hook] useStudents: Adding student...', studentData.email);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...studentData,
          username: studentData.email, // Use email as username
          role: 'STUDENT'
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error('[Hook] useStudents: Add failed:', err.error);
        throw new Error(err.error || 'Failed to add student');
      }
      console.log('[Hook] useStudents: Student added successfully');
      await fetchStudents();
      return true;
    } catch (error: any) {
      console.error('[Hook] useStudents: Add error:', error.message);
      throw error;
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      const student = students.find(s => s.id === id);
      const targetId = student ? student.userId : id;
      
      const res = await fetch(`/api/users/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update student');
      await fetchStudents();
    } catch (error: any) {
      console.error('[Hook] useStudents: Update error:', error.message);
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const student = students.find(s => s.id === id);
      const targetId = student ? student.userId : id;

      const res = await fetch(`/api/users/${targetId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete student');
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (error: any) {
      console.error('[Hook] useStudents: Delete error:', error.message);
      throw error;
    }
  };

  return {
    students,
    isLoaded,
    addStudent,
    updateStudent,
    deleteStudent,
    refresh: fetchStudents
  };
}
